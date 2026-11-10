import { FC, useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Pill } from '../../components/common/Pill';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';
import {
  getDueRevisions,
  getLeeches,
  markRelearned,
  resetToSampleData,
  Problem,
  Revision,
  Topic,
} from '../../api';
import { Clock, AlertOctagon, RotateCcw, Check, RefreshCw } from 'lucide-react';

interface RevisionsScreenProps {
  onLogProblem: (title: string, topicId?: string) => void;
}

export const RevisionsScreen: FC<RevisionsScreenProps> = ({ onLogProblem }) => {
  const { showToast } = useToast();
  const [dueQueue, setDueQueue] = useState<
    { problem: Problem; revision: Revision; topic?: Topic }[]
  >([]);
  const [leeches, setLeeches] = useState<
    { problem: Problem; revision: Revision; topic?: Topic }[]
  >([]);

  const loadData = () => {
    Promise.all([getDueRevisions(), getLeeches()]).then(([due, lch]) => {
      setDueQueue(due);
      setLeeches(lch);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkRelearned = async (problemId: string, title: string) => {
    try {
      await markRelearned(problemId);
      showToast(`Leech cleared: "${title}" is ready for regular scheduling.`);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Error clearing leech status', 'danger');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
            Spaced <em className="italic text-accent">Revision Scheduler</em>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1">
            SuperMemo-2 adaptive interval min-heap. Leeches (≥3 fails or EF &lt; 1.5) are quarantined for scratch relearning.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={resetToSampleData}
          title="Reload clean seed dataset for repeatable demo"
        >
          Reset Demo Data
        </Button>
      </div>

      {/* Leech Quarantine Alert (if any leeches exist) */}
      {leeches.length > 0 && (
        <Card className="p-6 bg-danger/10 border-danger/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-danger">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <h3 className="font-ui text-base font-semibold">
                Leech Defense: Quarantined Problems ({leeches.length})
              </h3>
            </div>
            <Pill variant="leech" dot>
              Needs Fundamental Relearn
            </Pill>
          </div>
          <p className="font-mono text-xs text-fg-muted">
            These problems have stalled (failed ≥3 times or ease factor dropped below 1.5). Normal spaced repetition is paused until fundamental patterns are re-studied.
          </p>

          <div className="space-y-3 pt-2">
            {leeches.map((item) => (
              <div
                key={item.problem.id}
                className="p-4 rounded-xl bg-surface border border-danger/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-ui text-base font-semibold text-fg">
                      {item.problem.title}
                    </span>
                    <span className="font-mono text-xs text-danger font-medium">
                      Failed {item.revision.failed_count} times
                    </span>
                  </div>
                  <div className="font-mono text-xs text-fg-faint mt-1">
                    Topic: {item.topic?.name || 'DSA'} • Ease Factor: {item.revision.ease_factor} (floor 1.3)
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Check className="w-3.5 h-3.5 text-accent" />}
                    onClick={() => handleMarkRelearned(item.problem.id, item.problem.title)}
                    className="text-xs hover:text-accent"
                  >
                    Mark relearned
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => onLogProblem(item.problem.title, item.topic?.id)}
                  >
                    Relearn problem
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Due Queue Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-ui text-sm font-semibold uppercase tracking-wider text-fg-muted flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Due Revisions Queue (Min-Heap Order)
          </h2>
          <span className="font-mono text-xs text-fg-faint">
            Next due &le; Today
          </span>
        </div>

        {dueQueue.length === 0 ? (
          <EmptyState
            title="No revisions due right now"
            description="Your memory consolidation schedule is up to date! Check Today's Plan to practice new frontier problems."
            actionLabel="View Today's Plan"
            onAction={() => {}}
          />
        ) : (
          <div className="space-y-3">
            {dueQueue.map((item) => (
              <Card
                key={item.problem.id}
                className="p-5 bg-surface hover:bg-surface-2/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-ui text-base font-semibold text-fg">
                      {item.problem.title}
                    </span>
                    <span className="font-mono text-xs text-fg-faint">
                      ({item.topic?.name})
                    </span>
                    <Pill variant="due" size="sm" dot>
                      Due today
                    </Pill>
                  </div>
                  <div className="font-mono text-xs text-fg-muted flex flex-wrap gap-4 pt-0.5">
                    <span>Interval: <strong>{item.revision.interval_days} days</strong></span>
                    <span>Repetitions: <strong>{item.revision.repetitions}</strong></span>
                    <span>Ease Factor: <strong>{item.revision.ease_factor}</strong></span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onLogProblem(item.problem.title, item.topic?.id)}
                >
                  Log revision
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
