import { FC, useEffect, useState, useCallback } from 'react';
import {
  getPlan,
  getDueRevisions,
  getInsights,
  loadDemoData,
  subscribeToStore,
  PlanItem,
  Revision,
  Problem,
  Topic,
  InsightSummary,
} from '../../api';
import { Card } from '../../components/common/Card';
import { Pill } from '../../components/common/Pill';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { PlusCircle, Flame, Clock, CheckCircle2, Database } from 'lucide-react';

interface TodayScreenProps {
  onNavigateToLog: (problemTitle?: string, topicId?: string) => void;
}

export const TodayScreen: FC<TodayScreenProps> = ({ onNavigateToLog }) => {
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [dueRevisions, setDueRevisions] = useState<
    { problem: Problem; revision: Revision; topic?: Topic }[]
  >([]);
  const [insights, setInsights] = useState<InsightSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    return Promise.all([getPlan(), getDueRevisions(), getInsights()]).then(
      ([p, due, ins]) => {
        setPlan(p);
        setDueRevisions(due);
        setInsights(ins);
        setIsLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToStore(loadData);
    return () => unsubscribe();
  }, [loadData]);

  const handleLoadDemo = async () => {
    setIsLoading(true);
    await loadDemoData();
    await loadData();
  };

  const streak = insights?.streak ?? 0;
  const totalProblems = insights?.total_problems ?? 0;
  const topicsUnlocked = insights?.topics_unlocked ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-pulse">
        <div className="h-14 bg-surface-2/60 rounded-xl w-1/2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-20 bg-surface-2/40 rounded-xl" />
          <div className="h-20 bg-surface-2/40 rounded-xl" />
          <div className="h-20 bg-surface-2/40 rounded-xl" />
          <div className="h-20 bg-surface-2/40 rounded-xl" />
        </div>
        <div className="h-64 bg-surface-2/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
            Today's <em className="italic text-accent">Practice Plan</em>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1">
            Focus on 3–5 high-impact interleaved topics to prevent regression.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => onNavigateToLog()}
          className="shadow-glow"
        >
          Log attempt
        </Button>
      </div>

      {/* Top Stat Pills Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display text-2xl text-fg leading-none">
              {streak} <span className="text-accent text-sm font-display">days</span>
            </div>
            <div className="font-mono text-[10px] text-fg-faint uppercase tracking-wider mt-1">
              Active Streak
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display text-2xl text-fg leading-none">
              {dueRevisions.length}
            </div>
            <div className="font-mono text-[10px] text-fg-faint uppercase tracking-wider mt-1">
              Due Revisions
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center text-fg-muted">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display text-2xl text-fg leading-none">
              {totalProblems}
            </div>
            <div className="font-mono text-[10px] text-fg-faint uppercase tracking-wider mt-1">
              Logged Problems
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <span className="font-display text-base font-bold">DAG</span>
          </div>
          <div>
            <div className="font-display text-2xl text-fg leading-none">
              {topicsUnlocked} <span className="text-fg-faint text-sm font-display">/ {insights?.total_topics ?? 10}</span>
            </div>
            <div className="font-mono text-[10px] text-fg-faint uppercase tracking-wider mt-1">
              Topics Unlocked
            </div>
          </div>
        </Card>
      </div>

      {/* Main Recommended Plan */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-ui text-lg font-semibold text-fg">
              Recommended Today
            </h2>
            <p className="font-mono text-xs text-fg-faint">
              Greedy interleaving with weakness and staleness weighting
            </p>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-surface-2 text-fg-muted border border-border">
            {plan.length} items planned
          </span>
        </div>

        {plan.length === 0 ? (
          <EmptyState
            title="No problems currently in your plan"
            description={
              totalProblems === 0
                ? "Your practice store is currently empty. Log your first solved problem, or load sample demo data to explore the planner and graph."
                : "All due revisions and high-priority practice items are completed for today. Great job keeping your practice queue clear!"
            }
          >
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <Button
                variant="primary"
                size="sm"
                icon={<PlusCircle className="w-4 h-4" />}
                onClick={() => onNavigateToLog()}
              >
                Log your first attempt
              </Button>
              {totalProblems === 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Database className="w-4 h-4" />}
                  onClick={handleLoadDemo}
                >
                  Load demo data
                </Button>
              )}
            </div>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {plan.map((item, index) => {
              const diffBadge = (
                <span
                  className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                    item.problem.difficulty === 'easy'
                      ? 'bg-accent/15 text-accent'
                      : item.problem.difficulty === 'medium'
                      ? 'bg-yellow-500/15 text-yellow-400'
                      : 'bg-danger/15 text-danger'
                  }`}
                >
                  {item.problem.difficulty}
                </span>
              );

              const statusPill =
                item.type === 'due' ? (
                  <Pill variant="due" dot>Due revision</Pill>
                ) : item.type === 'relearn' ? (
                  <Pill variant="leech" dot>Leech: Relearn</Pill>
                ) : (
                  <Pill variant="new" dot>New practice</Pill>
                );

              return (
                <Card
                  key={item.id}
                  className="p-5 bg-surface hover:bg-surface-2/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xs w-6 h-6 rounded-md bg-surface-2 text-fg-muted border border-border flex items-center justify-center shrink-0 font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-ui text-base font-medium text-fg">
                          {item.problem.title}
                        </span>
                        {diffBadge}
                        <span className="font-mono text-xs text-fg-faint">
                          • {item.topic.name}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-fg-muted">
                        {item.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {statusPill}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onNavigateToLog(item.problem.title, item.topic.id)}
                    >
                      Log attempt
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Due Revisions & 7-Day Velocity Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Due Revisions Queue */}
        <Card className="p-6 bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-ui text-sm font-semibold text-fg flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Due Spaced Revisions ({dueRevisions.length})
            </h3>
            <span className="font-mono text-xs text-fg-faint">SM-2 min-heap</span>
          </div>

          {dueRevisions.length === 0 ? (
            <p className="font-mono text-xs text-fg-faint py-4 text-center">
              No problems currently due.
            </p>
          ) : (
            <div className="space-y-2.5">
              {dueRevisions.map((item) => (
                <div
                  key={item.problem.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-2/40 border border-border/40"
                >
                  <div>
                    <div className="font-ui text-xs font-medium text-fg">
                      {item.problem.title}
                    </div>
                    <div className="font-mono text-[10px] text-fg-faint">
                      Interval: {item.revision.interval_days}d • Reps: {item.revision.repetitions} • EF: {item.revision.ease_factor}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onNavigateToLog(item.problem.title, item.topic?.id)}
                    className="text-xs text-accent"
                  >
                    Solve now →
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Last 7 Days Activity */}
        <Card className="p-6 bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-ui text-sm font-semibold text-fg flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent" />
              Last 7 Days Practice
            </h3>
            <span className="font-mono text-xs text-accent">
              {streak}d Streak Active
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {(insights?.last_7_days ?? []).map((day, i) => (
              <div
                key={day.date}
                className="flex flex-col items-center p-2 rounded-xl bg-surface-2/40 border border-border/30 text-center"
              >
                <span className="font-mono text-[10px] text-fg-faint">
                  {day.day_name}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg my-2 flex items-center justify-center font-mono text-xs font-bold ${
                    day.solved_count > 0
                      ? 'bg-accent text-accent-ink shadow-sm'
                      : day.attempts_count > 0
                      ? 'bg-white/20 text-fg'
                      : 'bg-surface text-fg-faint border border-border'
                  }`}
                >
                  {day.solved_count}
                </div>
                <span className="font-mono text-[9px] text-fg-faint">
                  {i === 6 ? 'Today' : `${day.attempts_count} att`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
