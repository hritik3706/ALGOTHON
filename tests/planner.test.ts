import { describe, it, expect } from 'vitest';
import { Planner } from '../src/core/planner/Planner';
import { TopicGraph } from '../src/core/graph/TopicGraph';
import { Topic, Problem, Attempt, Revision } from '../src/types';

describe('Planner', () => {
  const topics: Topic[] = [
    { id: 'arrays', name: 'Arrays', prerequisites: [], importance_weight: 5 },
    { id: 'two_pointers', name: 'Two Pointers', prerequisites: ['arrays'], importance_weight: 4 },
    { id: 'trees', name: 'Trees', prerequisites: ['two_pointers'], importance_weight: 5 },
    { id: 'graphs', name: 'Graphs', prerequisites: ['trees'], importance_weight: 5 }, // Locked!
  ];

  const problems: Problem[] = [
    { id: 'p_arr', title: 'Two Sum', platform: 'LC', difficulty: 'easy', topic_ids: ['arrays'], created_date: '2026-11-01' },
    { id: 'p_tp', title: 'Valid Palindrome', platform: 'LC', difficulty: 'easy', topic_ids: ['two_pointers'], created_date: '2026-11-01' },
    { id: 'p_tree', title: 'Invert Tree', platform: 'LC', difficulty: 'easy', topic_ids: ['trees'], created_date: '2026-11-01' },
    { id: 'p_graph', title: 'Number of Islands', platform: 'LC', difficulty: 'medium', topic_ids: ['graphs'], created_date: '2026-11-01' },
  ];

  // Satisfy Arrays (5 attempts, 100% success) & Two Pointers (5 attempts, 100% success)
  // Trees has 0 attempts -> Trees is unlocked, but Graphs is LOCKED because Trees has 0 attempts!
  const attempts: Attempt[] = [
    ...Array.from({ length: 5 }).map((_, i) => ({
      id: `a_arr_${i}`, problem_id: 'p_arr', date: '2026-11-01', status: 'solved' as const, time_taken: 10, mistake_tag: 'none' as const, recall_quality: 5
    })),
    ...Array.from({ length: 5 }).map((_, i) => ({
      id: `a_tp_${i}`, problem_id: 'p_tp', date: '2026-11-01', status: 'solved' as const, time_taken: 10, mistake_tag: 'none' as const, recall_quality: 5
    })),
  ];

  const revisions: Revision[] = [];

  it('plan never includes a locked topic', () => {
    const graph = new TopicGraph(topics);
    const plan = Planner.generatePlan(
      '2026-11-10',
      topics,
      problems,
      attempts,
      revisions,
      graph
    );

    const plannedTopicIds = plan.map((pi) => pi.topic.id);

    // Graphs is locked because Trees has 0 attempts (< 5)
    expect(plannedTopicIds).not.toContain('graphs');
    expect(plan.every((pi) => pi.problem.id !== 'p_graph')).toBe(true);
  });

  it('strictly interleaves topics when 3 or more unlocked topics with problems exist', () => {
    const graph = new TopicGraph(topics);
    // Unlocked with problems: arrays, two_pointers, trees (3 topics)
    const plan = Planner.generatePlan(
      '2026-11-10',
      topics,
      problems,
      attempts,
      revisions,
      graph
    );

    const plannedTopicIds = plan.map((pi) => pi.topic.id);
    const uniqueTopics = new Set(plannedTopicIds);

    // No duplicate topics in the plan
    expect(uniqueTopics.size).toBe(plannedTopicIds.length);
  });

  it('ensures no duplicate topics across all plan items including due revisions', () => {
    const graph = new TopicGraph(topics);
    // Add two due revisions that both belong to 'arrays'
    const extraProblems: Problem[] = [
      ...problems,
      { id: 'p_arr_2', title: 'Contains Duplicate', platform: 'LC', difficulty: 'easy', topic_ids: ['arrays'], created_date: '2026-11-01' },
    ];
    const dueRevisionsSameTopic: Revision[] = [
      { problem_id: 'p_arr', next_due_date: '2026-11-10', interval_index: 1, interval_days: 1, ease_factor: 2.5, repetitions: 1, failed_count: 0, leech_flag: false },
      { problem_id: 'p_arr_2', next_due_date: '2026-11-10', interval_index: 1, interval_days: 1, ease_factor: 2.5, repetitions: 1, failed_count: 0, leech_flag: false },
    ];

    const plan = Planner.generatePlan(
      '2026-11-10',
      topics,
      extraProblems,
      attempts,
      dueRevisionsSameTopic,
      graph
    );

    const plannedTopicIds = plan.map((pi) => pi.topic.id);
    const uniqueTopics = new Set(plannedTopicIds);

    expect(plan.length).toBeGreaterThanOrEqual(3);
    // With 3 topics available (arrays, two_pointers, trees), no duplicate topics in plan:
    expect(uniqueTopics.size).toBe(plannedTopicIds.length);
  });

  it('keeps plan size between 3 and 5 items when data allows', () => {
    const graph = new TopicGraph(topics);
    const plan = Planner.generatePlan(
      '2026-11-10',
      topics,
      problems,
      attempts,
      revisions,
      graph
    );

    expect(plan.length).toBeGreaterThanOrEqual(3);
    expect(plan.length).toBeLessThanOrEqual(5);
  });

  it('prioritizes weaker and staler topics', () => {
    // Topic A: weakness 0.8, staler (30 days ago) -> higher priority
    // Topic B: weakness 0.2, practiced today (0 days ago) -> lower priority
    const tA = topics[0];
    const prioA = Planner.computeTopicPriority(tA, 0.8, '2026-10-10', '2026-11-09');
    const prioB = Planner.computeTopicPriority(tA, 0.2, '2026-11-09', '2026-11-09');

    expect(prioA).toBeGreaterThan(prioB);
  });

  it('is purely deterministic: same data and date give identical plan', () => {
    const graph = new TopicGraph(topics);
    const plan1 = Planner.generatePlan('2026-11-10', topics, problems, attempts, revisions, graph);
    const plan2 = Planner.generatePlan('2026-11-10', topics, problems, attempts, revisions, graph);

    expect(plan1).toEqual(plan2);
  });
});

