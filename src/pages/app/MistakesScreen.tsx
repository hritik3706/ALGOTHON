import { FC, useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getMistakeAnalytics, MistakeTag, Attempt, Problem, askCoach } from '../../api';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

interface MistakesScreenProps {
  onLogProblem?: (title: string, topicId?: string) => void;
}

export const MistakesScreen: FC<MistakesScreenProps> = ({ onLogProblem }) => {
  const [selectedTag, setSelectedTag] = useState<MistakeTag>('off_by_one');
  const [analytics, setAnalytics] = useState<{
    totalMistakes: number;
    tagCounts: Record<MistakeTag, number>;
    tagAttempts: Record<MistakeTag, { attempt: Attempt; problem: Problem; topicNames: string }[]>;
  }>({
    totalMistakes: 0,
    tagCounts: {
      logic: 0,
      off_by_one: 0,
      edge_case: 0,
      tle: 0,
      complexity: 0,
      syntax: 0,
      none: 0,
    },
    tagAttempts: {
      logic: [],
      off_by_one: [],
      edge_case: [],
      tle: [],
      complexity: [],
      syntax: [],
      none: [],
    },
  });

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  useEffect(() => {
    getMistakeAnalytics().then((data) => {
      setAnalytics(data);
      // Pick the tag with highest failure count as initial selection if off_by_one is 0
      const activeTags: MistakeTag[] = ['off_by_one', 'edge_case', 'tle', 'logic', 'complexity', 'syntax'];
      const topTag = activeTags.reduce((prev, curr) =>
        (data.tagCounts[curr] || 0) > (data.tagCounts[prev] || 0) ? curr : prev
      );
      if ((data.tagCounts[topTag] || 0) > 0) {
        setSelectedTag(topTag);
      }
    });
  }, []);

  const mistakeMeta: Record<
    MistakeTag,
    { label: string; desc: string; playbook: string[]; color: string }
  > = {
    off_by_one: {
      label: 'Off-by-One Errors',
      desc: 'Loop boundary, array termination, or pointer arithmetic slips',
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      playbook: [
        'Always test loops on size-0, size-1, and size-2 inputs manually.',
        'Binary search invariant: Use while (l <= r) with r = mid - 1 for closed intervals [l, r].',
        'Sliding window: Clarify if right pointer is inclusive or exclusive before expanding.',
      ],
    },
    edge_case: {
      label: 'Edge Case Omissions',
      desc: 'Empty inputs, single element, duplicates, negative numbers, or integer overflow',
      color: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
      playbook: [
        'Write the 5-point constraint check first: n=0, n=1, duplicates, negatives, maximum constraints.',
        'Check division by zero or modulus operations with zero.',
        'Watch for 32-bit signed integer overflow (-2³¹ to 2³¹ - 1) when summing numbers.',
      ],
    },
    tle: {
      label: 'Time Limit Exceeded (TLE)',
      desc: 'Sub-optimal asymptotic time complexity or redundant recursive branches',
      color: 'text-red-400 bg-red-400/10 border-red-400/30',
      playbook: [
        'Calculate expected operations before coding: N ≤ 10⁵ requires O(N) or O(N log N).',
        'Add memoization / @cache to recursive backtracking before attempting bottom-up DP.',
        'Replace O(N) linear lookups inside loops with O(1) hash sets or frequency maps.',
      ],
    },
    logic: {
      label: 'Algorithmic / Logic Flaws',
      desc: 'Incorrect inductive hypothesis, greedy choice failure, or broken state transition',
      color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
      playbook: [
        'Verify greedy choice property with a counterexample before committing to a greedy approach.',
        'Explicitly state DP recurrence in words: "dp[i] represents the answer for prefix of length i".',
        'Trace state transitions on paper using a small 3-4 node example.',
      ],
    },
    complexity: {
      label: 'Space / Memory Overruns',
      desc: 'Unnecessary deep recursion stack, redundant array copies, or heap allocations',
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
      playbook: [
        'Pass large arrays or collections by reference or index pointer, never slice/copy in recursion.',
        'Notice if DP table only requires previous row: compress O(N × M) space to O(M).',
        'Beware of maximum recursion depth exceeding 1,000 frames on graph traversals (use iterative BFS/DFS).',
      ],
    },
    syntax: {
      label: 'Language & Syntax Slips',
      desc: 'API misuse, reference vs value mutations, type coercion, or language quirks',
      color: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
      playbook: [
        'Memorize core STL/collections methods (sort, lower_bound, PriorityQueue, Map).',
        'Beware of object equality checks (=== vs shallow references) on arrays/sets.',
        'Check return types on helper recursion functions.',
      ],
    },
    none: {
      label: 'Clean Solves',
      desc: 'No major mistakes flagged',
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
      playbook: ['Keep up the clean discipline and maintain interval retention!'],
    },
  };

  const handleAskCoachAboutTag = async (tag: MistakeTag) => {
    setIsLoadingAdvice(true);
    try {
      const prompt = `Give me a concise 3-rule cognitive checklist and mental model to permanently stop making "${mistakeMeta[tag].label}" mistakes in DSA coding interviews.`;
      const res = await askCoach(prompt);
      setAiAdvice(res.text);
    } catch {
      setAiAdvice('Coach could not generate advice at this moment.');
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const currentAttempts = analytics.tagAttempts[selectedTag] || [];
  const currentMeta = mistakeMeta[selectedTag];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Failure Mode & Blind Spot Diagnostics</span>
          </div>
          <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
            Mistake <em className="italic text-accent">Analysis & Intelligence</em>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1 max-w-2xl">
            Coders fail DSA interviews by repeating the same 3 cognitive slips. Categorize your failure patterns, master prevention checklists, and turn recurring bugs into strengths.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-surface-2/60 border border-border px-4 py-3 rounded-2xl">
          <div className="text-right">
            <div className="font-mono text-[10px] text-fg-faint uppercase">Total Tracked Mistakes</div>
            <div className="font-display text-2xl text-accent leading-tight">
              {analytics.totalMistakes}
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-left font-mono text-xs text-fg-muted">
            <div>Root causes identified</div>
            <div className="text-[10px] text-emerald-400">Targeted for active recall</div>
          </div>
        </div>
      </div>

      {/* Mistake Category Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(['off_by_one', 'edge_case', 'tle', 'logic', 'complexity', 'syntax'] as MistakeTag[]).map(
          (tag) => {
            const meta = mistakeMeta[tag];
            const count = analytics.tagCounts[tag] || 0;
            const isSelected = selectedTag === tag;
            const pct = analytics.totalMistakes > 0 ? Math.round((count / analytics.totalMistakes) * 100) : 0;

            return (
              <div
                key={tag}
                onClick={() => {
                  setSelectedTag(tag);
                  setAiAdvice('');
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-accent bg-accent/10 text-fg shadow-[0_0_15px_rgba(255,107,91,0.25)] ring-1 ring-accent/30'
                    : 'border-border bg-surface hover:bg-surface-2/70 text-fg-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider opacity-80">
                    {tag.replace('_', ' ')}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full border ${meta.color}`}
                  >
                    {count} {count === 1 ? 'slip' : 'slips'}
                  </span>
                </div>
                <div className="font-ui text-sm font-semibold text-fg mt-2">{meta.label}</div>
                <p className="font-mono text-[11px] text-fg-faint mt-1 line-clamp-1">{meta.desc}</p>
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-fg-faint">
                  <span>Share of errors</span>
                  <span className="font-bold text-fg">{pct}%</span>
                </div>
                <div className="w-full bg-surface-2 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-accent h-1 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Cognitive Playbook for Selected Mistake */}
      <Card className="p-6 bg-surface-2/40 border-accent/25 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="font-ui text-base font-semibold text-fg">
              {currentMeta.label} Prevention Playbook
            </span>
          </div>
          <button
            onClick={() => handleAskCoachAboutTag(selectedTag)}
            disabled={isLoadingAdvice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/15 border border-accent/30 hover:bg-accent/25 text-accent font-mono text-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoadingAdvice ? 'Consulting Gemini...' : 'Ask Gemini Coach for Deep Checklist'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {currentMeta.playbook.map((rule, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-surface border border-border/80 space-y-1">
              <div className="font-mono text-[10px] font-bold text-accent uppercase">
                Rule #{idx + 1}
              </div>
              <p className="font-mono text-xs text-fg leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>

        {aiAdvice && (
          <div className="mt-4 p-4 rounded-xl bg-[#F4EDE0] text-[#14213D] border border-[#E0BFBA]/60 space-y-2 animate-in fade-in duration-200">
            <div className="font-ui text-xs font-bold uppercase tracking-wider text-[#AE3026] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini AI Coach Deep Advice</span>
            </div>
            <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed">{aiAdvice}</div>
          </div>
        )}
      </Card>

      {/* Logged Failure History for Selected Mistake */}
      <Card className="p-6 bg-surface space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-ui text-base font-semibold text-fg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent" />
              <span>
                Attempt History Tagged with "{currentMeta.label}" ({currentAttempts.length})
              </span>
            </h2>
            <p className="font-mono text-xs text-fg-faint mt-0.5">
              Review specific problem submissions where this mistake occurred.
            </p>
          </div>
        </div>

        {currentAttempts.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-fg-faint space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
            <div className="text-fg font-medium">No recorded mistakes for {currentMeta.label}!</div>
            <p className="text-[11px] text-fg-muted max-w-sm mx-auto">
              Your submissions show zero {currentMeta.label.toLowerCase()} slips. Keep up the high discipline when solving!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentAttempts.map(({ attempt, problem, topicNames }, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-surface-2/40 border border-border hover:border-accent/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-ui text-sm font-semibold text-fg">{problem.title}</span>
                    <span
                      className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold ${
                        problem.difficulty === 'easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : problem.difficulty === 'medium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                    <span className="font-mono text-[10px] text-fg-faint">• {topicNames}</span>
                  </div>

                  {attempt.notes && (
                    <div className="font-mono text-xs text-fg-muted bg-surface/80 p-2.5 rounded-lg border border-border/60">
                      <span className="text-fg-faint text-[10px] uppercase font-bold mr-1.5">
                        Your Attempt Notes:
                      </span>
                      "{attempt.notes}"
                    </div>
                  )}

                  <div className="flex items-center gap-3 font-mono text-[10px] text-fg-faint">
                    <span>Date: {attempt.date}</span>
                    <span>Time spent: {attempt.time_taken}m</span>
                    <span className="capitalize">
                      Status:{' '}
                      <strong className={attempt.status === 'solved' ? 'text-emerald-400' : 'text-danger'}>
                        {attempt.status}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {problem.link && (
                    <a
                      href={problem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-surface border border-border hover:border-accent text-fg-muted hover:text-fg text-xs transition-colors"
                      title="Open problem on LeetCode"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {onLogProblem && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onLogProblem(problem.title, problem.topic_ids[0])}
                      className="text-xs font-mono"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Re-Attempt
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
