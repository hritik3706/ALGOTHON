import { FC, useState, useEffect } from 'react';
import { Problem, Revision, Topic } from '../../types';
import { RotateCw, Check, ExternalLink } from 'lucide-react';

export interface FlashcardProps {
  problem: Problem;
  topic?: Topic;
  revision?: Revision;
  notes?: string;
  onRate?: (quality: number) => void;
  onFlipChange?: (flipped: boolean) => void;
}

export const Flashcard: FC<FlashcardProps> = ({
  problem,
  topic,
  revision,
  notes,
  onRate,
  onFlipChange,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => {
    const next = !isFlipped;
    setIsFlipped(next);
    onFlipChange?.(next);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space flips card if not typing in input
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleFlip();
      }
      // If flipped, 0-5 triggers rating
      if (isFlipped && onRate) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 0 && num <= 5) {
          e.preventDefault();
          onRate(num);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, onRate]);

  const diffBadge = (
    <span
      className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
        problem.difficulty === 'easy'
          ? 'bg-emerald-500/15 text-emerald-700'
          : problem.difficulty === 'medium'
          ? 'bg-amber-500/15 text-amber-800'
          : 'bg-rose-500/15 text-rose-800'
      }`}
    >
      {problem.difficulty}
    </span>
  );

  return (
    <div className="w-full max-w-xl mx-auto perspective-1000 select-none">
      <div
        className={`relative w-full min-h-[380px] sm:min-h-[420px] transition-transform duration-700 preserve-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={toggleFlip}
        role="region"
        aria-label="Flashcard: Click or press Space to flip"
        tabIndex={0}
      >
        {/* FRONT FACE (Cream Paper) */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-card bg-[#F4EDE0] text-[#14213D] p-6 sm:p-8 flex flex-col justify-between shadow-flashcard border border-[#E0BFBA]/60 paper-lines">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#14213D]/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#14213D]/70">
                {problem.platform} • {topic?.name || 'DSA'}
              </span>
            </div>
            {diffBadge}
          </div>

          {/* Card Body / Question */}
          <div className="my-auto py-6 space-y-3 text-center">
            <span className="font-mono text-[11px] text-[#14213D]/60 uppercase tracking-widest">
              Flashcard Prompt
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[#14213D] font-normal leading-tight">
              {problem.title}
            </h2>
            <p className="font-ui text-sm text-[#14213D]/70 max-w-md mx-auto">
              Recall optimal data structure, time & space complexities, and key pattern before flipping.
            </p>
            {problem.link && (
              <div className="pt-2">
                <a
                  href={problem.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-accent hover:underline"
                >
                  <span>Open problem</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Footer Call to Action */}
          <div className="flex items-center justify-between pt-3 border-t border-[#14213D]/10 text-xs font-mono text-[#14213D]/60">
            <div className="flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-accent animate-spin-slow" />
              <span>Click or Space to flip</span>
            </div>
            {revision && (
              <span>Interval: {revision.interval_days}d • Reps: {revision.repetitions}</span>
            )}
          </div>
        </div>

        {/* BACK FACE (Navy Night Solution / Rating Face) */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-card bg-[#171F33] text-[#F4EDE0] p-6 sm:p-8 flex flex-col justify-between shadow-flashcard border border-border">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-accent">
              <Check className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                Solution & Recall Evaluation
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFlip();
              }}
              className="text-xs font-mono text-fg-muted hover:text-fg flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" /> Flip back
            </button>
          </div>

          {/* Back Content */}
          <div className="my-auto py-4 space-y-4">
            <div className="space-y-1">
              <div className="font-display text-2xl text-fg">{problem.title}</div>
              <div className="font-mono text-xs text-fg-faint">Topic: {topic?.name || 'DSA'}</div>
            </div>

            {/* Notes box */}
            <div className="p-4 rounded-xl bg-surface-2 border border-border/80 text-xs font-mono text-fg-muted space-y-1.5">
              <div className="text-[10px] text-accent uppercase font-bold tracking-wider">
                Study Notes & Pattern Insight:
              </div>
              <p className="leading-relaxed">
                {notes || 'No user notes logged yet. Focus on boundary conditions and time complexity during revision.'}
              </p>
            </div>
          </div>

          {/* SuperMemo-2 Quality Rating Buttons (0 to 5) */}
          <div
            className="pt-3 border-t border-border space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center text-xs font-mono text-fg-faint">
              <span>Rate your recall quality:</span>
              <span className="text-[10px]">Keys: 0 to 5</span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {[
                { score: 0, label: '0: Blackout', color: 'hover:bg-rose-500/20 hover:text-rose-400' },
                { score: 1, label: '1: Failed', color: 'hover:bg-rose-500/20 hover:text-rose-400' },
                { score: 2, label: '2: Hard', color: 'hover:bg-amber-500/20 hover:text-amber-400' },
                { score: 3, label: '3: Hesitant', color: 'hover:bg-amber-500/20 hover:text-amber-400' },
                { score: 4, label: '4: Good', color: 'hover:bg-emerald-500/20 hover:text-emerald-400' },
                { score: 5, label: '5: Perfect', color: 'hover:bg-accent/25 hover:text-accent font-bold' },
              ].map((btn) => (
                <button
                  key={btn.score}
                  disabled={!isFlipped}
                  onClick={() => onRate?.(btn.score)}
                  className={`py-2 px-1 rounded-lg bg-surface-2 text-[10px] sm:text-xs font-mono border border-border transition-all ${btn.color} disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {btn.score}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
