import { describe, it, expect } from 'vitest';
import { RevisionScheduler } from '../src/core/scheduler/RevisionScheduler';
import { DueQueue, DueQueueItem } from '../src/core/scheduler/DueQueue';
import { Revision, Problem } from '../src/types';

describe('RevisionScheduler', () => {
  const sampleProblem: Problem = {
    id: 'p1',
    title: 'Two Sum',
    platform: 'LeetCode',
    difficulty: 'easy',
    topic_ids: ['arrays'],
    created_date: '2026-11-01',
  };

  it('updates fixed intervals after failed, hint, and clean results', () => {
    const today = '2026-11-01';

    // 1. Initial clean solve -> index 1 (3 days)
    const rev1 = RevisionScheduler.updateFixedInterval(undefined, 'p1', 'solved', today);
    expect(rev1.interval_index).toBe(1);
    expect(rev1.interval_days).toBe(3);
    expect(rev1.next_due_date).toBe('2026-11-04');

    // 2. Clean solve -> advances to index 2 (7 days)
    const rev2 = RevisionScheduler.updateFixedInterval(rev1, 'p1', 'solved', '2026-11-04');
    expect(rev2.interval_index).toBe(2);
    expect(rev2.interval_days).toBe(7);
    expect(rev2.next_due_date).toBe('2026-11-11');

    // 3. Hint -> index unchanged (repeats 7 days)
    const rev3 = RevisionScheduler.updateFixedInterval(rev2, 'p1', 'hint', '2026-11-11');
    expect(rev3.interval_index).toBe(2);
    expect(rev3.interval_days).toBe(7);
    expect(rev3.next_due_date).toBe('2026-11-18');

    // 4. Failed -> resets to index 0 (1 day)
    const rev4 = RevisionScheduler.updateFixedInterval(rev3, 'p1', 'failed', '2026-11-18');
    expect(rev4.interval_index).toBe(0);
    expect(rev4.interval_days).toBe(1);
    expect(rev4.next_due_date).toBe('2026-11-19');
    expect(rev4.failed_count).toBe(1);
  });

  it('verifies DueQueue min-heap pop order is ascending by due date with deterministic ties', () => {
    const queue = new DueQueue();

    const makeItem = (id: string, date: string): DueQueueItem => ({
      problem: { ...sampleProblem, id },
      revision: {
        problem_id: id,
        next_due_date: date,
        interval_index: 0,
        interval_days: 1,
        ease_factor: 2.5,
        repetitions: 1,
        failed_count: 0,
        leech_flag: false,
      },
      next_due_date: date,
    });

    queue.push(makeItem('p_future', '2026-11-10'));
    queue.push(makeItem('p_overdue_b', '2026-11-02'));
    queue.push(makeItem('p_overdue_a', '2026-11-02')); // tie on date
    queue.push(makeItem('p_oldest', '2026-10-25'));

    // 1. Oldest date first
    expect(queue.pop()?.problem.id).toBe('p_oldest');
    // 2. Ties broken deterministically by problem ID ascending (p_overdue_a before p_overdue_b)
    expect(queue.pop()?.problem.id).toBe('p_overdue_a');
    expect(queue.pop()?.problem.id).toBe('p_overdue_b');
    // 3. Future date last
    expect(queue.pop()?.problem.id).toBe('p_future');
  });

  it('SM-2: ease factor never drops below 1.3 across repeated low-q updates', () => {
    let rev: Revision | undefined = undefined;
    const today = '2026-11-01';

    // Simulate 20 consecutive poor recall ratings (q = 3)
    for (let i = 0; i < 20; i++) {
      rev = RevisionScheduler.updateSM2(rev, 'p1', 3, today);
    }

    expect(rev!.ease_factor).toBe(1.3);
  });

  it('SM-2: q < 3 resets interval to 1 day and keeps ease factor', () => {
    // Start with a problem that has reached 14-day interval and EF 2.6
    const initial: Revision = {
      problem_id: 'p1',
      next_due_date: '2026-11-01',
      interval_index: 3,
      interval_days: 14,
      ease_factor: 2.6,
      repetitions: 3,
      failed_count: 0,
      leech_flag: false,
    };

    // Failed attempt (q = 1)
    const result = RevisionScheduler.updateSM2(initial, 'p1', 1, '2026-11-01');

    expect(result.repetitions).toBe(0);
    expect(result.interval_days).toBe(1);
    expect(result.next_due_date).toBe('2026-11-02');
    expect(result.ease_factor).toBe(2.6); // EF preserved
    expect(result.failed_count).toBe(1);
  });

  it('Leech triggers at exactly 3 failures and at EF < 1.5, and not before', () => {
    const today = '2026-11-01';

    // Failure 1
    const r1 = RevisionScheduler.updateSM2(undefined, 'p1', 1, today);
    expect(r1.failed_count).toBe(1);
    expect(r1.leech_flag).toBe(false);

    // Failure 2
    const r2 = RevisionScheduler.updateSM2(r1, 'p1', 1, today);
    expect(r2.failed_count).toBe(2);
    expect(r2.leech_flag).toBe(false);

    // Failure 3 -> Exactly 3 fails triggers leech!
    const r3 = RevisionScheduler.updateSM2(r2, 'p1', 1, today);
    expect(r3.failed_count).toBe(3);
    expect(r3.leech_flag).toBe(true);

    // Also triggers if EF < 1.5
    const lowEfRev: Revision = {
      problem_id: 'p2',
      next_due_date: today,
      interval_index: 0,
      interval_days: 1,
      ease_factor: 1.4,
      repetitions: 1,
      failed_count: 0,
      leech_flag: false,
    };
    const rLowEf = RevisionScheduler.updateSM2(lowEfRev, 'p2', 3, today);
    expect(rLowEf.leech_flag).toBe(true);
  });

  it('Leech does not advance intervals until cleared by 2 consecutive clean solves or markRelearned', () => {
    const today = '2026-11-01';
    const leech: Revision = {
      problem_id: 'p1',
      next_due_date: today,
      interval_index: 0,
      interval_days: 1,
      ease_factor: 1.4,
      repetitions: 0,
      failed_count: 3,
      leech_flag: true,
    };

    // 1st clean solve: interval remains 1 day, still leech
    const pass1 = RevisionScheduler.updateSM2(leech, 'p1', 4, today);
    expect(pass1.interval_days).toBe(1);
    expect(pass1.leech_flag).toBe(true);

    // 2nd clean solve: clears leech!
    const pass2 = RevisionScheduler.updateSM2(pass1, 'p1', 4, today);
    expect(pass2.leech_flag).toBe(false);

    // Manual action clears immediately
    const manualCleared = RevisionScheduler.markRelearned(leech, today);
    expect(manualCleared.leech_flag).toBe(false);
    expect(manualCleared.failed_count).toBe(0);
  });

  it('is purely deterministic: identical input and date give identical output', () => {
    const rA = RevisionScheduler.updateSM2(undefined, 'p1', 4, '2026-11-01');
    const rB = RevisionScheduler.updateSM2(undefined, 'p1', 4, '2026-11-01');
    expect(rA).toEqual(rB);
  });
});

