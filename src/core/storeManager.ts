import { Storage } from './storage/Storage';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter';
import { TopicGraph } from './graph/TopicGraph';
import { StatsEngine } from './stats/StatsEngine';
import { RevisionScheduler } from './scheduler/RevisionScheduler';
import { Planner } from './planner/Planner';
import { InsightsEngine } from './stats/Insights';
import { CoachEngine, CoachResponse } from './coach/CoachEngine';
import { getActiveCoachProvider } from './coach/providers';
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
  TopicCoverageRow,
  GraphLayoutResult,
  UpcomingRevisionItem,
  TopTopicStrength,
  MistakeTag,
} from '../types';
import { getRelativeDate } from './seed';
import { getCuratedProblems, getCuratedCounts } from '../data/curatedProblems';

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

  public getAttempts(): Attempt[] {
    return this.storage.getAttempts();
  }

  public getTopicProblems(topicId: string): {
    problem: Problem;
    attemptsCount: number;
    solvedCount: number;
    lastAttempt?: Attempt;
    revision?: Revision;
  }[] {
    const trackedProblems = this.storage
      .getProblems()
      .filter((p) => p.topic_ids.includes(topicId));
    const allAttempts = this.storage.getAttempts();
    const curatedForTopic = getCuratedProblems().filter((p) =>
      p.topic_ids.includes(topicId)
    );

    const trackedTitles = new Set(
      trackedProblems.map((p) => p.title.toLowerCase())
    );
    const combined: Problem[] = [...trackedProblems];

    for (const cp of curatedForTopic) {
      if (!trackedTitles.has(cp.title.toLowerCase())) {
        combined.push(cp);
        trackedTitles.add(cp.title.toLowerCase());
      }
    }

    return combined.map((problem) => {
      const problemAttempts = allAttempts.filter((a) => a.problem_id === problem.id);
      const solvedAttempts = problemAttempts.filter((a) => a.status === 'solved');
      const sortedAttempts = [...problemAttempts].sort((a, b) =>
        (b.date || '').localeCompare(a.date || '')
      );
      const revision = this.storage.getRevision(problem.id);
      return {
        problem,
        attemptsCount: problemAttempts.length,
        solvedCount: solvedAttempts.length,
        lastAttempt: sortedAttempts[0],
        revision,
      };
    });
  }

  public getMistakeAnalytics(): {
    totalMistakes: number;
    tagCounts: Record<MistakeTag, number>;
    tagAttempts: Record<MistakeTag, { attempt: Attempt; problem: Problem; topicNames: string }[]>;
  } {
    const attempts = this.storage.getAttempts();
    const problems = this.storage.getProblems();
    const problemMap = new Map(problems.map((p) => [p.id, p]));
    const topics = this.storage.getTopics();
    const topicMap = new Map(topics.map((t) => [t.id, t.name]));

    const tagCounts: Record<MistakeTag, number> = {
      logic: 0,
      off_by_one: 0,
      edge_case: 0,
      tle: 0,
      complexity: 0,
      syntax: 0,
      none: 0,
    };

    const tagAttempts: Record<MistakeTag, { attempt: Attempt; problem: Problem; topicNames: string }[]> = {
      logic: [],
      off_by_one: [],
      edge_case: [],
      tle: [],
      complexity: [],
      syntax: [],
      none: [],
    };

    let totalMistakes = 0;

    attempts.forEach((a) => {
      const tag = a.mistake_tag;
      if (tag && tag in tagCounts) {
        tagCounts[tag]++;
        const p = problemMap.get(a.problem_id);
        if (p) {
          const topicNames = p.topic_ids.map((tid) => topicMap.get(tid) || tid).join(', ');
          tagAttempts[tag].push({ attempt: a, problem: p, topicNames });
        }
        if (tag !== 'none') {
          totalMistakes++;
        }
      }
    });

    return { totalMistakes, tagCounts, tagAttempts };
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

  public getCuratedProblems(tag?: 'blind75' | 'neetcode150' | 'neetcode250' | 'all'): Problem[] {
    return getCuratedProblems(tag);
  }

  public getCuratedCounts() {
    return getCuratedCounts();
  }

  public importCuratedList(listName: 'blind75' | 'neetcode150' | 'neetcode250' | 'all'): {
    imported: number;
    existing: number;
  } {
    const curated = getCuratedProblems(listName === 'all' ? undefined : listName);
    const existingProblems = this.storage.getProblems();
    const existingTitles = new Set(existingProblems.map((p) => p.title.toLowerCase()));
    const existingLinks = new Set(
      existingProblems.map((p) => p.link.toLowerCase()).filter(Boolean)
    );

    let imported = 0;
    let existing = 0;

    for (const cp of curated) {
      if (
        existingTitles.has(cp.title.toLowerCase()) ||
        (cp.link && existingLinks.has(cp.link.toLowerCase()))
      ) {
        existing++;
      } else {
        this.storage.addProblem({
          id: cp.id,
          title: cp.title,
          platform: cp.platform,
          link: cp.link,
          difficulty: cp.difficulty,
          topic_ids: cp.topic_ids,
          list_tags: cp.list_tags,
          category: cp.category,
          leetcode_id: cp.leetcode_id,
          created_date: getRelativeDate(0),
        });
        existingTitles.add(cp.title.toLowerCase());
        if (cp.link) existingLinks.add(cp.link.toLowerCase());
        imported++;
      }
    }

    return { imported, existing };
  }

  public getProblemCatalog(options?: {
    listTag?: 'blind75' | 'neetcode150' | 'neetcode250' | 'all' | 'tracked';
  }): {
    problem: Problem;
    attemptsCount: number;
    solvedCount: number;
    status: 'solved' | 'attempted' | 'unsolved';
    lastAttemptDate?: string;
    nextDueDate?: string;
    isTracked: boolean;
  }[] {
    const trackedProblems = this.storage.getProblems();
    const attempts = this.storage.getAttempts();
    const revisions = this.storage.getRevisions();
    const curated = getCuratedProblems(
      options?.listTag === 'tracked' || options?.listTag === 'all' ? undefined : options?.listTag
    );

    const trackedMap = new Map<string, Problem>();
    for (const p of trackedProblems) {
      trackedMap.set(p.title.toLowerCase(), p);
      trackedMap.set(p.id, p);
    }

    const combinedProblems: { problem: Problem; isTracked: boolean }[] = [];
    const seenTitles = new Set<string>();

    if (options?.listTag === 'tracked') {
      for (const p of trackedProblems) {
        seenTitles.add(p.title.toLowerCase());
        combinedProblems.push({ problem: p, isTracked: true });
      }
    } else {
      for (const cp of curated) {
        seenTitles.add(cp.title.toLowerCase());
        const tracked = trackedMap.get(cp.title.toLowerCase());
        if (tracked) {
          combinedProblems.push({
            problem: {
              ...cp,
              id: tracked.id,
              created_date: tracked.created_date,
            },
            isTracked: true,
          });
        } else {
          combinedProblems.push({ problem: cp, isTracked: false });
        }
      }

      if (!options?.listTag || options?.listTag === 'all') {
        for (const p of trackedProblems) {
          if (!seenTitles.has(p.title.toLowerCase())) {
            combinedProblems.push({ problem: p, isTracked: true });
          }
        }
      }
    }

    const revMap = new Map(revisions.map((r) => [r.problem_id, r]));

    return combinedProblems.map(({ problem, isTracked }) => {
      const pAttempts = attempts.filter((a) => a.problem_id === problem.id);
      const solvedCount = pAttempts.filter((a) => a.status === 'solved').length;
      const sortedAttempts = [...pAttempts].sort((a, b) =>
        (b.date || '').localeCompare(a.date || '')
      );
      const lastAttempt = sortedAttempts[0];
      const rev = revMap.get(problem.id);

      let status: 'solved' | 'attempted' | 'unsolved' = 'unsolved';
      if (solvedCount > 0) status = 'solved';
      else if (pAttempts.length > 0) status = 'attempted';

      return {
        problem,
        attemptsCount: pAttempts.length,
        solvedCount,
        status,
        lastAttemptDate: lastAttempt?.date,
        nextDueDate: rev?.next_due_date,
        isTracked,
      };
    });
  }

  public logAttempt(input: LogAttemptInput): { attempt: Attempt; updated_revision?: Revision } {
    let problem: Problem | undefined;

    if (input.problem_id) {
      problem = this.storage.getProblem(input.problem_id);
      if (!problem) {
        const curated = getCuratedProblems();
        const cp = curated.find((c) => c.id === input.problem_id || c.title.toLowerCase() === input.title.trim().toLowerCase());
        if (cp) {
          problem = this.storage.addProblem({
            id: cp.id,
            title: cp.title,
            platform: cp.platform,
            link: cp.link,
            difficulty: cp.difficulty,
            topic_ids: cp.topic_ids,
            list_tags: cp.list_tags,
            category: cp.category,
            leetcode_id: cp.leetcode_id,
            created_date: input.date || getRelativeDate(0),
          });
        }
      }
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
      total_topics: topics.length,
      revisions_due_today: this.getDueRevisions(todayStr).length,
    };
  }

  public getTopTopicStrength(todayStr: string = getRelativeDate(0)): TopTopicStrength | null {
    const topics = this.storage.getTopics();
    const problems = this.storage.getProblems();
    const attempts = this.storage.getAttempts();
    if (topics.length === 0) return null;

    const topicSummaries = this.getTopics();
    const withAttempts = topicSummaries.filter((t) => t.attempts > 0);
    const sorted = (withAttempts.length > 0 ? withAttempts : topicSummaries).sort(
      (a, b) => b.strength - a.strength || b.attempts - a.attempts
    );
    const top = sorted[0];

    if (!top || top.attempts === 0) {
      return {
        topic: topics[0],
        strength: 0,
        is_unlocked: true,
        history: [0, 0, 0, 0, 0, 0, 0],
      };
    }

    // Compute real 7-day progression for this topic
    const topicProblemIds = new Set(
      problems.filter((p) => p.topic_ids.includes(top.topic.id)).map((p) => p.id)
    );
    const topicAttempts = attempts.filter((a) => topicProblemIds.has(a.problem_id));

    const baseDate = new Date(todayStr + 'T00:00:00Z');
    const history: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setUTCDate(d.getUTCDate() - i);
      const dStr = d.toISOString().split('T')[0];

      const attemptsUpToDay = topicAttempts.filter((a) => a.date <= dStr);
      if (attemptsUpToDay.length === 0) {
        history.push(0);
      } else {
        const solved = attemptsUpToDay.filter(
          (a) => a.status === 'solved' || a.status === 'hint'
        ).length;
        const wilson = StatsEngine.calculateWilsonLowerBound(solved, attemptsUpToDay.length);
        history.push(Math.round(wilson * 100));
      }
    }

    return {
      topic: top.topic,
      strength: top.strength,
      is_unlocked: top.is_unlocked,
      history,
    };
  }

  public getUpcomingRevisions(limit = 4, todayStr: string = getRelativeDate(0)): UpcomingRevisionItem[] {
    const revisions = this.storage.getRevisions();
    const items: UpcomingRevisionItem[] = [];

    for (const rev of revisions) {
      const problem = this.storage.getProblem(rev.problem_id);
      if (!problem) continue;
      const topic = this.storage.getTopics().find((t) => problem.topic_ids.includes(t.id));

      const daysUntilDue = Math.round(
        (new Date(rev.next_due_date + 'T00:00:00Z').getTime() -
          new Date(todayStr + 'T00:00:00Z').getTime()) /
          (1000 * 60 * 60 * 24)
      );

      items.push({
        problem,
        revision: rev,
        topic,
        days_until_due: daysUntilDue,
        is_due: daysUntilDue <= 0 && !rev.leech_flag,
      });
    }

    // Sort: Due first, then earliest upcoming
    items.sort((a, b) => {
      if (a.is_due && !b.is_due) return -1;
      if (!a.is_due && b.is_due) return 1;
      return a.days_until_due - b.days_until_due;
    });

    return items.slice(0, limit);
  }

  public getCoverageMatrix(): TopicCoverageRow[] {
    const topics = this.storage.getTopics();
    const problems = this.storage.getProblems();
    const attempts = this.storage.getAttempts();
    const rows = StatsEngine.computeCoverageMatrix(topics, problems, attempts);
    const summaries = this.getTopics();
    const unlockMap = new Map(summaries.map((s) => [s.topic.id, s.is_unlocked]));
    return rows.map((r) => ({
      ...r,
      is_unlocked: unlockMap.get(r.topic_id) ?? r.is_unlocked,
    }));
  }

  public getGraphLayout(): GraphLayoutResult {
    const topics = this.storage.getTopics();
    return TopicGraph.computeGraphLayout(topics);
  }

  public getMeasuredRecallCurve() {
    const attempts = this.storage.getAttempts();
    return StatsEngine.computeMeasuredRecallCurve(attempts);
  }

  /**
   * Demo Support: Reload sample dataset
   */
  public buildPracticeSnapshot(currentTopicId?: string): string {
    const problems = this.storage.getProblems();
    const problemMap = new Map(problems.map((p) => [p.id, p]));
    const topicMap = new Map(this.storage.getTopics().map((t) => [t.id, t.name]));
    const attempts = this.storage.getAttempts();
    const topics = this.getTopics();
    const insights = this.getInsights();
    const streak = this.getStreak();
    const leeches = this.getLeeches();
    const upcoming = this.getUpcomingRevisions(6);
    const plan = this.getPlan();

    const solvedAttempts = attempts.filter((a) => a.status === 'solved');
    const solvedRate = attempts.length > 0 ? Math.round((solvedAttempts.length / attempts.length) * 100) : 0;

    let snapshot = `### REAL-TIME LEARNER PRACTICE DATABASE SNAPSHOT\n`;
    snapshot += `- **Current Consistency Streak:** ${streak} consecutive days\n`;
    snapshot += `- **Total Tracked Problems:** ${problems.length} | **Total Attempts Logged:** ${attempts.length} (${solvedAttempts.length} solved, ${solvedRate}% success rate)\n`;
    if (currentTopicId && topicMap.has(currentTopicId)) {
      snapshot += `- **Current Screen / Focus Topic:** ${topicMap.get(currentTopicId)}\n`;
    }

    if (attempts.length === 0) {
      snapshot += `\n*Database Status: 0 attempts logged yet. If the user asks about their performance, invite them to solve a problem or click "Load Demo Data" in Settings to populate sample records.*\n`;
      return snapshot;
    }

    // 1. Weakest Topics
    snapshot += `\n#### 1. WEAKEST TOPICS (Ranked by Wilson 95% Confidence Lower-Bound):\n`;
    if (insights.weak_topics.length > 0) {
      insights.weak_topics.slice(0, 4).forEach((w) => {
        snapshot += `- **${w.topic.name}**: Wilson Score ${w.strength}/100 (${w.attempts} attempts, ${Math.round(w.success_rate * 100)}% solve rate)${w.top_mistake ? `, Top mistake: "${w.top_mistake}"` : ''}\n`;
      });
    }

    // 2. Full Topic Breakdown
    snapshot += `\n#### 2. TOPIC MASTERY & PREREQUISITE STATUS:\n`;
    topics.forEach((t) => {
      snapshot += `- **${t.topic.name}**: ${t.is_unlocked ? 'Unlocked' : 'Locked'} | Wilson Health: ${t.strength}/100 | ${t.attempts} attempts | ${Math.round(t.success_rate * 100)}% solve${t.top_mistake ? ` | Mistake: ${t.top_mistake}` : ''}\n`;
    });

    // 3. Avoided Topics
    if (insights.avoided_topics.length > 0) {
      snapshot += `\n#### 3. AVOIDED / NEGLECTED TOPICS (High Weight, Low Share):\n`;
      insights.avoided_topics.forEach((av) => {
        snapshot += `- **${av.topic.name}** (Importance ${av.topic.importance_weight}/5): Expected share ${av.expected_share}%, actual practice share is only ${av.actual_share}% (${av.attempts} attempts)\n`;
      });
    }

    // 4. Today's Recommended Interleaved Plan
    snapshot += `\n#### 4. TODAY'S RECOMMENDED PRACTICE PLAN (Generated by SM-2 + Interleaver):\n`;
    if (plan.length > 0) {
      plan.forEach((p, idx) => {
        snapshot += `${idx + 1}. **${p.problem.title}** (${p.topic.name}, ${p.problem.difficulty.toUpperCase()}) — *Reason: ${p.reason}*\n`;
      });
    } else {
      snapshot += `- Daily plan queue is clear. No scheduled revisions due today.\n`;
    }

    // 5. Spaced Repetition Due Queue & Quarantined Leeches
    snapshot += `\n#### 5. SPACED REPETITION (SM-2) DUE QUEUE & LEECHES:\n`;
    const dueItems = upcoming.filter((u) => u.is_due);
    if (dueItems.length > 0) {
      snapshot += `- **Due for Review Right Now:** ${dueItems.map((d) => `"${d.problem.title}" (${d.topic?.name || 'General'}, interval ${d.revision.interval_days}d)`).join(', ')}\n`;
    } else {
      snapshot += `- **Due for Review Right Now:** None\n`;
    }
    if (leeches.length > 0) {
      snapshot += `- **Quarantined Leeches (≥3 fails or Ease < 1.5):** ${leeches.map((l) => `"${l.problem.title}" (${l.topic?.name || 'General'}, failed ${l.revision.failed_count}x, ease factor ${l.revision.ease_factor})`).join(', ')}\n`;
    } else {
      snapshot += `- **Quarantined Leeches:** None\n`;
    }

    // 6. Recent Attempt Log (Last 12 attempts)
    snapshot += `\n#### 6. RECENT PRACTICE ATTEMPTS (Newest First):\n`;
    const sortedAttempts = [...attempts].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 12);
    sortedAttempts.forEach((a) => {
      const p = problemMap.get(a.problem_id);
      const title = p ? p.title : a.problem_id;
      const topicName = p ? p.topic_ids.map((tid) => topicMap.get(tid) || tid).join(', ') : 'DSA';
      const diff = p ? p.difficulty : 'medium';
      snapshot += `- [${a.date}] **${title}** (${topicName}, ${diff}): **${a.status.toUpperCase()}** in ${a.time_taken}m${a.mistake_tag !== 'none' ? ` | Mistake: "${a.mistake_tag}"` : ''}${a.notes ? ` | Notes: "${a.notes.substring(0, 80)}"` : ''}\n`;
    });

    return snapshot;
  }

  public async askCoach(query: string, currentTopicId?: string): Promise<CoachResponse> {
    const q = query.trim().toLowerCase();
    // Fast path: quick action proposals are always generated deterministically client-side
    if (q.startsWith('log') || q.startsWith('solve') || q.includes('just solved')) {
      return CoachEngine.answerQuery(query, currentTopicId);
    }

    const provider = getActiveCoachProvider();
    const dataSnapshot = this.buildPracticeSnapshot(currentTopicId);

    // If query asks for a specific metric (weakest topic, plan, streak, leeches, avoid, need before),
    // calculate the exact mathematical answer from CoachEngine so Gemini has verified ground truth!
    let engineInsight = '';
    if (
      q.includes('weak') ||
      q.includes('today') ||
      q.includes('plan') ||
      q.includes('streak') ||
      q.includes('due') ||
      q.includes('leech') ||
      q.includes('avoid') ||
      q.includes('need before') ||
      q.includes('prereq')
    ) {
      const engineRes = await CoachEngine.answerQuery(query, currentTopicId);
      engineInsight = engineRes.text;
    }

    return provider.ask(query, {
      currentTopicId,
      dataSnapshot,
      engineInsight,
    });
  }

  public exportJSON(): string {
    return this.storage.exportJSON();
  }

  public exportMarkdown(): string {
    return this.storage.exportMarkdown();
  }

  public importJSON(jsonStr: string): { importedProblems: number; importedAttempts: number } {
    return this.storage.importJSON(jsonStr);
  }

  public clearAllData(): void {
    this.storage.clearAllData();
  }

  public loadDemoData(): void {
    this.storage.loadDemoData();
  }

  public resetToSampleData(): void {
    this.storage.loadDemoData();
  }
}

export const storeManager = new StoreManager();
