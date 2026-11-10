import { Topic, Problem, Revision, Attempt, PlanItem } from '../../types';
import { StatsEngine } from '../stats/StatsEngine';
import { TopicGraph } from '../graph/TopicGraph';
import { DueQueue } from '../scheduler/DueQueue';
import { PriorityQueue } from '../graph/PriorityQueue';

export interface PlannerConfig {
  weaknessWeight: number; // default 0.6
  stalenessWeight: number; // default 0.4
  minPlanSize: number; // 3
  maxPlanSize: number; // 5
}

export const DEFAULT_PLANNER_CONFIG: PlannerConfig = {
  weaknessWeight: 0.6,
  stalenessWeight: 0.4,
  minPlanSize: 3,
  maxPlanSize: 5,
};

export class Planner {
  /**
   * Helper to compute days difference between two ISO dates (YYYY-MM-DD)
   */
  public static daysBetween(earlierDate: string, laterDate: string): number {
    const d1 = new Date(earlierDate + 'T00:00:00Z');
    const d2 = new Date(laterDate + 'T00:00:00Z');
    const diffMs = d2.getTime() - d1.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Computes topic priority:
   * staleness = min(1, days_since_last_attempt / 30); never attempted = 1
   * priority = 0.6 * weakness + 0.4 * staleness
   */
  public static computeTopicPriority(
    _topic: Topic,
    weakness: number,
    lastAttemptDate: string | undefined,
    today: string,
    config: PlannerConfig = DEFAULT_PLANNER_CONFIG
  ): number {
    let staleness = 1.0;
    if (lastAttemptDate) {
      const days = Planner.daysBetween(lastAttemptDate, today);
      staleness = Math.min(1.0, days / 30);
    }
    return config.weaknessWeight * weakness + config.stalenessWeight * staleness;
  }

  /**
   * Generates Today's Plan (3-5 items) with pure determinism and topic interleaving.
   */
  public static generatePlan(
    today: string,
    topics: Topic[],
    problems: Problem[],
    attempts: Attempt[],
    revisions: Revision[],
    topicGraph: TopicGraph,
    config: PlannerConfig = DEFAULT_PLANNER_CONFIG
  ): PlanItem[] {
    const statsMap = StatsEngine.computeTopicStats(topics, problems, attempts);
    const plan: PlanItem[] = [];

    // 1. Determine unlocked topics
    const unlockedTopics = topics.filter((t) => {
      const check = topicGraph.checkUnlock(t.id, (pid) => {
        const s = statsMap.get(pid);
        return {
          attempts: s ? s.attempts : 0,
          success_rate: s ? s.successRate : 0,
        };
      });
      return check.isUnlocked;
    });

    const unlockedTopicIds = new Set(unlockedTopics.map((t) => t.id));

    // 2. Due Revisions from Min-Heap
    const dueQueue = new DueQueue();
    const problemMap = new Map(problems.map((p) => [p.id, p]));

    for (const rev of revisions) {
      const prob = problemMap.get(rev.problem_id);
      if (prob) {
        // Only include if at least one of problem's topics is unlocked
        const hasUnlockedTopic = prob.topic_ids.some((tid) =>
          unlockedTopicIds.has(tid)
        );
        if (hasUnlockedTopic) {
          dueQueue.push({
            problem: prob,
            revision: rev,
            next_due_date: rev.next_due_date,
          });
        }
      }
    }

    const dueItems = dueQueue.getDueItems(today);

    // Candidate problems selector
    const getCandidatesForTopic = (topicId: string): Problem[] => {
      const topicProblems = problems.filter((p) =>
        p.topic_ids.includes(topicId)
      );
      // Unsolved problems first
      return [...topicProblems].sort((a, b) => {
        const attsA = attempts.filter((att) => att.problem_id === a.id);
        const attsB = attempts.filter((att) => att.problem_id === b.id);
        const solvedA = attsA.some((att) => att.status === 'solved');
        const solvedB = attsB.some((att) => att.status === 'solved');
        if (!solvedA && solvedB) return -1;
        if (solvedA && !solvedB) return 1;
        return a.title.localeCompare(b.title);
      });
    };

    // Helper to find representative unlocked topic for a problem
    const getRepresentativeTopic = (prob: Problem): Topic => {
      const probTopicId =
        prob.topic_ids.find((tid) => unlockedTopicIds.has(tid)) ||
        prob.topic_ids[0];
      return topics.find((t) => t.id === probTopicId) || topics[0];
    };

    // Calculate all available topics across both due items and unlocked candidates
    const availableTopicIds = new Set<string>();
    for (const item of dueItems) {
      availableTopicIds.add(getRepresentativeTopic(item.problem).id);
    }
    for (const t of unlockedTopics) {
      if (getCandidatesForTopic(t.id).length > 0) {
        availableTopicIds.add(t.id);
      }
    }
    const canInterleaveStrictly = availableTopicIds.size >= 3;
    const chosenTopicsInPlan = new Set<string>();

    // Pop up to 3 due revisions (strictly enforcing interleaving across all items)
    for (const item of dueItems) {
      if (plan.length >= 3) break;
      const topicObj = getRepresentativeTopic(item.problem);

      if (canInterleaveStrictly && chosenTopicsInPlan.has(topicObj.id)) {
        // Skip duplicate topic in due queue to maintain strict interleaving
        continue;
      }

      const isLeech = item.revision.leech_flag;
      const itemType = isLeech ? 'relearn' : 'due';
      const reason = isLeech
        ? `Quarantined leech (failed ${item.revision.failed_count} times). Relearn core patterns.`
        : `Spaced revision due (rep ${item.revision.repetitions}, interval: ${item.revision.interval_days}d).`;

      plan.push({
        id: `plan-${itemType}-${item.problem.id}`,
        problem: item.problem,
        topic: topicObj,
        type: itemType,
        reason,
      });
      chosenTopicsInPlan.add(topicObj.id);
    }

    // 3. Priority Max-Heap over UNLOCKED topics
    const topicPq = new PriorityQueue<{ topic: Topic; priority: number }>();
    for (const t of unlockedTopics) {
      const stat = statsMap.get(t.id)!;
      const priority = Planner.computeTopicPriority(
        t,
        stat.weakness,
        stat.lastAttemptDate,
        today,
        config
      );
      topicPq.enqueue({ topic: t, priority }, priority);
    }

    // 4. Greedy Selection with Interleaving
    while (!topicPq.isEmpty() && plan.length < config.maxPlanSize) {
      const { topic, priority } = topicPq.dequeue()!;

      if (canInterleaveStrictly && chosenTopicsInPlan.has(topic.id)) {
        // Skip duplicate topic to maintain strict interleaving
        continue;
      }

      const candidates = getCandidatesForTopic(topic.id);
      const chosenProblem = candidates.find(
        (c) => !plan.some((pi) => pi.problem.id === c.id)
      );

      if (chosenProblem) {
        const stat = statsMap.get(topic.id)!;
        plan.push({
          id: `plan-new-${chosenProblem.id}`,
          problem: chosenProblem,
          topic,
          type: 'new',
          reason: `High priority weak topic (Wilson strength: ${Math.round(
            stat.wilsonLowerBound * 100
          )}/100, priority: ${priority.toFixed(2)}).`,
        });
        chosenTopicsInPlan.add(topic.id);
      }
    }

    // Backtrack relaxation: If plan is still below minPlanSize (3) because of strict interleaving, relax topic constraint
    if (plan.length < config.minPlanSize) {
      // First check any skipped due revisions
      for (const item of dueItems) {
        if (plan.length >= config.minPlanSize) break;
        if (!plan.some((pi) => pi.problem.id === item.problem.id)) {
          const topicObj = getRepresentativeTopic(item.problem);
          const isLeech = item.revision.leech_flag;
          const itemType = isLeech ? 'relearn' : 'due';
          const reason = isLeech
            ? `Quarantined leech (failed ${item.revision.failed_count} times). Relearn core patterns.`
            : `Spaced revision due (rep ${item.revision.repetitions}, interval: ${item.revision.interval_days}d).`;
          plan.push({
            id: `plan-${itemType}-${item.problem.id}`,
            problem: item.problem,
            topic: topicObj,
            type: itemType,
            reason,
          });
        }
      }

      // Then check candidate new problems
      for (const t of unlockedTopics) {
        if (plan.length >= config.minPlanSize) break;
        const candidates = getCandidatesForTopic(t.id);
        const additional = candidates.find(
          (c) => !plan.some((pi) => pi.problem.id === c.id)
        );
        if (additional) {
          plan.push({
            id: `plan-new-${additional.id}`,
            problem: additional,
            topic: t,
            type: 'new',
            reason: `Practice expansion on unlocked topic ${t.name}.`,
          });
        }
      }
    }

    return plan;
  }
}
