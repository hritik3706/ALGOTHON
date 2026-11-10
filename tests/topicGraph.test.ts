import { describe, it, expect } from 'vitest';
import { TopicGraph } from '../src/core/graph/TopicGraph';
import { Topic } from '../src/types';

describe('TopicGraph', () => {
  const sampleTopics: Topic[] = [
    { id: 'arrays', name: 'Arrays', prerequisites: [], importance_weight: 5 },
    { id: 'hashing', name: 'Hashing', prerequisites: ['arrays'], importance_weight: 4 },
    { id: 'two_pointers', name: 'Two Pointers', prerequisites: ['arrays'], importance_weight: 3 },
    { id: 'trees', name: 'Trees', prerequisites: ['hashing'], importance_weight: 5 },
    { id: 'graphs', name: 'Graphs', prerequisites: ['trees'], importance_weight: 5 },
    { id: 'dp', name: 'Dynamic Programming', prerequisites: ['graphs'], importance_weight: 5 },
  ];

  it('computes a valid topological order on a known DAG', () => {
    const graph = new TopicGraph(sampleTopics);
    const order = graph.getTopologicalOrder();

    expect(order.length).toBe(6);
    const idOrder = order.map((t) => t.id);

    // In a valid topological sort, every prerequisite must appear before its downstream topic
    expect(idOrder.indexOf('arrays')).toBeLessThan(idOrder.indexOf('hashing'));
    expect(idOrder.indexOf('arrays')).toBeLessThan(idOrder.indexOf('two_pointers'));
    expect(idOrder.indexOf('hashing')).toBeLessThan(idOrder.indexOf('trees'));
    expect(idOrder.indexOf('trees')).toBeLessThan(idOrder.indexOf('graphs'));
    expect(idOrder.indexOf('graphs')).toBeLessThan(idOrder.indexOf('dp'));
  });

  it('rejects a cyclic graph and names the cycle', () => {
    const cyclicTopics: Topic[] = [
      { id: 'A', name: 'Topic A', prerequisites: ['C'], importance_weight: 3 },
      { id: 'B', name: 'Topic B', prerequisites: ['A'], importance_weight: 3 },
      { id: 'C', name: 'Topic C', prerequisites: ['B'], importance_weight: 3 },
    ];

    expect(() => new TopicGraph(cyclicTopics)).toThrowError(
      /Cyclic prerequisite graph rejected:.*Topic A.*Topic B.*Topic C/
    );
  });

  it('rejects unknown prerequisite topic IDs immediately with clean message', () => {
    const invalidTopics: Topic[] = [
      { id: 'dp', name: 'Dynamic Programming', prerequisites: ['non_existent'], importance_weight: 5 },
    ];

    expect(() => new TopicGraph(invalidTopics)).toThrowError(
      /Unknown prerequisite topic ID: "non_existent"/
    );
  });

  it('weighted topological order is valid and front-loads high importance', () => {
    const topics: Topic[] = [
      { id: 'root', name: 'Root', prerequisites: [], importance_weight: 1 },
      // Both depend on root, but B has importance 5 and A has importance 1
      { id: 'A', name: 'Topic A', prerequisites: ['root'], importance_weight: 1 },
      { id: 'B', name: 'Topic B', prerequisites: ['root'], importance_weight: 5 },
      { id: 'C', name: 'Topic C', prerequisites: ['root'], importance_weight: 3 },
    ];

    const graph = new TopicGraph(topics);
    const weighted = graph.getWeightedTopologicalOrder();
    const ids = weighted.map((t) => t.id);

    // Topological rule: root must come first
    expect(ids[0]).toBe('root');
    // Weighted rule: among A, B, C, B (weight 5) must come before C (weight 3) and A (weight 1)
    expect(ids[1]).toBe('B');
    expect(ids[2]).toBe('C');
    expect(ids[3]).toBe('A');
  });

  it('verifies unlock check boundaries: 4 vs 5 attempts, 0.59 vs 0.60', () => {
    const graph = new TopicGraph(sampleTopics);

    // Case 1: 4 attempts (boundary fail) even at 100% success
    const check1 = graph.checkUnlock('hashing', () => ({
      attempts: 4,
      success_rate: 1.0,
    }));
    expect(check1.isUnlocked).toBe(false);
    expect(check1.weakestPrerequisite?.id).toBe('arrays');

    // Case 2: 5 attempts but 0.59 success rate (boundary fail)
    const check2 = graph.checkUnlock('hashing', () => ({
      attempts: 5,
      success_rate: 0.59,
    }));
    expect(check2.isUnlocked).toBe(false);

    // Case 3: Exactly 5 attempts and exactly 0.60 success rate (boundary pass)
    const check3 = graph.checkUnlock('hashing', () => ({
      attempts: 5,
      success_rate: 0.6,
    }));
    expect(check3.isUnlocked).toBe(true);
    expect(check3.weakestPrerequisite).toBeUndefined();

    // Topics without prerequisites are always unlocked
    const rootCheck = graph.checkUnlock('arrays', () => ({ attempts: 0, success_rate: 0 }));
    expect(rootCheck.isUnlocked).toBe(true);
  });

  it('locked topic warning names the weakest prerequisite', () => {
    const graph = new TopicGraph(sampleTopics);
    const warning = graph.getLockedWarning('hashing', () => ({
      attempts: 3,
      success_rate: 0.33,
    }));

    expect(warning).toContain('Topic is locked');
    expect(warning).toContain('Arrays');
    expect(warning).toContain('currently 3 attempts, 33% success');
  });

  it('prerequisite path query returns shortest chain of locked topics, empty when unlocked', () => {
    const graph = new TopicGraph(sampleTopics);

    // If target topic is unlocked, path is empty
    const unlockedPath = graph.getShortestPrerequisitePath('dp', () => true);
    expect(unlockedPath).toEqual([]);

    // If trees and graphs are locked, returns chain leading to dp
    const isUnlocked = (id: string) => id === 'arrays' || id === 'hashing';
    const lockedPath = graph.getShortestPrerequisitePath('dp', isUnlocked);
    const ids = lockedPath.map((t) => t.id);

    expect(ids).toContain('trees');
  });
});

