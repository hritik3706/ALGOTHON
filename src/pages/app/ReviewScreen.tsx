import { FC, useState, useEffect } from 'react';
import {
  getDueRevisions,
  logAttempt,
  Problem,
  Revision,
  Topic,
} from '../../api';
import { Flashcard } from '../../components/common/Flashcard';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

interface ReviewScreenProps {
  onExit: () => void;
}

export const ReviewScreen: FC<ReviewScreenProps> = ({ onExit }) => {
  const { showToast } = useToast();
  const [dueQueue, setDueQueue] = useState<
    { problem: Problem; revision: Revision; topic?: Topic }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedSessions, setCompletedSessions] = useState<
    { problem: Problem; quality: number; nextDate: string; interval: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDueRevisions().then((items) => {
      setDueQueue(items);
      setIsLoading(false);
    });
  }, []);

  const currentItem = dueQueue[currentIndex];

  const handleRate = async (quality: number) => {
    if (!currentItem) return;

    try {
      const result = await logAttempt({
        problem_id: currentItem.problem.id,
        title: currentItem.problem.title,
        platform: currentItem.problem.platform,
        difficulty: currentItem.problem.difficulty,
        topic_ids: currentItem.problem.topic_ids,
        status: quality >= 3 ? 'solved' : quality >= 2 ? 'hint' : 'failed',
        time_taken: 10,
        mistake_tag: quality >= 3 ? 'none' : 'logic',
        recall_quality: quality,
      });

      const nextDate = result.updated_revision?.next_due_date || 'Tomorrow';
      const interval = result.updated_revision?.interval_days || 1;

      setCompletedSessions((prev) => [
        ...prev,
        {
          problem: currentItem.problem,
          quality,
          nextDate,
          interval,
        },
      ]);

      showToast(`Recorded: next review in ${interval} day${interval > 1 ? 's' : ''}`);

      if (currentIndex + 1 < dueQueue.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // All done -> Move to summary
        setCurrentIndex(dueQueue.length);
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving review attempt', 'danger');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="font-mono text-xs text-fg-faint animate-pulse">Loading due review deck...</div>
      </div>
    );
  }

  // Summary State
  if (currentIndex >= dueQueue.length || dueQueue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-8 select-none">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 text-accent mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="font-display text-4xl text-fg font-normal">
            Review Session <em className="italic text-accent">Complete</em>
          </h1>
          <p className="font-mono text-xs text-fg-muted max-w-md mx-auto">
            {completedSessions.length > 0
              ? `You reviewed ${completedSessions.length} problems. Spaced revision intervals updated.`
              : 'No problems currently due in the min-heap. Your queue is 100% clear!'}
          </p>
        </div>

        {completedSessions.length > 0 && (
          <div className="p-6 rounded-card bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-mono text-xs text-fg uppercase font-semibold">
                Updated Schedule Distribution
              </span>
              <span className="font-mono text-xs text-accent">SM-2 Calibrated</span>
            </div>

            <div className="divide-y divide-border/40">
              {completedSessions.map((s, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-fg font-medium">{s.problem.title}</div>
                    <div className="text-[10px] text-fg-faint">
                      Recall: {s.quality}/5 • +{s.interval}d interval
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-surface-2 text-accent border border-border">
                      Due: {s.nextDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pt-4">
          <Button variant="primary" onClick={onExit} icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Top Session Progress Bar & Exit */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Focus Mode</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-accent font-semibold">
            Problem {currentIndex + 1} of {dueQueue.length}
          </span>
          <div className="w-28 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / dueQueue.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Active 3D Flashcard */}
      <div className="py-4">
        <Flashcard
          problem={currentItem.problem}
          topic={currentItem.topic}
          revision={currentItem.revision}
          onRate={handleRate}
        />
      </div>
    </div>
  );
};
