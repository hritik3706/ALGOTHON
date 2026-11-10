import { Storage } from './storage/Storage';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter';
import { TopicGraph } from './graph/TopicGraph';
import { StatsEngine } from './stats/StatsEngine';
import { RevisionScheduler } from './scheduler/RevisionScheduler';
import { Planner } from './planner/Planner';
import { InsightsEngine } from './stats/Insights';
import {
  Topic,
  Problem,
  Attempt,
  Revision,
  TopicSummary,
  InsightSummary,
  PlanItem,
  LogAttemptInput,
  AddProblemInput,
} from '../types';
import {
  SEED_TOPICS,
  SEED_PROBLEMS,
  SEED_ATTEMPTS,
  SEED_REVISIONS,
  getRelativeDate,
} from '../api/mock/seedData';

class StoreManager {
  private storage: Storage;
  private topicGraph: TopicGraph;

  constructor() {
    this.storage = new Storage(new LocalStorageAdapter());
    this.topicGraph = new TopicGraph(this.storage.getTopics());
  }

  public subscribe(listener: () => void): () => void {
    return this.storage.subscribe(listener);
  }

  public getTopics(): TopicSummary[] {
    const topics = this.storage.getTopics();
    const problems = this.storage.getProblems();
    const attempts = this.storage.getAttempts();

    const statsMap = StatsEngine.computeTopicStats(topics, problems, attempts);

    return topics.map((t) => {
      const stat = statsMap.get(t.id)!;
      const unlockCheck = this.topicGraph.checkUnlock(t.id, (pid) => {
        const s = statsMap.get(pid);
        return {
          attempts: s ? s.attempts : 0,
          success_rate: s ? s.successRate : 0,
        };
      });

      const topicProblemIds = new Set(
        problems.filter((p) => p.topic_ids.includes(t.id)).map((p) => p.id)
      );
      const topicAttempts = attempts.filter((a) =>
        topicProblemIds.has(a.problem_id)
      );

      const trend = InsightsEngine.computePlateau(topicAttempts, 5);

      return {
        topic: t,
        strength: Math.round(stat.wilsonLowerBound * 100),
        attempts: stat.attempts,
        success_rate: stat.successRate,
        is_unlocked: unlockCheck.isUnlocked,
        weakest_prerequisite: unlockCheck.weakestPrerequisite,
        top_mistake: stat.topMistake,
        trend,
      };
    });
  }

  public getTopicPath(topicId: string): { path: Topic[]; is_unlocked: boolean } {
    const topics = this.storage.getTopics();
    const statsMap = StatsEngine.computeTopicStats(
      topics,
      this.storage.getProblems(),
      this.storage.getAttempts()
    );

    const isPrereqUnlocked = (id: string): boolean => {
      const check = this.topicGraph.checkUnlock(id, (pid) => {
        const s = statsMap.get(pid);
        return {
          attempts: s ? s.attempts : 0,
          success_rate: s ? s.successRate : 0,
        };
      });
      return check.isUnlocked;
    };

    const targetCheck = this.topicGraph.checkUnlock(topicId, (pid) => {
      const s = statsMap.get(pid);
      return {
        attempts: s ? s.attempts : 0,
        success_rate: s ? s.successRate : 0,
      };
    });

    if (targetCheck.isUnlocked) {
      return { path: [], is_unlocked: true };
    }

    const path = this.topicGraph.getShortestPrerequisitePath(topicId, isPrereqUnlocked);
    return { path, is_unlocked: false };
  }

  public getProblems(): Problem[] {
    return this.storage.getProblems();
  }

  public searchProblems(query: string): Problem[] {
    const q = query.trim().toLowerCase();
    const all = this.storage.getProblems();
    if (!q) return all;
    return all.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.platform.toLowerCase().includes(q) ||
        p.difficulty.toLowerCase().includes(q) ||
        p.topic_ids.some((tid) => tid.toLowerCase().includes(q))
    );
  }

  public addProblem(input: AddProblemInput): Problem {
    return this.storage.addProblem(input);
  }

  public logAttempt(input: LogAttemptInput): { attempt: Attempt; updated_revision?: Revision } {
    let problem: Problem | undefined;

    if (input.problem_id) {
      problem = this.storage.getProblem(input.problem_id);
    }

    if (!problem) {
      const existing = this.storage
        .getProblems()
        .find((p) => p.title.toLowerCase() === input.title.trim().toLowerCase());
      if (existing) {
        problem = existing;
      } else {
        problem = this.storage.addProblem({
          title: input.title,
          platform: input.platform || 'LeetCode',
          link: input.link,
          difficulty: input.difficulty,
          topic_ids: input.topic_ids,
          created_date: input.date || getRelativeDate(0),
        });
      }
    }

    const recall =
      input.recall_quality !== undefined
        ? input.recall_quality
        : RevisionScheduler.deriveRecallQuality(input.status, input.time_taken);

    const attempt = this.storage.addAttempt({
      problem_id: problem.id,
      date: input.date || getRelativeDate(0),
      status: input.status,
      time_taken: input.time_taken,
      mistake_tag: input.mistake_tag,
      recall_quality: recall,
      notes: input.notes,
    });

    // Update revision using pure RevisionScheduler.updateSM2
    const currentRev = this.storage.getRevision(problem.id);
    const updatedRev = RevisionScheduler.updateSM2(
      currentRev,
      problem.id,
      recall,
      input.date || getRelativeDate(0)
    );

    this.storage.saveRevision(updatedRev);
    return { attempt, updated_revision: updatedRev };
  }

  public markRelearned(problemId: string, today: string = getRelativeDate(0)): Revision {
    const current = this.storage.getRevision(problemId);
    if (!current) throw new Error(`No revision found for problem ID: ${problemId}`);
    const updated = RevisionScheduler.markRelearned(current, today);
    this.storage.saveRevision(updated);
    return updated;
  }

  public getDueRevisions(todayStr: string = getRelativeDate(0)): {
    problem: Problem;
    revision: Revision;
    topic?: Topic;
  }[] {
    const revisions = this.storage.getRevisions();
    const due = revisions.filter(
      (r) => r.next_due_date <= todayStr && !r.leech_flag
    );

    return due.map((rev) => {
      const problem = this.storage.getProblem(rev.problem_id)!;
      const topic = this.storage
        .getTopics()
        .find((t) => problem?.topic_ids.includes(t.id));
      return { problem, revision: rev, topic };
    });
  }

  public getLeeches(): {
    problem: Problem;
    revision: Revision;
    topic?: Topic;
  }[] {
    const revisions = this.storage.getRevisions();
    const leeches = revisions.filter((r) => r.leech_flag);

    return leeches.map((rev) => {
      const problem = this.storage.getProblem(rev.problem_id)!;
      const topic = this.storage
        .getTopics()
        .find((t) => problem?.topic_ids.includes(t.id));
      return { problem, revision: rev, topic };
    });
  }

  public getStreak(todayStr: string = getRelativeDate(0)): number {
    return InsightsEngine.computeStreak(this.storage.getAttempts(), todayStr);
  }

  public getPlan(todayStr: string = getRelativeDate(0)): PlanItem[] {
    return Planner.generatePlan(
      todayStr,
      this.storage.getTopics(),
      this.storage.getProblems(),
      this.storage.getAttempts(),
      this.storage.getRevisions(),
      this.topicGraph
    );
  }

  public getInsights(todayStr: string = getRelativeDate(0)): InsightSummary {
    const topics = this.storage.getTopics();
    const problems = this.storage.getProblems();
    const attempts = this.storage.getAttempts();

    const topicSummaries = this.getTopics();
    const avoided_topics = InsightsEngine.computeAvoidance(topics, problems, attempts);
    const last_7_days = InsightsEngine.computeLast7Days(attempts, todayStr);
    const streak = this.getStreak(todayStr);

    return {
      weak_topics: [...topicSummaries].sort((a, b) => a.strength - b.strength),
      avoided_topics,
      streak,
      last_7_days,
      total_problems: problems.length,
      topics_unlocked: topicSummaries.filter((t) => t.is_unlocked).length,
      revisions_due_today: this.getDueRevisions(todayStr).length,
    };
  }

  /**
   * Demo Support: Reload sample dataset
   */
  public resetToSampleData(): void {
    const adapter = new LocalStorageAdapter();
    adapter.saveSeedTopics(SEED_TOPICS);
    adapter.saveData({
      schema_version: 1,
      problems: SEED_PROBLEMS,
      attempts: SEED_ATTEMPTS,
      revisions: SEED_REVISIONS,
      updated_at: new Date().toISOString(),
    });
    window.location.reload();
  }
}

export const storeManager = new StoreManager();
