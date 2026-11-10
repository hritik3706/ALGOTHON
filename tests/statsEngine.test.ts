import { describe, it, expect } from 'vitest';
import { StatsEngine } from '../src/core/stats/StatsEngine';
import { Topic, Problem, Attempt } from '../src/types';

describe('StatsEngine', () => {
  it('Wilson score lower bound ranks 18/20 stronger than 1/1, avoiding small-sample bias', () => {
    // 1/1 = 100% raw success, but tiny sample size
    const score1_1 = StatsEngine.calculateWilsonLowerBound(1, 1);

    // 18/20 = 90% raw success, but high confidence
    const score18_20 = StatsEngine.calculateWilsonLowerBound(18, 20);

    // Wilson lower bound for 18/20 (~0.70) must strictly exceed 1/1 (~0.21)
    expect(score18_20).toBeGreaterThan(score1_1);
    expect(score1_1).toBeCloseTo(0.2065, 2);
    expect(score18_20).toBeCloseTo(0.699, 2);
  });

  it('handles n = 0 as untested (LB = 0, weakness = 0)', () => {
    const lb = StatsEngine.calculateWilsonLowerBound(0, 0);
    expect(lb).toBe(0);

    const topics: Topic[] = [
      { id: 'arrays', name: 'Arrays', prerequisites: [], importance_weight: 5 },
    ];
    const stats = StatsEngine.computeTopicStats(topics, [], []);
    const record = stats.get('arrays')!;

    expect(record.attempts).toBe(0);
    expect(record.isUntested).toBe(true);
    expect(record.weakness).toBe(0);
    expect(record.topMistake).toBeUndefined();
  });

  it('counts solved and hint as success in success rate', () => {
    const topics: Topic[] = [
      { id: 'arrays', name: 'Arrays', prerequisites: [], importance_weight: 5 },
    ];
    const problems: Problem[] = [
      { id: 'p1', title: 'P1', platform: 'LC', difficulty: 'easy', topic_ids: ['arrays'], created_date: '2026-11-01' },
      { id: 'p2', title: 'P2', platform: 'LC', difficulty: 'easy', topic_ids: ['arrays'], created_date: '2026-11-01' },
      { id: 'p3', title: 'P3', platform: 'LC', difficulty: 'easy', topic_ids: ['arrays'], created_date: '2026-11-01' },
    ];
    const attempts: Attempt[] = [
      { id: 'a1', problem_id: 'p1', date: '2026-11-01', status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 },
      { id: 'a2', problem_id: 'p2', date: '2026-11-02', status: 'hint', time_taken: 20, mistake_tag: 'complexity', recall_quality: 3 },
      { id: 'a3', problem_id: 'p3', date: '2026-11-03', status: 'failed', time_taken: 30, mistake_tag: 'logic', recall_quality: 1 },
    ];

    const stats = StatsEngine.computeTopicStats(topics, problems, attempts);
    const arraysRecord = stats.get('arrays')!;

    // 2 successes (1 solved + 1 hint) out of 3 attempts = 66.67%
    expect(arraysRecord.attempts).toBe(3);
    expect(arraysRecord.solvedCount).toBe(2);
    expect(arraysRecord.successRate).toBeCloseTo(2 / 3, 3);
  });

  it('determines the top mistake per topic ignoring "none"', () => {
    const topics: Topic[] = [
      { id: 'arrays', name: 'Arrays', prerequisites: [], importance_weight: 5 },
    ];
    const problems: Problem[] = [
      { id: 'p1', title: 'P1', platform: 'LC', difficulty: 'easy', topic_ids: ['arrays'], created_date: '2026-11-01' },
    ];
    const attempts: Attempt[] = [
      { id: 'a1', problem_id: 'p1', date: '2026-11-01', status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 },
      { id: 'a2', problem_id: 'p1', date: '2026-11-02', status: 'failed', time_taken: 15, mistake_tag: 'off_by_one', recall_quality: 1 },
      { id: 'a3', problem_id: 'p1', date: '2026-11-03', status: 'failed', time_taken: 20, mistake_tag: 'off_by_one', recall_quality: 1 },
      { id: 'a4', problem_id: 'p1', date: '2026-11-04', status: 'failed', time_taken: 25, mistake_tag: 'complexity', recall_quality: 1 },
    ];

    const stats = StatsEngine.computeTopicStats(topics, problems, attempts);
    const arraysRecord = stats.get('arrays')!;

    // 'none' had 1, 'complexity' had 1, 'off_by_one' had 2 -> top mistake is 'off_by_one'
    expect(arraysRecord.topMistake).toBe('off_by_one');
  });

  it('ranks topics correctly by weakness', () => {
    const topics: Topic[] = [
      { id: 'strong', name: 'Strong Topic', prerequisites: [], importance_weight: 5 },
      { id: 'weak', name: 'Weak Topic', prerequisites: [], importance_weight: 5 },
      { id: 'untested', name: 'Untested Topic', prerequisites: [], importance_weight: 5 },
    ];
    const problems: Problem[] = [
      { id: 'p_s', title: 'Strong P', platform: 'LC', difficulty: 'easy', topic_ids: ['strong'], created_date: '2026-11-01' },
      { id: 'p_w', title: 'Weak P', platform: 'LC', difficulty: 'easy', topic_ids: ['weak'], created_date: '2026-11-01' },
    ];
    const attempts: Attempt[] = [
      // Strong: 9 solved out of 10
      ...Array.from({ length: 9 }).map((_, i) => ({
        id: `as_${i}`, problem_id: 'p_s', date: '2026-11-01', status: 'solved' as const, time_taken: 10, mistake_tag: 'none' as const, recall_quality: 5
      })),
      { id: 'as_fail', problem_id: 'p_s', date: '2026-11-01', status: 'failed' as const, time_taken: 10, mistake_tag: 'logic' as const, recall_quality: 1 },

      // Weak: 1 solved out of 10
      { id: 'aw_sol', problem_id: 'p_w', date: '2026-11-01', status: 'solved' as const, time_taken: 10, mistake_tag: 'none' as const, recall_quality: 4 },
      ...Array.from({ length: 9 }).map((_, i) => ({
        id: `aw_${i}`, problem_id: 'p_w', date: '2026-11-01', status: 'failed' as const, time_taken: 10, mistake_tag: 'logic' as const, recall_quality: 1
      })),
    ];

    const stats = StatsEngine.computeTopicStats(topics, problems, attempts);
    const ranking = StatsEngine.getWeakTopicRanking(stats);

    // Weak topic must be #1 in weakness ranking, then Strong topic, with Untested at the end
    expect(ranking[0].topicId).toBe('weak');
    expect(ranking[1].topicId).toBe('strong');
    expect(ranking[2].topicId).toBe('untested');
  });

  it('computes coverage matrix with distinct solved problems per topic and difficulty', () => {
    const topics: Topic[] = [
      { id: 'arrays', name: 'Arrays', prerequisites: [], importance_weight: 5 },
      { id: 'dp', name: 'DP', prerequisites: ['arrays'], importance_weight: 5 },
    ];
    const problems: Problem[] = [
      { id: 'p1', title: 'P1', platform: 'LC', difficulty: 'easy', topic_ids: ['arrays'], created_date: '2026-11-01' },
      { id: 'p2', title: 'P2', platform: 'LC', difficulty: 'medium', topic_ids: ['arrays'], created_date: '2026-11-01' },
      { id: 'p3', title: 'P3', platform: 'LC', difficulty: 'medium', topic_ids: ['arrays', 'dp'], created_date: '2026-11-01' },
    ];
    const attempts: Attempt[] = [
      { id: 'a1', problem_id: 'p1', date: '2026-11-01', status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 },
      { id: 'a2', problem_id: 'p1', date: '2026-11-02', status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 }, // Duplicate solved attempt
      { id: 'a3', problem_id: 'p2', date: '2026-11-02', status: 'failed', time_taken: 10, mistake_tag: 'logic', recall_quality: 1 },
      { id: 'a4', problem_id: 'p3', date: '2026-11-03', status: 'solved', time_taken: 20, mistake_tag: 'none', recall_quality: 4 },
    ];

    const matrix = StatsEngine.computeCoverageMatrix(topics, problems, attempts);
    expect(matrix).toHaveLength(2);

    const arrRow = matrix.find((r) => r.topic_id === 'arrays')!;
    expect(arrRow.easy.solved).toBe(1); // p1 solved once (deduped across attempts)
    expect(arrRow.easy.total).toBe(1);
    expect(arrRow.medium.solved).toBe(1); // p3 solved
    expect(arrRow.medium.total).toBe(2); // p2 and p3
    expect(arrRow.hard.total).toBe(0);
    expect(arrRow.total_solved).toBe(2);
    expect(arrRow.total_problems).toBe(3);
    expect(arrRow.mastery_percentage).toBe(67);

    // Empty dataset test
    const emptyMatrix = StatsEngine.computeCoverageMatrix([], [], []);
    expect(emptyMatrix).toEqual([]);
  });
});

