import { FC, useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Pill } from '../../components/common/Pill';
import {
  getInsights,
  getCoverageMatrix,
  subscribeToStore,
  InsightSummary,
  TopicCoverageRow,
} from '../../api';
import { AlertTriangle, TrendingUp, BarChart2, CheckCircle2 } from 'lucide-react';

export const InsightsScreen: FC = () => {
  const [insights, setInsights] = useState<InsightSummary | null>(null);
  const [coverageRows, setCoverageRows] = useState<TopicCoverageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchInsights = () => {
      Promise.all([getInsights(), getCoverageMatrix()]).then(([ins, matrix]) => {
        if (mounted) {
          setInsights(ins);
          setCoverageRows(matrix);
          setIsLoading(false);
        }
      });
    };
    fetchInsights();
    const unsubscribe = subscribeToStore(fetchInsights);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const streak = insights?.streak ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-pulse">
        <div className="h-12 bg-surface-2/60 rounded-xl w-2/3" />
        <div className="h-48 bg-surface-2/40 rounded-xl" />
        <div className="h-64 bg-surface-2/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
          Performance <em className="italic text-accent">Insights & Analytics</em>
        </h1>
        <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1">
          Objective diagnostic engine: Wilson score lower bounds, avoidance bias detection, and momentum tracking.
        </p>
      </div>

      {/* Avoidance Alerts Section (if any topic is avoided) */}
      {insights && insights.avoided_topics.length > 0 && (
        <Card className="p-6 bg-surface border-accent/30 space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-ui text-base font-semibold">
              Avoidance Bias Detected ({insights.avoided_topics.length} topic)
            </h3>
          </div>
          <p className="font-mono text-xs text-fg-muted">
            You are spending significantly less practice time on these topics relative to their high interview importance weight.
          </p>

          <div className="space-y-3 pt-1">
            {insights.avoided_topics.map((item) => (
              <div
                key={item.topic.id}
                className="p-4 rounded-xl bg-surface-2/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-ui text-base font-semibold text-fg">
                      {item.topic.name}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
                      Importance: {item.topic.importance_weight}/5
                    </span>
                  </div>
                  <div className="font-mono text-xs text-fg-faint mt-1">
                    Expected practice share: <strong>{item.expected_share}%</strong> vs Actual: <strong>{item.actual_share}%</strong> ({item.attempts} attempts)
                  </div>
                </div>
                <Pill variant="due" size="sm" dot>
                  Priority in Today's Plan
                </Pill>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weak Topics Ranking (Wilson Lower Bound) */}
      <Card className="p-6 bg-surface space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-ui text-base font-semibold text-fg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Weakest Topics Ranking (Wilson 95% Confidence Lower Bound)
          </h3>
          <span className="font-mono text-xs text-fg-faint">
            Prevents small-sample bias (18/20 &gt; 1/1)
          </span>
        </div>

        <div className="space-y-3">
          {(insights?.weak_topics ?? []).length === 0 ? (
            <div className="py-6 text-center font-mono text-xs text-fg-faint">
              No topic attempts logged yet.
            </div>
          ) : (
            (insights?.weak_topics ?? []).map((ts, idx) => (
              <div
                key={ts.topic.id}
                className="p-3.5 rounded-xl bg-surface-2/40 border border-border/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs w-6 text-fg-faint font-bold">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-ui text-sm font-semibold text-fg">
                      {ts.topic.name}
                    </div>
                    <div className="font-mono text-[11px] text-fg-faint">
                      {ts.attempts} attempts • {Math.round(ts.success_rate * 100)}% raw solve rate
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-display text-xl text-fg leading-none">
                      {ts.strength}
                      <span className="text-xs font-display text-fg-faint">/100</span>
                    </div>
                    <div className="font-mono text-[10px] text-fg-faint mt-0.5">
                      Wilson Score
                    </div>
                  </div>
                  {ts.strength >= 70 ? (
                    <Pill variant="done" size="sm">Solid</Pill>
                  ) : ts.strength >= 40 ? (
                    <Pill variant="neutral" size="sm">Moderate</Pill>
                  ) : (
                    <Pill variant="failed" size="sm">Weak</Pill>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Dynamic Topic x Difficulty Coverage Matrix */}
      <Card className="p-6 bg-surface space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-ui text-base font-semibold text-fg flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-accent" />
            Topic × Difficulty Coverage Matrix
          </h3>
          <span className="font-mono text-xs text-fg-faint">Distinct problems solved / total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border/50 text-fg-faint text-[10px] uppercase">
                <th className="py-2.5 px-3">Topic</th>
                <th className="py-2.5 px-3 text-center">Easy</th>
                <th className="py-2.5 px-3 text-center">Medium</th>
                <th className="py-2.5 px-3 text-center">Hard</th>
                <th className="py-2.5 px-3 text-right">Mastery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 text-fg-muted">
              {coverageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-fg-faint">
                    No topic coverage data available.
                  </td>
                </tr>
              ) : (
                coverageRows.map((row) => (
                  <tr key={row.topic_id}>
                    <td className="py-3 px-3 font-semibold text-fg flex items-center gap-2">
                      <span>{row.topic_name}</span>
                      {!row.is_unlocked && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/10 text-danger border border-danger/20">
                          Locked
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.easy.total > 0 ? (
                        <span className={row.easy.solved > 0 ? 'text-accent font-semibold' : 'text-fg-faint'}>
                          {row.easy.solved} / {row.easy.total}
                        </span>
                      ) : (
                        <span className="text-fg-faint">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.medium.total > 0 ? (
                        <span className={row.medium.solved > 0 ? 'text-accent font-semibold' : 'text-fg-faint'}>
                          {row.medium.solved} / {row.medium.total}
                        </span>
                      ) : (
                        <span className="text-fg-faint">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.hard.total > 0 ? (
                        <span className={row.hard.solved > 0 ? 'text-accent font-semibold' : 'text-fg-faint'}>
                          {row.hard.solved} / {row.hard.total}
                        </span>
                      ) : (
                        <span className="text-fg-faint">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {row.total_problems > 0 ? (
                        <span className={`font-bold ${row.mastery_percentage >= 70 ? 'text-accent' : row.mastery_percentage >= 40 ? 'text-fg' : 'text-fg-muted'}`}>
                          {row.mastery_percentage}%
                        </span>
                      ) : (
                        <span className="text-fg-faint">0%</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Streak & Consistency */}
      <Card className="p-6 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent">
            <CheckCircle2 className="w-5 h-5" />
            <h4 className="font-ui text-base font-semibold text-fg">
              {streak} Consecutive Practice Days
            </h4>
          </div>
          <p className="font-mono text-xs text-fg-muted">
            Logging at least 1 problem every 24 hours sustains exponential spaced revision efficiency.
          </p>
        </div>
        <div className="font-display text-4xl text-accent font-normal shrink-0">
          {streak}d <span className="font-display text-xl text-fg-faint">streak</span>
        </div>
      </Card>
    </div>
  );
};
