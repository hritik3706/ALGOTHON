import { FC, useState, useEffect } from 'react';
import {
  getDueRevisions,
  getProblems,
  getTopics,
  getLeeches,
  logAttempt,
  askCoach,
  Problem,
  Revision,
  Topic,
} from '../../api';
import { Flashcard } from '../../components/common/Flashcard';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import {
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface ReviewScreenProps {
  onExit: () => void;
}

export const ReviewScreen: FC<ReviewScreenProps> = ({ onExit }) => {
  const { showToast } = useToast();
  const [deck, setDeck] = useState<
    { problem: Problem; revision: Revision; topic?: Topic }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedSessions, setCompletedSessions] = useState<
    { problem: Problem; quality: number; nextDate: string; interval: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hint, setHint] = useState<string>('');
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('Daily Spaced Review Deck');

  // Topics for free recall mode
  const [allTopics, setAllTopics] = useState<Topic[]>([]);

  const loadDueDeck = async () => {
    setIsLoading(true);
    try {
      const items = await getDueRevisions();
      const tList = await getTopics();
      setAllTopics(tList.map((t) => t.topic));
      setDeck(items);
      setSessionTitle('Daily Spaced Review Deck');
      setCurrentIndex(0);
      setCompletedSessions([]);
      setHint('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDueDeck();
  }, []);

  const handleStartCramTopic = async (topicId?: string) => {
    setIsLoading(true);
    try {
      const allP = await getProblems();
      const targetProblems = topicId
        ? allP.filter((p) => p.topic_ids.includes(topicId))
        : allP;

      if (targetProblems.length === 0) {
        showToast('No problems found in this category', 'danger');
        return;
      }

      const cramItems = targetProblems.map((p) => ({
        problem: p,
        revision: {
          problem_id: p.id,
          next_due_date: new Date().toISOString().split('T')[0],
          interval_index: 1,
          interval_days: 1,
          ease_factor: 2.5,
          repetitions: 1,
          failed_count: 0,
          leech_flag: false,
        },
        topic: allTopics.find((t) => p.topic_ids.includes(t.id)),
      }));

      setDeck(cramItems);
      const topicName = allTopics.find((t) => t.id === topicId)?.name || 'All Topics';
      setSessionTitle(`Active Recall: ${topicName}`);
      setCurrentIndex(0);
      setCompletedSessions([]);
      setHint('');
      showToast(`Loaded ${cramItems.length} cards for ${topicName}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLeechDrill = async () => {
    setIsLoading(true);
    try {
      const leeches = await getLeeches();
      if (leeches.length === 0) {
        showToast('No quarantined leeches currently! Great job.');
        return;
      }
      setDeck(leeches);
      setSessionTitle('Quarantined Leech Active Recall Drill');
      setCurrentIndex(0);
      setCompletedSessions([]);
      setHint('');
      showToast(`Loaded ${leeches.length} quarantined leech cards`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentItem = deck[currentIndex];

  const handleRequestHint = async () => {
    if (!currentItem) return;
    setIsLoadingHint(true);
    try {
      const prompt = `Give me a 1-sentence conceptual hint or invariant for solving "${currentItem.problem.title}" in DSA. Do not reveal full code!`;
      const res = await askCoach(prompt, currentItem.topic?.id);
      setHint(res.text);
    } catch {
      setHint('Think about the problem constraints and whether Two Pointers, a Hash Map, or Binary Search applies.');
    } finally {
      setIsLoadingHint(false);
    }
  };

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
        time_taken: 5,
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

      setHint('');
      showToast(`Recorded: Next review in ${interval}d (Quality ${quality}/5)`);

      if (currentIndex + 1 < deck.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCurrentIndex(deck.length);
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving review attempt', 'danger');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="font-mono text-xs text-fg-faint animate-pulse flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent animate-spin" />
          <span>Calibrating memory flashcard deck...</span>
        </div>
      </div>
    );
  }

  // Summary State OR Zero Due Cards State
  if (currentIndex >= deck.length || deck.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-8 select-none">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/30 text-accent mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(255,107,91,0.2)]">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="font-display text-4xl text-fg font-normal">
            {completedSessions.length > 0 ? (
              <>
                Recall Session <em className="italic text-accent">Complete</em>
              </>
            ) : (
              <>
                Spaced Queue <em className="italic text-accent">All Clear!</em>
              </>
            )}
          </h1>
          <p className="font-mono text-xs text-fg-muted max-w-md mx-auto">
            {completedSessions.length > 0
              ? `You tested active recall on ${completedSessions.length} problems. SM-2 intervals and ease factors were dynamically recalibrated.`
              : 'You have zero overdue cards in your spaced repetition min-heap for today!'}
          </p>
        </div>

        {/* Free Recall / Topic Drill Options */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 text-accent">
              <Layers className="w-4 h-4" />
              <span className="font-ui text-sm font-semibold text-fg">
                On-Demand Active Recall Practice
              </span>
            </div>
            <span className="font-mono text-[10px] text-fg-faint uppercase font-bold">
              Free Study Mode
            </span>
          </div>

          <p className="font-mono text-xs text-fg-muted">
            Want to test your memory right now? Pick any topic or drill difficult leeches to strengthen retention before an interview:
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStartCramTopic()}
              className="px-3 py-1.5 rounded-xl bg-accent text-accent-ink font-bold font-mono text-xs hover:bg-accent-hover transition-colors"
            >
              Test All Problems ({allTopics.length} Topics)
            </button>
            <button
              onClick={handleStartLeechDrill}
              className="px-3 py-1.5 rounded-xl bg-danger/15 border border-danger/30 text-danger font-semibold font-mono text-xs hover:bg-danger/25 transition-colors flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Drill Quarantined Leeches
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="font-mono text-[11px] text-fg-faint">Or drill by specific topic:</span>
            <div className="flex flex-wrap gap-1.5">
              {allTopics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleStartCramTopic(t.id)}
                  className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border/80 hover:border-accent text-fg-muted hover:text-fg font-mono text-[11px] transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Completed Session Table */}
        {completedSessions.length > 0 && (
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-mono text-xs text-fg uppercase font-semibold">
                Updated Schedule Distribution
              </span>
              <span className="font-mono text-xs text-accent">SM-2 Calibrated</span>
            </div>

            <div className="divide-y divide-border/40">
              {completedSessions.map((s, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-mono">
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

        <div className="text-center pt-2">
          <Button variant="secondary" onClick={onExit} icon={<ArrowLeft className="w-4 h-4" />}>
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
          className="inline-flex items-center gap-1.5 text-xs font-mono text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Focus Mode</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-fg-faint">{sessionTitle}</span>
          <span className="font-mono text-xs text-accent font-semibold">
            {currentIndex + 1} of {deck.length}
          </span>
          <div className="w-24 sm:w-32 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Active 3D Flashcard */}
      <div className="py-2">
        <Flashcard
          problem={currentItem.problem}
          topic={currentItem.topic}
          revision={currentItem.revision}
          onRate={handleRate}
        />
      </div>

      {/* Gemini AI Clue Drawer / Button */}
      <div className="max-w-xl mx-auto space-y-2">
        {!hint ? (
          <div className="flex justify-center">
            <button
              onClick={handleRequestHint}
              disabled={isLoadingHint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2/80 border border-border hover:border-accent text-fg-muted hover:text-accent font-mono text-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{isLoadingHint ? 'Generating clue...' : 'Need a hint before flipping? Ask Gemini Coach'}</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-surface border border-accent/30 space-y-1 font-mono text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[10px] text-accent uppercase font-bold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gemini Conceptual Hint
              </span>
              <button
                onClick={() => setHint('')}
                className="text-fg-faint hover:text-fg text-[10px]"
              >
                Hide
              </button>
            </div>
            <p className="text-fg leading-relaxed">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
};
