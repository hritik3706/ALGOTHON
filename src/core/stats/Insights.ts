import { Topic, Problem, Attempt, AvoidanceInsight, DailyActivity } from '../../types';

export class InsightsEngine {
  /**
   * Avoidance detection:
   * expected_share = importance / sum(importance);
   * actual_share = topic_attempts / total_attempts.
   * Flag when actual_share < 0.5 * expected_share AND total_attempts >= 20.
   */
  public static computeAvoidance(
    topics: Topic[],
    problems: Problem[],
    attempts: Attempt[]
  ): AvoidanceInsight[] {
    const totalAttempts = attempts.length;
    if (totalAttempts < 20) {
      return [];
    }

    const totalImportance = topics.reduce((acc, t) => acc + t.importance_weight, 0);
    const avoided: AvoidanceInsight[] = [];

    for (const topic of topics) {
      const topicProblemIds = new Set(
        problems
          .filter((p) => p.topic_ids.includes(topic.id))
          .map((p) => p.id)
      );

      const topicAttemptsCount = attempts.filter((a) =>
        topicProblemIds.has(a.problem_id)
      ).length;

      const expectedShare = topic.importance_weight / totalImportance;
      const actualShare = topicAttemptsCount / totalAttempts;

      if (actualShare < 0.5 * expectedShare) {
        avoided.push({
          topic,
          expected_share: Math.round(expectedShare * 100),
          actual_share: Math.round(actualShare * 100),
          attempts: topicAttemptsCount,
        });
      }
    }

    return avoided;
  }

  /**
   * Plateau / velocity detection:
   * Compares success rate of last N attempts vs previous N attempts (N = 5, ring buffer).
   * improving: diff > +0.15
   * regressing: diff < -0.15
   * flat: -0.15 <= diff <= +0.15
   * insufficient_data: total attempts < 2 * N (10)
   */
  public static computePlateau(
    attemptsForTopic: Attempt[],
    N: number = 5
  ): 'improving' | 'flat' | 'regressing' | 'insufficient_data' {
    if (attemptsForTopic.length < 2 * N) {
      return 'insufficient_data';
    }

    // Sort by date descending (newest first)
    const sorted = [...attemptsForTopic].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Ring buffer / slices
    const recentN = sorted.slice(0, N);
    const previousN = sorted.slice(N, 2 * N);

    const isSuccess = (a: Attempt) => a.status === 'solved' || a.status === 'hint';

    const recentRate = recentN.filter(isSuccess).length / N;
    const previousRate = previousN.filter(isSuccess).length / N;

    const diff = recentRate - previousRate;

    if (diff > 0.15) return 'improving';
    if (diff < -0.15) return 'regressing';
    return 'flat';
  }

  /**
   * Consecutive days streak counter:
   * Counts back from today (or from yesterday if today has no attempts yet).
   * Correctly spans month and year boundaries without UTC offset errors.
   */
  public static computeStreak(attempts: Attempt[], todayStr: string): number {
    if (attempts.length === 0) return 0;

    const attemptDates = new Set(attempts.map((a) => a.date));
    let streak = 0;

    const curr = new Date(todayStr + 'T00:00:00Z');
    const todayFormatted = curr.toISOString().split('T')[0];

    // If today has no attempts, start counting from yesterday
    if (!attemptDates.has(todayFormatted)) {
      curr.setUTCDate(curr.getUTCDate() - 1);
    }

    while (true) {
      const dateKey = curr.toISOString().split('T')[0];
      if (attemptDates.has(dateKey)) {
        streak++;
        curr.setUTCDate(curr.getUTCDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Last 7 days activity breakdown
   */
  public static computeLast7Days(attempts: Attempt[], todayStr: string): DailyActivity[] {
    const result: DailyActivity[] = [];
    const baseDate = new Date(todayStr + 'T00:00:00Z');

    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(baseDate);
      dayDate.setUTCDate(dayDate.getUTCDate() - i);
      const dStr = dayDate.toISOString().split('T')[0];
      const dayName = dayDate.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'UTC',
      });

      const dayAttempts = attempts.filter((a) => a.date === dStr);
      const solved = dayAttempts.filter(
        (a) => a.status === 'solved' || a.status === 'hint'
      ).length;

      result.push({
        date: dStr,
        day_name: dayName,
        attempts_count: dayAttempts.length,
        solved_count: solved,
      });
    }

    return result;
  }
}

