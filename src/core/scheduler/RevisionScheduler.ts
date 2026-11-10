import { Revision, AttemptStatus } from '../../types';

export const FIXED_INTERVALS = [1, 3, 7, 14, 30];
export const INITIAL_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;
export const LEECH_FAIL_THRESHOLD = 3;
export const LEECH_EF_THRESHOLD = 1.5;

export interface SchedulerConfig {
  hintRecallQuality: number; // default 3: advances interval with slight EF drop
  minEaseFactor: number;
  leechFailThreshold: number;
  leechEfThreshold: number;
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  hintRecallQuality: 3,
  minEaseFactor: MIN_EASE_FACTOR,
  leechFailThreshold: LEECH_FAIL_THRESHOLD,
  leechEfThreshold: LEECH_EF_THRESHOLD,
};

export class RevisionScheduler {
  /**
   * Helper to compute future date by adding days (pure string arithmetic, no system clock).
   */
  public static addDaysToDate(dateStr: string, days: number): string {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
  }

  /**
   * Derives recall quality (0-5) from attempt status and timing:
   * - clean & fast: 5
   * - clean solve: 4
   * - hint: 3 (or configured hintRecallQuality)
   * - failed with progress: 2
   * - failed: 1
   * - gave up: 0
   */
  public static deriveRecallQuality(
    status: AttemptStatus,
    timeTakenMinutes: number = 20,
    config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG
  ): number {
    if (status === 'solved') {
      return timeTakenMinutes <= 15 ? 5 : 4;
    }
    if (status === 'hint') {
      return config.hintRecallQuality;
    }
    return 1;
  }

  /**
   * STEP A: Fixed interval update [1, 3, 7, 14, 30]
   */
  public static updateFixedInterval(
    current: Revision | undefined,
    problemId: string,
    status: AttemptStatus,
    today: string
  ): Revision {
    if (!current) {
      // First attempt on problem
      const initialIdx = status === 'failed' ? 0 : status === 'hint' ? 0 : 1;
      const intervalDays = FIXED_INTERVALS[initialIdx];
      return {
        problem_id: problemId,
        next_due_date: RevisionScheduler.addDaysToDate(today, intervalDays),
        interval_index: initialIdx,
        interval_days: intervalDays,
        ease_factor: INITIAL_EASE_FACTOR,
        repetitions: status === 'solved' ? 1 : 0,
        failed_count: status === 'failed' ? 1 : 0,
        leech_flag: false,
      };
    }

    let nextIndex = current.interval_index;
    let failedCount = current.failed_count;

    if (status === 'failed') {
      nextIndex = 0;
      failedCount += 1;
    } else if (status === 'solved') {
      nextIndex = Math.min(FIXED_INTERVALS.length - 1, current.interval_index + 1);
    } // hint -> index unchanged

    const intervalDays = FIXED_INTERVALS[nextIndex];
    const isLeech = failedCount >= LEECH_FAIL_THRESHOLD;

    return {
      ...current,
      interval_index: nextIndex,
      interval_days: intervalDays,
      next_due_date: RevisionScheduler.addDaysToDate(today, intervalDays),
      failed_count: failedCount,
      leech_flag: isLeech,
      repetitions: status === 'solved' ? current.repetitions + 1 : 0,
    };
  }

  /**
   * STEP C & D: SM-2 Spaced Repetition Algorithm with Leech Quarantine
   */
  public static updateSM2(
    current: Revision | undefined,
    problemId: string,
    recallQuality: number,
    today: string,
    config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG
  ): Revision {
    const q = Math.max(0, Math.min(5, Math.round(recallQuality)));

    // Create revision record if not existing
    const base: Revision = current || {
      problem_id: problemId,
      next_due_date: today,
      interval_index: 0,
      interval_days: 1,
      ease_factor: INITIAL_EASE_FACTOR,
      repetitions: 0,
      failed_count: 0,
      leech_flag: false,
    };

    let { repetitions, ease_factor, failed_count, leech_flag } = base;

    if (q < 3) {
      // Failure
      repetitions = 0;
      failed_count += 1;
      const intervalDays = 1;

      // Check leech thresholds (failed >= 3 or EF < 1.5)
      if (failed_count >= config.leechFailThreshold || ease_factor < config.leechEfThreshold) {
        leech_flag = true;
      }

      return {
        ...base,
        repetitions,
        interval_days: intervalDays,
        next_due_date: RevisionScheduler.addDaysToDate(today, intervalDays),
        failed_count,
        leech_flag,
        // Ease factor is preserved on failure (Anki / SM-2 standard rule)
      };
    }

    // Success (q >= 3)
    repetitions += 1;

    // Calculate updated ease factor: EF' = max(1.3, EF + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    ease_factor = Math.max(config.minEaseFactor, ease_factor + delta);
    ease_factor = Number(ease_factor.toFixed(2));

    // Calculate next interval
    let intervalDays = 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(base.interval_days * ease_factor);
    }

    // If item was a leech, it does not advance past 1 day until quarantined status is cleared
    if (leech_flag) {
      // Two consecutive clean solves (q >= 4 and repetitions >= 2) clears leech status
      if (q >= 4 && repetitions >= 2) {
        leech_flag = false;
        ease_factor = Math.max(config.leechEfThreshold, ease_factor);
      } else {
        // Leeches stay at 1-day interval
        intervalDays = 1;
      }
    }

    // Check leech EF threshold
    if (ease_factor < config.leechEfThreshold) {
      leech_flag = true;
      intervalDays = 1;
    }

    return {
      ...base,
      repetitions,
      ease_factor,
      interval_days: intervalDays,
      next_due_date: RevisionScheduler.addDaysToDate(today, intervalDays),
      failed_count,
      leech_flag,
    };
  }

  /**
   * Manual action to clear leech status when user marks problem as relearned from scratch.
   */
  public static markRelearned(current: Revision, today: string): Revision {
    return {
      ...current,
      leech_flag: false,
      failed_count: 0,
      repetitions: 1,
      interval_days: 1,
      ease_factor: Math.max(INITIAL_EASE_FACTOR, current.ease_factor),
      next_due_date: RevisionScheduler.addDaysToDate(today, 1),
    };
  }
}
