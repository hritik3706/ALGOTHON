import {
  Topic,
  Problem,
  Attempt,
  Revision,
  PlanItem,
  TopicSummary,
  InsightSummary,
  LogAttemptInput,
  AddProblemInput,
  MistakeTag,
  DailyActivity,
  AvoidanceInsight,
} from '../../types';
import {
  SEED_TOPICS,
  SEED_PROBLEMS,
  SEED_ATTEMPTS,
  SEED_REVISIONS,
  getRelativeDate,
} from './seedData';

// Wilson Lower Bound algorithm (z = 1.96 for 95% confidence)
export function calculateWilsonLowerBound(successes: number, total: number): number {
  if (total <= 0) return 0;
  const z = 1.96;
  const p = successes / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const centerAdjustedProbability = p + z2 / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  const lowerBound = (centerAdjustedProbability - spread) / denominator;
  return Math.max(0, Math.min(1, lowerBound));
}

class MockStore {
  private topics: Topic[] = [...SEED_TOPICS];
  private problems: Problem[] = [...SEED_PROBLEMS];
  private attempts: Attempt[] = [...SEED_ATTEMPTS];
  private revisions: Revision[] = [...SEED_REVISIONS];
  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  // --- STATS COMPUTATION ---

  public getTopicSummary(topicId: string): TopicSummary | undefined {
    const topic = this.topics.find((t) => t.id === topicId);
    if (!topic) return undefined;

    // Problems in this topic
    const topicProblemIds = new Set(
      this.problems.filter((p) => p.topic_ids.includes(topicId)).map((p) => p.id)
    );

    // Attempts for this topic
    const topicAttempts = this.attempts.filter((a) =>
      topicProblemIds.has(a.problem_id)
    );

    const attemptsCount = topicAttempts.length;
    const solvedCount = topicAttempts.filter(
      (a) => a.status === 'solved' || a.status === 'hint'
    ).length;

    const rawSuccessRate = attemptsCount > 0 ? solvedCount / attemptsCount : 0;
    const wilsonLB = calculateWilsonLowerBound(solvedCount, attemptsCount);
    // Strength is Wilson lower bound scaled to 0-100, or raw scaled if few attempts
    const strength = Math.round(wilsonLB * 100);

    // Prerequisite unlocks
    const prereqSummaries = topic.prerequisites.map((pid) =>
      this.getTopicSummary(pid)
    );

    let is_unlocked = true;
    let weakest_prereq: { id: string; name: string; attempts: number; success_rate: number } | undefined;
    let lowestPrereqScore = Infinity;

    for (const pSummary of prereqSummaries) {
      if (!pSummary) continue;
      const isPrereqSolid =
        pSummary.attempts >= 5 && pSummary.success_rate >= 0.6;
      if (!isPrereqSolid) {
        is_unlocked = false;
        if (pSummary.success_rate < lowestPrereqScore) {
          lowestPrereqScore = pSummary.success_rate;
          weakest_prereq = {
            id: pSummary.topic.id,
            name: pSummary.topic.name,
            attempts: pSummary.attempts,
            success_rate: pSummary.success_rate,
          };
        }
      }
    }

    // Top mistake calculation (ignoring 'none')
    const mistakeCounts: Partial<Record<MistakeTag, number>> = {};
    for (const att of topicAttempts) {
      if (att.mistake_tag !== 'none') {
        mistakeCounts[att.mistake_tag] =
          (mistakeCounts[att.mistake_tag] || 0) + 1;
      }
    }
    let top_mistake: MistakeTag | undefined;
    let highestCount = 0;
    for (const [tag, count] of Object.entries(mistakeCounts)) {
      if (count && count > highestCount) {
        highestCount = count;
        top_mistake = tag as MistakeTag;
      }
    }

    // Trend calculation (last 5 vs previous 5)
    let trend: TopicSummary['trend'] = 'insufficient_data';
    if (topicAttempts.length >= 10) {
      const sorted = [...topicAttempts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const recent5 = sorted.slice(0, 5);
      const prev5 = sorted.slice(5, 10);
      const recentRate =
        recent5.filter((a) => a.status === 'solved').length / 5;
      const prevRate =
        prev5.filter((a) => a.status === 'solved').length / 5;
      const diff = recentRate - prevRate;
      if (diff > 0.15) trend = 'improving';
      else if (diff < -0.15) trend = 'regressing';
      else trend = 'flat';
    } else if (topicAttempts.length >= 4) {
      trend = 'flat';
    }

    return {
      topic,
      strength,
      attempts: attemptsCount,
      success_rate: rawSuccessRate,
      is_unlocked,
      weakest_prerequisite: weakest_prereq,
      top_mistake,
      trend,
    };
  }

  public getAllTopicSummaries(): TopicSummary[] {
    return this.topics.map((t) => this.getTopicSummary(t.id)!);
  }

  // --- PREREQUISITE PATH (Backward BFS) ---
  public getPrerequisitePath(targetTopicId: string): { path: Topic[]; is_unlocked: boolean } {
    const summary = this.getTopicSummary(targetTopicId);
    if (!summary) return { path: [], is_unlocked: true };
    if (summary.is_unlocked) return { path: [], is_unlocked: true };

    const path: Topic[] = [];
    const queue: string[] = [targetTopicId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      const t = this.topics.find((item) => item.id === currId);
      if (t) {
        if (currId !== targetTopicId) path.push(t);
        for (const prereqId of t.prerequisites) {
          const prereqSummary = this.getTopicSummary(prereqId);
          if (prereqSummary && !prereqSummary.is_unlocked) {
            queue.push(prereqId);
          } else if (prereqSummary && prereqSummary.attempts < 5) {
            queue.push(prereqId);
          }
        }
      }
    }

    return { path, is_unlocked: false };
  }

  // --- STREAK CALCULATION ---
  public getStreak(todayStr: string = getRelativeDate(0)): number {
    const attemptDates = new Set(this.attempts.map((a) => a.date));
    let streak = 0;
    const curr = new Date(todayStr);

    // If today has no attempts, start checking from yesterday
    if (!attemptDates.has(curr.toISOString().split('T')[0])) {
      curr.setDate(curr.getDate() - 1);
    }

    while (true) {
      const dateKey = curr.toISOString().split('T')[0];
      if (attemptDates.has(dateKey)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // --- REVISIONS & LEECHES ---
  public getDueRevisions(todayStr: string = getRelativeDate(0)): {
    problem: Problem;
    revision: Revision;
    topic?: Topic;
  }[] {
    const dueRevList = this.revisions.filter(
      (r) => r.next_due_date <= todayStr && !r.leech_flag
    );

    return dueRevList.map((rev) => {
      const problem = this.problems.find((p) => p.id === rev.problem_id)!;
      const topic = this.topics.find((t) => problem?.topic_ids.includes(t.id));
      return { problem, revision: rev, topic };
    });
  }

  public getLeeches(): {
    problem: Problem;
    revision: Revision;
    topic?: Topic;
  }[] {
    const leechRevList = this.revisions.filter((r) => r.leech_flag);
    return leechRevList.map((rev) => {
      const problem = this.problems.find((p) => p.id === rev.problem_id)!;
      const topic = this.topics.find((t) => problem?.topic_ids.includes(t.id));
      return { problem, revision: rev, topic };
    });
  }

  // --- TODAY'S PLAN GENERATOR (Interleaved 3-5 items) ---
  public getPlan(todayStr: string = getRelativeDate(0)): PlanItem[] {
    const planItems: PlanItem[] = [];
    const usedTopicIds = new Set<string>();

    // 1. Up to 2 due revisions
    const dueRevs = this.getDueRevisions(todayStr);
    for (const item of dueRevs) {
      if (planItems.length >= 2) break;
      const t = item.topic || this.topics[0];
      planItems.push({
        id: `plan-due-${item.problem.id}`,
        problem: item.problem,
        topic: t,
        type: 'due',
        reason: `Spaced revision due (Rep ${item.revision.repetitions}, EF ${item.revision.ease_factor})`,
      });
      usedTopicIds.add(t.id);
    }

    // 2. Up to 1 Leech (if any)
    const leeches = this.getLeeches();
    if (leeches.length > 0 && planItems.length < 3) {
      const leech = leeches[0];
      const t = leech.topic || this.topics[0];
      if (!usedTopicIds.has(t.id) || planItems.length < 2) {
        planItems.push({
          id: `plan-leech-${leech.problem.id}`,
          problem: leech.problem,
          topic: t,
          type: 'relearn',
          reason: `Failed ${leech.revision.failed_count} times (EF ${leech.revision.ease_factor}). Relearn from scratch.`,
        });
        usedTopicIds.add(t.id);
      }
    }

    // 3. New problems from top unlocked topics (Max-heap priority: weakness + staleness)
    const topicSummaries = this.getAllTopicSummaries()
      .filter((ts) => ts.is_unlocked)
      .sort((a, b) => {
        // Priority = 0.6 * weakness + 0.4 * staleness
        const weaknessA = 1 - a.strength / 100;
        const weaknessB = 1 - b.strength / 100;
        return weaknessB - weaknessA;
      });

    // Pick unsolved/new problems from top priority unlocked topics
    for (const ts of topicSummaries) {
      if (planItems.length >= 4) break;
      if (usedTopicIds.has(ts.topic.id) && topicSummaries.length >= 3) {
        continue; // Interleaving rule: skip if topic already used
      }

      // Find a problem in this topic
      const topicProblems = this.problems.filter((p) =>
        p.topic_ids.includes(ts.topic.id)
      );
      const unsolved = topicProblems.find((p) => {
        const atts = this.attempts.filter((a) => a.problem_id === p.id);
        return atts.every((a) => a.status !== 'solved');
      }) || topicProblems[0];

      if (unsolved && !planItems.some((pi) => pi.problem.id === unsolved.id)) {
        planItems.push({
          id: `plan-new-${unsolved.id}`,
          problem: unsolved,
          topic: ts.topic,
          type: 'new',
          reason: `High priority topic (Strength: ${ts.strength}/100, Success: ${Math.round(ts.success_rate * 100)}%)`,
        });
        usedTopicIds.add(ts.topic.id);
      }
    }

    return planItems;
  }

  // --- INSIGHTS ---
  public getInsights(): InsightSummary {
    const topicSummaries = this.getAllTopicSummaries();
    const totalAttempts = this.attempts.length;
    const totalImportance = this.topics.reduce((acc, t) => acc + t.importance_weight, 0);

    // Avoided topics
    const avoided_topics: AvoidanceInsight[] = [];
    if (totalAttempts >= 15) {
      for (const t of this.topics) {
        const topicProblemIds = new Set(
          this.problems.filter((p) => p.topic_ids.includes(t.id)).map((p) => p.id)
        );
        const attemptsCount = this.attempts.filter((a) =>
          topicProblemIds.has(a.problem_id)
        ).length;

        const expected_share = t.importance_weight / totalImportance;
        const actual_share = attemptsCount / totalAttempts;

        if (actual_share < 0.5 * expected_share) {
          avoided_topics.push({
            topic: t,
            expected_share: Math.round(expected_share * 100),
            actual_share: Math.round(actual_share * 100),
            attempts: attemptsCount,
          });
        }
      }
    }

    // Last 7 days activity
    const last_7_days: DailyActivity[] = [];
    for (let i = 6; i >= 0; i--) {
      const dStr = getRelativeDate(-i);
      const dateObj = new Date(dStr);
      const day_name = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayAttempts = this.attempts.filter((a) => a.date === dStr);
      const solved = dayAttempts.filter((a) => a.status === 'solved').length;
      last_7_days.push({
        date: dStr,
        day_name,
        attempts_count: dayAttempts.length,
        solved_count: solved,
      });
    }

    return {
      weak_topics: [...topicSummaries].sort((a, b) => a.strength - b.strength),
      avoided_topics,
      streak: this.getStreak(),
      last_7_days,
      total_problems: this.problems.length,
      topics_unlocked: topicSummaries.filter((t) => t.is_unlocked).length,
      revisions_due_today: this.getDueRevisions().length,
    };
  }

  // --- ACTIONS (Log Attempt & Add Problem) ---
  public logAttempt(input: LogAttemptInput): { attempt: Attempt; updated_revision?: Revision } {
    let problemId = input.problem_id;

    // Create problem if not existing
    if (!problemId) {
      problemId = `p-${Date.now()}`;
      const newProblem: Problem = {
        id: problemId,
        title: input.title,
        platform: input.platform || 'LeetCode',
        link: input.link || '',
        difficulty: input.difficulty,
        topic_ids: input.topic_ids,
        created_date: input.date || getRelativeDate(0),
      };
      this.problems.push(newProblem);
    }

    // Default recall quality from status if not specified
    let recall = input.recall_quality;
    if (recall === undefined) {
      if (input.status === 'solved') recall = 4;
      else if (input.status === 'hint') recall = 3;
      else recall = 1;
    }

    const attempt: Attempt = {
      id: `a-${Date.now()}`,
      problem_id: problemId,
      date: input.date || getRelativeDate(0),
      status: input.status,
      time_taken: input.time_taken,
      mistake_tag: input.mistake_tag,
      recall_quality: recall,
      notes: input.notes,
    };
    this.attempts.push(attempt);

    // Update or create Revision using SM-2 algorithm
    let revision = this.revisions.find((r) => r.problem_id === problemId);
    const q = recall;

    if (!revision) {
      revision = {
        problem_id: problemId,
        next_due_date: getRelativeDate(1),
        interval_index: 0,
        interval_days: 1,
        ease_factor: 2.5,
        repetitions: 0,
        failed_count: 0,
        leech_flag: false,
      };
      this.revisions.push(revision);
    }

    if (q < 3) {
      // Failed attempt: reset repetitions, interval = 1, increment failed_count
      revision.repetitions = 0;
      revision.interval_days = 1;
      revision.failed_count += 1;
      revision.next_due_date = getRelativeDate(1);
      // Leech check
      if (revision.failed_count >= 3 || revision.ease_factor < 1.5) {
        revision.leech_flag = true;
      }
    } else {
      // Success / Hint: update ease factor
      revision.repetitions += 1;
      const newEF = Math.max(
        1.3,
        revision.ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
      );
      revision.ease_factor = Number(newEF.toFixed(2));

      if (revision.repetitions === 1) {
        revision.interval_days = 1;
      } else if (revision.repetitions === 2) {
        revision.interval_days = 6;
      } else {
        revision.interval_days = Math.round(revision.interval_days * revision.ease_factor);
      }

      revision.next_due_date = getRelativeDate(revision.interval_days);

      // Two consecutive clean solves clears leech
      if (q >= 4 && revision.repetitions >= 2) {
        revision.leech_flag = false;
      }
    }

    this.notify();
    return { attempt, updated_revision: revision };
  }

  public addProblem(input: AddProblemInput): Problem {
    const newProblem: Problem = {
      id: `p-${Date.now()}`,
      title: input.title,
      platform: input.platform || 'LeetCode',
      link: input.link || '',
      difficulty: input.difficulty,
      topic_ids: input.topic_ids,
      created_date: getRelativeDate(0),
    };
    this.problems.push(newProblem);
    this.notify();
    return newProblem;
  }
}

export const mockStore = new MockStore();

