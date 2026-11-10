import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Storage } from '../src/core/storage/Storage';
import { FileStorageAdapter } from '../src/core/storage/FileStorageAdapter';
import { TopicGraph } from '../src/core/graph/TopicGraph';
import { StatsEngine } from '../src/core/stats/StatsEngine';
import { RevisionScheduler } from '../src/core/scheduler/RevisionScheduler';
import { DueQueue } from '../src/core/scheduler/DueQueue';
import { Planner } from '../src/core/planner/Planner';
import { InsightsEngine } from '../src/core/stats/Insights';

describe('End-to-End Demo Script Walkthrough', () => {
  const testDir = path.join(__dirname, 'tmp_e2e_test');

  beforeEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('runs the full 2-minute demo scenario flawlessly', () => {
    const adapter = new FileStorageAdapter(testDir);
    const storage = new Storage(adapter);
    const graph = new TopicGraph(storage.getTopics());

    const today = '2026-11-10';

    // STEP 1: Add a failed problem on Dynamic Programming
    const dpProblem = storage.addProblem({
      title: 'Word Break Demo',
      platform: 'LeetCode',
      difficulty: 'medium',
      topic_ids: ['dp'],
    });

    const failedAttempt = storage.addAttempt({
      problem_id: dpProblem.id,
      date: today,
      status: 'failed',
      time_taken: 35,
      mistake_tag: 'logic',
      recall_quality: 1,
    });
    expect(failedAttempt.id).toBeDefined();

    // STEP 2: Show weak topics update
    const statsMap = StatsEngine.computeTopicStats(
      storage.getTopics(),
      storage.getProblems(),
      storage.getAttempts()
    );
    const dpStats = statsMap.get('dp')!;
    expect(dpStats.weakness).toBeGreaterThan(0.5);

    // STEP 3: Attempt a locked topic (Graphs) and verify locked warning
    const graphCheck = graph.checkUnlock('graphs', (pid) => {
      const s = statsMap.get(pid);
      return {
        attempts: s ? s.attempts : 0,
        success_rate: s ? s.successRate : 0,
      };
    });
    expect(graphCheck.isUnlocked).toBe(false);
    expect(graphCheck.weakestPrerequisite?.name).toBe('Trees');

    const warning = graph.getLockedWarning('graphs', (pid) => {
      const s = statsMap.get(pid);
      return {
        attempts: s ? s.attempts : 0,
        success_rate: s ? s.successRate : 0,
      };
    });
    expect(warning).toContain('Topic is locked');
    expect(warning).toContain('Trees');

    // STEP 4: Query prerequisite path: "What do I need before DP?"
    const dpPath = graph.getShortestPrerequisitePath('dp', (pid) => {
      const s = statsMap.get(pid);
      return s ? s.attempts >= 5 && s.successRate >= 0.6 : false;
    });
    expect(dpPath.length).toBeGreaterThan(0);
    expect(dpPath.map((t) => t.id)).toContain('backtracking');

    // STEP 5: Verify Avoidance Flag
    const avoidance = InsightsEngine.computeAvoidance(
      storage.getTopics(),
      storage.getProblems(),
      storage.getAttempts()
    );
    // Binary Search was seeded with only 1 attempt out of >20 attempts
    expect(avoidance.some((a) => a.topic.id === 'binary_search')).toBe(true);

    // STEP 6: Generate Today's Plan (Interleaved, no locked topics)
    const plan = Planner.generatePlan(
      today,
      storage.getTopics(),
      storage.getProblems(),
      storage.getAttempts(),
      storage.getRevisions(),
      graph
    );
    expect(plan.length).toBeGreaterThanOrEqual(3);
    expect(plan.length).toBeLessThanOrEqual(5);
    // Locked Graphs topic is never planned
    expect(plan.every((pi) => pi.topic.id !== 'graphs')).toBe(true);

    // STEP 7: Log a clean solve on a due revision and verify interval stretching
    const twoSum = storage.getProblems().find((p) => p.title === 'Two Sum')!;
    const initialRev = storage.getRevision(twoSum.id)!;

    // Clean solve (recall quality 5)
    const updatedRev = RevisionScheduler.updateSM2(
      initialRev,
      twoSum.id,
      5,
      today
    );
    expect(updatedRev.repetitions).toBe(initialRev.repetitions + 1);
    expect(updatedRev.interval_days).toBeGreaterThan(initialRev.interval_days);
    storage.saveRevision(updatedRev);

    // STEP 8: Verify revision returns on its due date in the DueQueue
    const futureDue = updatedRev.next_due_date;
    const dueQueueOnFutureDate = new DueQueue();
    for (const rev of storage.getRevisions()) {
      const p = storage.getProblem(rev.problem_id);
      if (p) {
        dueQueueOnFutureDate.push({
          problem: p,
          revision: rev,
          next_due_date: rev.next_due_date,
        });
      }
    }
    const dueItemsOnDate = dueQueueOnFutureDate.getDueItems(futureDue);
    expect(dueItemsOnDate.some((item) => item.problem.id === twoSum.id)).toBe(true);
  });
});
