import { FC, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface TimerProps {
  onTimeChange?: (minutes: number) => void;
  className?: string;
}

export const Timer: FC<TimerProps> = ({ onTimeChange, className = '' }) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          onTimeChange?.(Math.max(1, Math.round(next / 60)));
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onTimeChange]);

  const toggleRun = () => setIsRunning(!isRunning);
  const reset = () => {
    setIsRunning(false);
    setSeconds(0);
    onTimeChange?.(1);
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-border font-mono text-xs ${className}`}>
      <Clock className={`w-3.5 h-3.5 ${isRunning ? 'text-accent animate-pulse' : 'text-fg-faint'}`} />
      <span className="text-fg font-semibold w-12 text-center">{formatted}</span>
      <button
        type="button"
        onClick={toggleRun}
        className="p-1 rounded hover:bg-surface text-fg-muted hover:text-accent transition-colors"
        title={isRunning ? 'Pause Timer' : 'Start Timer'}
      >
        {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        onClick={reset}
        className="p-1 rounded hover:bg-surface text-fg-muted hover:text-fg transition-colors"
        title="Reset Timer"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
};
