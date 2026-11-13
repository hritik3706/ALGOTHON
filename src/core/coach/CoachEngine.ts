import {
  getPlan,
  getTopics,
  getTopicPath,
  getInsights,
  getLeeches,
  getStreak,
  getUpcomingRevisions,
} from '../../api';

export interface ProposedAction {
  id: string;
  type: 'log_attempt' | 'mark_relearned' | 'add_problem';
  summary: string;
  payload: any;
}

export interface CoachResponse {
  text: string;
  basedOnChips: string[];
  suggestionChips?: string[];
  proposedAction?: ProposedAction;
}

export class CoachEngine {
  /**
   * Deterministic client-side intent router and template engine.
   * Completely offline, zero network, zero telemetry.
   */
  public static async answerQuery(query: string, currentTopicId?: string): Promise<CoachResponse> {
    const q = query.trim().toLowerCase();

    // 1. "What should I do today?" / "today's plan"
    if (q.includes('what should i do') || q.includes('today') || q.includes('plan') || q.includes('what to practice')) {
      const plan = await getPlan();
      if (plan.length === 0) {
        return {
          text: "Your daily plan queue is currently clear! You have no due revisions scheduled for today. You can log a new problem or pick an unlocked topic to practice.",
          basedOnChips: ["Daily Interleaved Planner", "0 due items"],
          suggestionChips: ["What is my weakest topic?", "Am I avoiding anything?", "What is due this week?"],
        };
      }

      const itemsList = plan
        .map((p, idx) => `${idx + 1}. **${p.problem.title}** (${p.topic.name}, ${p.problem.difficulty.toUpperCase()}) — *${p.reason}*`)
        .join('\n');

      return {
        text: `Here is your recommended interleaved practice plan for today:\n\n${itemsList}\n\nFocus on these ${plan.length} problems to strengthen weak topics and maintain your SM-2 intervals.`,
        basedOnChips: [`${plan.length} Interleaved Items`, "Topic DAG", "SM-2 Due Queue"],
        suggestionChips: ["Why is this in my plan?", "What is my weakest topic?", "Start review session"],
      };
    }

    // 2. "Why is X in my plan?"
    if (q.includes('why is') && q.includes('in my plan')) {
      const plan = await getPlan();
      if (plan.length === 0) {
        return {
          text: "Your plan is currently empty.",
          basedOnChips: ["Daily Planner"],
        };
      }

      // Check if query mentions a specific problem
      const matchedItem = plan.find((p) => q.includes(p.problem.title.toLowerCase()));
      if (matchedItem) {
        return {
          text: `**${matchedItem.problem.title}** is in your plan because: **${matchedItem.reason}**.\n\nIt belongs to topic **${matchedItem.topic.name}** with difficulty **${matchedItem.problem.difficulty.toUpperCase()}**.`,
          basedOnChips: [`Problem: ${matchedItem.problem.title}`, `Topic: ${matchedItem.topic.name}`],
          suggestionChips: ["What should I do today?", "What do I need before this?"],
        };
      }

      return {
        text: `Problems in your plan are selected using greedy topic interleaving: mixing high-priority due spaced revisions with your weakest unlocked topics to prevent both forgetting and burnout.`,
        basedOnChips: ["Greedy Interleaving Algorithm", "Wilson Score Lower Bounds"],
        suggestionChips: ["What should I do today?", "What is my weakest topic?"],
      };
    }

    // 3. "Weakest topic" / "What am I bad at?"
    if (q.includes('weak') || q.includes('worst') || q.includes('struggl')) {
      const insights = await getInsights();
      const weakTopics = insights.weak_topics;

      if (weakTopics.length === 0 || weakTopics.every((t) => t.attempts === 0)) {
        return {
          text: "You haven't logged enough attempts yet to compute confidence intervals. Solve a few problems to calculate your Wilson lower-bound scores.",
          basedOnChips: ["Wilson 95% Confidence", "0 logged attempts"],
          suggestionChips: ["What should I do today?", "Load demo data"],
        };
      }

      const topWeak = weakTopics[0];
      return {
        text: `Your weakest topic is **${topWeak.topic.name}** with a Wilson health score of **${topWeak.strength}/100** (${topWeak.attempts} attempts, ${Math.round(topWeak.success_rate * 100)}% solve rate).\n\n${topWeak.top_mistake ? `Your most common mistake here is **${topWeak.top_mistake}**.` : ''}`,
        basedOnChips: [`Wilson Score: ${topWeak.strength}/100`, `Attempts: ${topWeak.attempts}`],
        suggestionChips: [`What do I need before ${topWeak.topic.name}?`, "What should I do today?", "Am I avoiding anything?"],
      };
    }

    // 4. "What do I need before X?" / Prerequisite path
    if (q.includes('need before') || q.includes('prerequisite') || q.includes('prereq') || q.includes('unlock')) {
      const topics = await getTopics();
      // Match topic name in query
      const target = topics.find((t) => q.includes(t.topic.name.toLowerCase()) || q.includes(t.topic.id.toLowerCase())) ||
        (currentTopicId ? topics.find((t) => t.topic.id === currentTopicId) : undefined);

      if (!target) {
        return {
          text: "Which topic would you like to explore? (e.g., 'What do I need before Dynamic Programming?' or 'What do I need before Graphs?')",
          basedOnChips: ["Topic DAG Explorer"],
          suggestionChips: ["What do I need before Graphs?", "What do I need before DP?"],
        };
      }

      const pathResult = await getTopicPath(target.topic.id);
      if (pathResult.is_unlocked) {
        return {
          text: `**${target.topic.name}** is already **fully unlocked**! All required prerequisites meet the threshold (≥5 attempts, ≥60% success rate).`,
          basedOnChips: [`Topic: ${target.topic.name}`, "Status: Unlocked"],
          suggestionChips: ["What should I do today?", "What is my weakest topic?"],
        };
      }

      const chain = pathResult.path.map((t) => `**${t.name}**`).join(' → ');
      return {
        text: `To unlock **${target.topic.name}**, you need to satisfy this prerequisite chain:\n\n${chain} → **${target.topic.name}**\n\nEach prerequisite requires at least 5 attempts and a 60% solve rate.`,
        basedOnChips: [`Prerequisite DAG`, `${pathResult.path.length} locked steps`],
        suggestionChips: ["What should I do today?", "What is my weakest topic?"],
      };
    }

    // 5. "Avoidance" / "Am I avoiding anything?"
    if (q.includes('avoid') || q.includes('bias') || q.includes('neglect')) {
      const insights = await getInsights();
      if (insights.avoided_topics.length === 0) {
        return {
          text: "No avoidance bias detected! Your practice distribution currently matches the interview importance weights across the topic DAG.",
          basedOnChips: ["Avoidance Engine", "Expected vs Actual Share"],
          suggestionChips: ["What should I do today?", "What is my weakest topic?"],
        };
      }

      const avoidList = insights.avoided_topics
        .map((a) => `- **${a.topic.name}**: Expected ${a.expected_share}% share (importance ${a.topic.importance_weight}/5), but actual share is ${a.actual_share}% (${a.attempts} attempts).`)
        .join('\n');

      return {
        text: `You appear to be avoiding the following high-impact topics:\n\n${avoidList}\n\nAlgothon automatically boosts these in your daily practice plan to prevent blind spots.`,
        basedOnChips: [`${insights.avoided_topics.length} Avoided Topics`, "Importance Weighted Share"],
        suggestionChips: ["What should I do today?", "What is my weakest topic?"],
      };
    }

    // 6. "How am I doing this week?" / "progress" / "streak"
    if (q.includes('week') || q.includes('streak') || q.includes('progress') || q.includes('doing')) {
      const insights = await getInsights();
      const streak = await getStreak();
      const totalSolved = insights.last_7_days.reduce((acc, d) => acc + d.solved_count, 0);
      const totalAttempts = insights.last_7_days.reduce((acc, d) => acc + d.attempts_count, 0);

      return {
        text: `Here is your 7-day progress snapshot:\n\n- **Current Streak:** ${streak} consecutive days\n- **Last 7 Days Solved:** ${totalSolved} problems (${totalAttempts} total attempts)\n- **Topics Unlocked:** ${insights.topics_unlocked} of ${insights.total_topics || 10}\n- **Total Problems Tracked:** ${insights.total_problems}`,
        basedOnChips: [`${streak}d Streak`, `${totalSolved} Solves Last 7 Days`],
        suggestionChips: ["What should I do today?", "What is my weakest topic?"],
      };
    }

    // 7. "What is due tomorrow or this week?" / "due"
    if (q.includes('due') || q.includes('upcoming') || q.includes('schedule')) {
      const upcoming = await getUpcomingRevisions(5);
      if (upcoming.length === 0) {
        return {
          text: "You have no upcoming spaced revisions scheduled. Log solved problems to automatically seed SM-2 intervals.",
          basedOnChips: ["SM-2 Scheduler", "0 upcoming"],
          suggestionChips: ["What should I do today?", "Load demo data"],
        };
      }

      const list = upcoming
        .map((u) => `- **${u.problem.title}**: ${u.is_due ? '**Due Now**' : u.days_until_due === 1 ? 'Due tomorrow' : `Due in ${u.days_until_due} days`} (Interval: ${u.revision.interval_days}d)`)
        .join('\n');

      return {
        text: `Here are your upcoming spaced revisions:\n\n${list}`,
        basedOnChips: [`SM-2 Min-Heap`, `${upcoming.length} scheduled`],
        suggestionChips: ["Start review session", "What should I do today?"],
      };
    }

    // 8. "Leeches" / "slipping"
    if (q.includes('leech') || q.includes('slip') || q.includes('stuck') || q.includes('failing')) {
      const leeches = await getLeeches();
      if (leeches.length === 0) {
        return {
          text: "No leeches detected! A problem becomes a leech when it fails 3 or more times or its ease factor drops below 1.5.",
          basedOnChips: ["Leech Quarantine Defense", "0 leeches"],
          suggestionChips: ["What should I do today?", "What is my weakest topic?"],
        };
      }

      const list = leeches
        .map((l) => `- **${l.problem.title}** (${l.topic?.name}): Failed ${l.revision.failed_count} times, Ease Factor: ${l.revision.ease_factor}`)
        .join('\n');

      return {
        text: `You have **${leeches.length} quarantined leech problem${leeches.length > 1 ? 's' : ''}**:\n\n${list}\n\nThese problems are paused from normal exponential expansion until fundamentally re-studied.`,
        basedOnChips: [`${leeches.length} Quarantined Leeches`, "Ease Factor < 1.5"],
        suggestionChips: ["What should I do today?", "Go to Revisions"],
      };
    }

    // 9. Natural Language Quick-Log Action: e.g. "log: solved Two Sum, 15 min"
    if (q.startsWith('log') || q.startsWith('solve') || q.includes('just solved')) {
      // Parse problem title if possible
      const titleMatch = query.match(/(?:solved|log|completed)\s+([a-zA-Z0-9\s]+?)(?:,|$|\bin\b|\bwith\b)/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Two Sum';

      return {
        text: `I have prepared a draft attempt for **${title}**. Review the details and click Confirm below to save it to your local database:`,
        basedOnChips: ["Natural Language Intent Parser"],
        proposedAction: {
          id: `act_${Date.now()}`,
          type: 'log_attempt',
          summary: `Log solve for "${title}" (15 min, Solved, Quality 4)`,
          payload: {
            title,
            platform: 'LeetCode',
            difficulty: 'medium',
            topic_ids: ['arrays'],
            status: 'solved',
            time_taken: 15,
            mistake_tag: 'none',
            recall_quality: 4,
          },
        },
      };
    }

    // 10. Default / Unmatched Intent Fallback
    return {
      text: "I am your local DSA practice Coach. You can ask me about your daily plan, weakest topics, prerequisite DAG paths, spaced revisions, or mistake patterns.",
      basedOnChips: ["Offline Coach", "Client-Side"],
      suggestionChips: [
        "What should I do today?",
        "What is my weakest topic?",
        "What do I need before Graphs?",
        "How am I doing this week?",
      ],
    };
  }
}
