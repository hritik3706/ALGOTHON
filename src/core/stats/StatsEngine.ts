import { Problem, Attempt, MistakeTag, Topic, TopicCoverageRow } from '../../types';

export interface TopicStatRecord {
  topicId: string;
  topicName: string;
  attempts: number;
  solvedCount: number;
  successRate: number; // 0.0 to 1.0 (solved + hint count as success)
  wilsonLowerBound: number; // 0.0 to 1.0
  weakness: number; // 1 - LB (0 if n=0 untested)
  isUntested: boolean;
  topMistake?: MistakeTag;
  lastAttemptDate?: string;
}

/**
 * Pure statistical computation engine for DSA practice diagnostics.
 */
export class StatsEngine {
  /**
   * Wilson score confidence interval lower bound for Bernoulli parameter (z = 1.96 for 95% confidence).
   * Effectively discounts small-sample flukes (e.g. 1/1 is ranked ~0.21, whereas 18/20 is ranked ~0.70).
   * If n = 0, returns 0.
   */
  public static calculateWilsonLowerBound(successes: number, total: number): number {
    if (total <= 0) return 0;
    const z = 1.96;
    const p = successes / total;
    const z2 = z * z;
    const denominator = 1 + z2 / total;
    const centerAdjustedProbability = p + z2 / (2 * total);
    const varianceTerm = (p * (1 - p)) / total + z2 / (4 * total * total);
    const spread = z * Math.sqrt(Math.max(0, varianceTerm));
    const lowerBound = (centerAdjustedProbability - spread) / denominator;
    return Math.max(0, Math.min(1, lowerBound));
  }

  /**
   * Computes per-topic statistics.
   * NOTE ON SUCCESS DEFINITION: Both 'solved' (clean) and 'hint' count as successful solves,
   * because completing with a hint demonstrates conceptual comprehension and forward progression
   * over outright failure.
   */
  public static computeTopicStats(
    topics: Topic[],
    problems: Problem[],
    attempts: Attempt[]
  ): Map<string, TopicStatRecord> {
    const topicMap = new Map<string, TopicStatRecord>();

    for (const topic of topics) {
      // Find all problems associated with this topic
      const topicProblemIds = new Set(
        problems
          .filter((p) => p.topic_ids.includes(topic.id))
          .map((p) => p.id)
      );

      // Filter attempts belonging to this topic's problems
      const topicAttempts = attempts.filter((a) =>
        topicProblemIds.has(a.problem_id)
      );

      const totalAttempts = topicAttempts.length;

      // Solved + Hint count as success
      const successes = topicAttempts.filter(
        (a) => a.status === 'solved' || a.status === 'hint'
      ).length;

      const successRate = totalAttempts > 0 ? successes / totalAttempts : 0;
      const isUntested = totalAttempts === 0;

      const wilsonLB = isUntested
        ? 0
        : StatsEngine.calculateWilsonLowerBound(successes, totalAttempts);

      // Weakness = 1 - LB. For untested (n=0), weakness is 0 (untested != weak)
      const weakness = isUntested ? 0 : 1 - wilsonLB;

      // Top mistake calculation (ignoring 'none')
      const mistakeFrequencies = new Map<MistakeTag, number>();
      for (const att of topicAttempts) {
        if (att.mistake_tag && att.mistake_tag !== 'none') {
          mistakeFrequencies.set(
            att.mistake_tag,
            (mistakeFrequencies.get(att.mistake_tag) || 0) + 1
          );
        }
      }

      let topMistake: MistakeTag | undefined;
      let maxCount = 0;
      for (const [tag, count] of mistakeFrequencies.entries()) {
        if (count > maxCount) {
          maxCount = count;
          topMistake = tag;
        }
      }

      // Most recent attempt date
      let lastAttemptDate: string | undefined;
      if (topicAttempts.length > 0) {
        const sorted = [...topicAttempts].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        lastAttemptDate = sorted[0].date;
      }

      topicMap.set(topic.id, {
        topicId: topic.id,
        topicName: topic.name,
        attempts: totalAttempts,
        solvedCount: successes,
        successRate,
        wilsonLowerBound: wilsonLB,
        weakness,
        isUntested,
        topMistake,
        lastAttemptDate,
      });
    }

    return topicMap;
  }

  /**
   * Returns weak-topic ranking sorted by weakness descending.
   * Tested topics with high weakness come first, followed by untested topics.
   */
  public static getWeakTopicRanking(
    topicStats: Map<string, TopicStatRecord>
  ): TopicStatRecord[] {
    return Array.from(topicStats.values()).sort((a, b) => {
      // Untested topics go to the bottom of the weak ranking
      if (a.isUntested && !b.isUntested) return 1;
      if (!a.isUntested && b.isUntested) return -1;
      return b.weakness - a.weakness;
    });
  }

  /**
   * Computes Topic × Difficulty coverage matrix.
   * Cell value = number of DISTINCT problems in that topic and difficulty that have at least one 'solved' attempt.
   * A problem with multiple topics counts in each of its topics.
   */
  public static computeCoverageMatrix(
    topics: Topic[],
    problems: Problem[],
    attempts: Attempt[]
  ): TopicCoverageRow[] {
    const solvedProblemIds = new Set(
      attempts.filter((a) => a.status === 'solved').map((a) => a.problem_id)
    );

    return topics.map((topic) => {
      const topicProblems = problems.filter((p) => p.topic_ids.includes(topic.id));

      const easyProblems = topicProblems.filter((p) => p.difficulty === 'easy');
      const mediumProblems = topicProblems.filter((p) => p.difficulty === 'medium');
      const hardProblems = topicProblems.filter((p) => p.difficulty === 'hard');

      const easySolved = easyProblems.filter((p) => solvedProblemIds.has(p.id)).length;
      const mediumSolved = mediumProblems.filter((p) => solvedProblemIds.has(p.id)).length;
      const hardSolved = hardProblems.filter((p) => solvedProblemIds.has(p.id)).length;

      const totalSolved = easySolved + mediumSolved + hardSolved;
      const totalProblems = topicProblems.length;
      const masteryPercentage =
        totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

      return {
        topic_id: topic.id,
        topic_name: topic.name,
        easy: { solved: easySolved, total: easyProblems.length },
        medium: { solved: mediumSolved, total: mediumProblems.length },
        hard: { solved: hardSolved, total: hardProblems.length },
        total_solved: totalSolved,
        total_problems: totalProblems,
        mastery_percentage: masteryPercentage,
        is_unlocked: topic.prerequisites.length === 0,
      };
    });
  }
}

