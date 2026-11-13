import { describe, it, expect } from 'vitest';
import { InsightsEngine } from '../src/core/stats/Insights';
import { storeManager } from '../src/core/storeManager';
import { Topic, Problem, Attempt } from '../src/types';

describe('InsightsEngine', () => {
  const topics: Topic[] = [
    { id: 'arrays', name: 'Arrays', prerequisites: [], importance_weight: 5 },
    { id: 'binary_search', name: 'Binary Search', prerequisites: ['arrays'], importance_weight: 5 },
  ];

  const problems: Problem[] = [
    { id: 'p_arr', title: 'Two Sum', platform: 'LC', difficulty: 'easy', topic_ids: ['arrays'], created_date: '2026-11-01' },
    { id: 'p_bs', title: 'Binary Search', platform: 'LC', difficulty: 'easy', topic_ids: ['binary_search'], created_date: '2026-11-01' },
  ];

  it('triggers avoidance flag when actual share < 0.5 * expected share and attempts >= 20', () => {
    // 25 total attempts: 24 on Arrays, 1 on Binary Search
    // Total importance = 10 -> Expected share for BS is 50%
    // 0.5 * expected = 25%
    // Actual share for BS is 1/25 = 4% < 25% -> Avoidance flag triggers!
    const attempts: Attempt[] = [
      ...Array.from({ length: 24 }).map((_, i) => ({
        id: `a_arr_${i}`, problem_id: 'p_arr', date: '2026-11-01', status: 'solved' as const, time_taken: 10, mistake_tag: 'none' as const, recall_quality: 5
      })),
      { id: 'a_bs_1', problem_id: 'p_bs', date: '2026-11-01', status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 },
    ];

    const avoided = InsightsEngine.computeAvoidance(topics, problems, attempts);
    expect(avoided.length).toBe(1);
    expect(avoided[0].topic.id).toBe('binary_search');

    // Threshold check: under 20 attempts, avoidance does NOT fire
    const smallAttempts = attempts.slice(0, 15);
    const avoidedSmall = InsightsEngine.computeAvoidance(topics, problems, smallAttempts);
    expect(avoidedSmall.length).toBe(0);
  });

  it('plateau detection computes improving, regressing, flat, and insufficient data', () => {
    // 1. Insufficient data (< 10 attempts)
    const fewAttempts: Attempt[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `a_${i}`, problem_id: 'p1', date: '2026-11-01', status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5
    }));
    expect(InsightsEngine.computePlateau(fewAttempts, 5)).toBe('insufficient_data');

    // 2. Improving: previous 5 had 1/5 success (0.2), recent 5 had 5/5 success (1.0) -> diff +0.8 > +0.15
    const improvingAttempts: Attempt[] = [
      // 5 recent solves (dates 2026-11-06 to 2026-11-10)
      ...Array.from({ length: 5 }).map((_, i) => ({
        id: `rec_${i}`, problem_id: 'p1', date: `2026-11-0${6 + i}`, status: 'solved' as const, time_taken: 10, mistake_tag: 'none' as const, recall_quality: 5
      })),
      // 5 previous fails (dates 2026-11-01 to 2026-11-05)
      ...Array.from({ length: 5 }).map((_, i) => ({
        id: `prev_${i}`, problem_id: 'p1', date: `2026-11-0${1 + i}`, status: 'failed' as const, time_taken: 10, mistake_tag: 'logic' as const, recall_quality: 1
      })),
    ];
    expect(InsightsEngine.computePlateau(improvingAttempts, 5)).toBe('improving');

    // 3. Regressing: previous 5 had 5/5 success, recent 5 had 0/5 success -> diff -1.0 < -0.15
    const regressingAttempts: Attempt[] = [
      ...Array.from({ length: 5 }).map((_, i) => ({
        id: `rec_${i}`, problem_id: 'p1', date: `2026-11-0${6 + i}`, status: 'failed' as const, time_taken: 10, mistake_tag: 'logic' as const, recall_quality: 1
      })),
      ...Array.from({ length: 5 }).map((_, i) => ({
        id: `prev_${i}`, problem_id: 'p1', date: `2026-11-0${1 + i}`, status: 'solved' as const, time_taken: 10, mistake_tag: 'none' as const, recall_quality: 5
      })),
    ];
    expect(InsightsEngine.computePlateau(regressingAttempts, 5)).toBe('regressing');
  });

  it('streak counter spans month boundaries and properly detects missed days', () => {
    // 4 consecutive practice days: Oct 30, Oct 31, Nov 01, Nov 02
    const attempts: Attempt[] = [
      { id: '1', problem_id: 'p1', date: '2026-10-30', status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 },
      { id: '2', problem_id: 'p1', date: '2026-10-31', status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 },
      { id: '3', problem_id: 'p1', date: '2026-11-01', status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 },
      { id: '4', problem_id: 'p1', date: '2026-11-02', status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 },
    ];

    // Today is Nov 02 -> Streak is 4 across October to November boundary!
    expect(InsightsEngine.computeStreak(attempts, '2026-11-02')).toBe(4);

    // If today is Nov 03 and has no attempt yet -> Counts back from yesterday (Nov 02) -> Streak is still 4!
    expect(InsightsEngine.computeStreak(attempts, '2026-11-03')).toBe(4);

    // If today is Nov 04 with no attempt on Nov 03 -> Missed day resets streak to 0!
    expect(InsightsEngine.computeStreak(attempts, '2026-11-04')).toBe(0);
  });

  it('storeManager computes dynamic top topic strength trend and upcoming revisions', () => {
    storeManager.loadDemoData();
    const topTopic = storeManager.getTopTopicStrength('2026-11-10');
    expect(topTopic).toBeDefined();
    expect(topTopic?.history).toHaveLength(7);
    expect(topTopic?.strength).toBeGreaterThanOrEqual(0);

    const upcoming = storeManager.getUpcomingRevisions(4, '2026-11-10');
    expect(upcoming).toBeInstanceOf(Array);
    expect(upcoming.length).toBeGreaterThan(0);
    expect(upcoming[0].problem.title).toBeDefined();
    expect(typeof upcoming[0].days_until_due).toBe('number');
  });
});

