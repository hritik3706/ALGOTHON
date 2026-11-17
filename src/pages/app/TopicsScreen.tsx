import { FC, useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Pill } from '../../components/common/Pill';
import { Button } from '../../components/common/Button';
import {
  getTopics,
  getTopicPath,
  getTopicProblems,
  subscribeToStore,
  TopicSummary,
  Topic,
  Problem,
  Attempt,
  Revision,
} from '../../api';
import {
  Search,
  Lock,
  Unlock,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface TopicsScreenProps {
  onLogTopic?: (topicId: string, problemTitle?: string) => void;
}

interface TopicProblemItem {
  problem: Problem;
  attemptsCount: number;
  solvedCount: number;
  lastAttempt?: Attempt;
  revision?: Revision;
}

export const TopicsScreen: FC<TopicsScreenProps> = ({ onLogTopic }) => {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('dp');
  const [prereqPath, setPrereqPath] = useState<{ path: Topic[]; is_unlocked: boolean } | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'locked' | 'weak'>('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [topicProblemsMap, setTopicProblemsMap] = useState<Record<string, TopicProblemItem[]>>({});
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      getTopics().then((res) => {
        setTopics(res);
        if (res.length > 0) {
          const currentId =
            selectedTopicId && res.some((t) => t.topic.id === selectedTopicId)
              ? selectedTopicId
              : 'dp';
          handleSearchPrereqs(currentId);
        }
      });
    };
    fetchData();
    const unsubscribe = subscribeToStore(fetchData);
    return () => unsubscribe();
  }, []);

  const handleSearchPrereqs = async (topicId: string) => {
    setSelectedTopicId(topicId);
    const result = await getTopicPath(topicId);
    setPrereqPath(result);
  };

  const handleToggleExpandTopic = async (topicId: string) => {
    if (expandedTopicId === topicId) {
      setExpandedTopicId(null);
      return;
    }

    setExpandedTopicId(topicId);
    if (!topicProblemsMap[topicId]) {
      setIsLoadingProblems(true);
      try {
        const pItems = await getTopicProblems(topicId);
        setTopicProblemsMap((prev) => ({ ...prev, [topicId]: pItems }));
      } finally {
        setIsLoadingProblems(false);
      }
    }
  };

  const getTrendBadge = (trend: TopicSummary['trend']) => {
    switch (trend) {
      case 'improving':
        return <span className="font-mono text-[10px] text-accent">↑ Improving</span>;
      case 'regressing':
        return <span className="font-mono text-[10px] text-danger">↓ Regressing</span>;
      case 'flat':
        return <span className="font-mono text-[10px] text-fg-muted">→ Flat</span>;
      default:
        return <span className="font-mono text-[10px] text-fg-faint">• New</span>;
    }
  };

  const filteredTopics = topics.filter((t) => {
    if (filterMode === 'unlocked') return t.is_unlocked;
    if (filterMode === 'locked') return !t.is_unlocked;
    if (filterMode === 'weak') return t.strength < 40 || t.attempts === 0;
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Curriculum Progression & Topic DAG</span>
          </div>
          <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
            Topic <em className="italic text-accent">Mastery & Problems</em>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1 max-w-2xl">
            A structured path through all DSA interview topics. Master prerequisites before unlocking advanced topics. Expand any topic to view its problems, solve history, and SM-2 schedules.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-2/60 border border-border rounded-xl font-mono text-xs">
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'unlocked', label: 'Unlocked' },
            { id: 'locked', label: 'Locked' },
            { id: 'weak', label: 'Needs Practice' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as any)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterMode === tab.id
                  ? 'bg-accent text-accent-ink font-bold'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prerequisite Path Query Explorer */}
      <Card className="p-6 bg-surface-2/40 border-accent/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-accent" />
            <span className="font-ui text-sm font-semibold text-fg">
              Prerequisite Explorer: "What do I need before...?"
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTopicId}
              onChange={(e) => handleSearchPrereqs(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono text-fg focus-visible:outline-accent"
            >
              {topics.map((t) => (
                <option key={t.topic.id} value={t.topic.id}>
                  {t.topic.name} {t.is_unlocked ? '(Unlocked)' : '(Locked)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chain visualization */}
        {prereqPath && (
          <div className="p-4 rounded-xl bg-surface border border-border/80">
            {prereqPath.is_unlocked ? (
              <div className="flex items-center gap-2 text-accent font-mono text-xs">
                <Unlock className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  All prerequisites for{' '}
                  <strong className="text-fg font-semibold">
                    {topics.find((t) => t.topic.id === selectedTopicId)?.topic.name}
                  </strong>{' '}
                  are satisfied (≥5 attempts, ≥60% solve rate)! Topic is fully unlocked.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-danger font-mono text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Locked prerequisite chain for{' '}
                    <strong className="text-fg font-semibold">
                      {topics.find((t) => t.topic.id === selectedTopicId)?.topic.name}
                    </strong>
                    :
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {prereqPath.path.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-pill bg-danger/10 border border-danger/30 text-danger font-mono text-xs">
                        {item.name}
                      </span>
                      {idx < prereqPath.path.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-fg-faint" />
                      )}
                    </div>
                  ))}
                  <ArrowRight className="w-3.5 h-3.5 text-fg-faint" />
                  <span className="px-3 py-1 rounded-pill bg-surface-2 border border-border text-fg-muted font-mono text-xs">
                    {topics.find((t) => t.topic.id === selectedTopicId)?.topic.name} (Target)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Topics List with Accordion Curriculum */}
      <div className="space-y-3">
        {filteredTopics.map((ts) => {
          const isExpanded = expandedTopicId === ts.topic.id;
          const problems = topicProblemsMap[ts.topic.id] || [];

          return (
            <Card
              key={ts.topic.id}
              className={`p-5 transition-all ${
                ts.is_unlocked
                  ? 'bg-surface border-border hover:border-accent/40'
                  : 'bg-surface/50 border-border/50'
              }`}
            >
              {/* Main Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    {ts.is_unlocked ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Unlock className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center text-danger">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="font-ui text-base font-semibold text-fg">
                      {ts.topic.name}
                    </span>
                    <span className="font-mono text-[10px] text-fg-faint px-2 py-0.5 rounded bg-surface-2 border border-border">
                      Weight: {ts.topic.importance_weight}/5
                    </span>
                    {ts.is_unlocked ? (
                      <Pill variant="due" size="sm">
                        Unlocked
                      </Pill>
                    ) : (
                      <Pill variant="failed" size="sm">
                        Locked
                      </Pill>
                    )}
                  </div>

                  {!ts.is_unlocked && ts.weakest_prerequisite && (
                    <div className="font-mono text-xs text-danger flex items-center gap-1.5 pl-8">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Prerequisite bottleneck: <strong>{ts.weakest_prerequisite.name}</strong> (needs 5 attempts, currently {ts.weakest_prerequisite.attempts} att, {Math.round(ts.weakest_prerequisite.success_rate * 100)}% solve rate)
                      </span>
                    </div>
                  )}

                  {ts.is_unlocked && ts.topic.prerequisites.length > 0 && (
                    <div className="font-mono text-[11px] text-fg-faint pl-8">
                      Prerequisites satisfied: {ts.topic.prerequisites.join(', ')}
                    </div>
                  )}
                </div>

                {/* Right Metrics & Expand Action */}
                <div className="flex items-center gap-6 sm:justify-end">
                  {/* Wilson Score */}
                  <div className="text-center font-mono">
                    <div className="font-display text-2xl text-fg leading-none">
                      {ts.strength}
                      <span className="text-xs text-fg-faint">/100</span>
                    </div>
                    <div className="text-[10px] text-fg-faint mt-1">{getTrendBadge(ts.trend)}</div>
                  </div>

                  {/* Attempts & Success Rate */}
                  <div className="text-center font-mono">
                    <div className="text-xs font-semibold text-fg">
                      {Math.round(ts.success_rate * 100)}%
                    </div>
                    <div className="text-[10px] text-fg-faint">
                      {ts.attempts} {ts.attempts === 1 ? 'attempt' : 'attempts'}
                    </div>
                  </div>

                  {/* Top Mistake */}
                  <div className="hidden sm:block text-center font-mono">
                    {ts.top_mistake ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-2 text-fg-muted border border-border">
                        {ts.top_mistake}
                      </span>
                    ) : (
                      <span className="text-[10px] text-fg-faint">—</span>
                    )}
                    <div className="text-[10px] text-fg-faint mt-1">Common Mistake</div>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => handleToggleExpandTopic(ts.topic.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-border hover:border-accent text-xs font-mono text-fg transition-all"
                  >
                    <span>{isExpanded ? 'Hide' : 'Problems'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Accordion Problems View */}
              {isExpanded && (
                <div className="mt-5 pt-4 border-t border-border/80 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between font-mono text-xs text-fg-faint">
                    <span>Topic Problem Library</span>
                    {onLogTopic && (
                      <button
                        onClick={() => onLogTopic(ts.topic.id)}
                        className="flex items-center gap-1 text-accent hover:underline text-[11px]"
                      >
                        <Plus className="w-3 h-3" /> Log New Problem in {ts.topic.name}
                      </button>
                    )}
                  </div>

                  {isLoadingProblems && !topicProblemsMap[ts.topic.id] ? (
                    <div className="py-6 text-center font-mono text-xs text-fg-faint animate-pulse">
                      Loading topic problems...
                    </div>
                  ) : problems.length === 0 ? (
                    <div className="py-6 text-center font-mono text-xs text-fg-faint">
                      No problems in this topic yet. Click "Log New Problem" to add one!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {problems.map(({ problem, attemptsCount, solvedCount, lastAttempt, revision }) => (
                        <div
                          key={problem.id}
                          className="p-3.5 rounded-xl bg-surface-2/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {solvedCount > 0 ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : attemptsCount > 0 ? (
                                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-fg-faint/40 shrink-0" />
                              )}
                              <span className="font-ui text-sm font-semibold text-fg">
                                {problem.title}
                              </span>
                              <span
                                className={`font-mono text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                                  problem.difficulty === 'easy'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : problem.difficulty === 'medium'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {problem.difficulty}
                              </span>
                              <span className="font-mono text-[10px] text-fg-faint">• {problem.platform}</span>
                            </div>

                            <div className="flex items-center gap-3 font-mono text-[10px] text-fg-faint pl-6">
                              <span>
                                Solves: {solvedCount}/{attemptsCount}
                              </span>
                              {lastAttempt && <span>Last attempted: {lastAttempt.date}</span>}
                              {revision && (
                                <span>
                                  SM-2 Interval: {revision.interval_days}d (Ease: {revision.ease_factor})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pl-6 sm:pl-0">
                            {problem.link && (
                              <a
                                href={problem.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-surface border border-border hover:border-accent text-fg-muted hover:text-fg text-xs transition-colors"
                                title="Solve on LeetCode"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {onLogTopic && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => onLogTopic(ts.topic.id, problem.title)}
                                className="text-xs font-mono py-1 px-2.5"
                              >
                                Log Attempt
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
