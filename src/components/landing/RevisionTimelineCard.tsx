import type { FC } from 'react';
import { Card } from '../common/Card';

export const RevisionTimelineCard: FC = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <Card className="card-tilt-right p-5 bg-surface/95 border-border/80 shadow-2xl relative select-none">
      {/* Header matching reference */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-xs text-fg-muted font-medium">Revision timeline</span>
        </div>
        <span className="font-mono text-[11px] text-accent">SM-2 Scheduled</span>
      </div>

      {/* Gantt Timeline View */}
      <div className="relative pt-1 pb-2">
        {/* Horizontal Day Headers */}
        <div className="grid grid-cols-5 font-mono text-[10px] text-fg-faint text-center mb-3 border-b border-border/30 pb-1.5">
          {days.map((d, i) => (
            <span key={d} className={i === 2 ? 'text-accent font-bold' : ''}>
              {d}
            </span>
          ))}
        </div>

        {/* Vertical NOW marker at Wednesday (today) */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
          style={{ left: '50%' }}
        >
          <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_#C6F432]" />
          <div className="w-[1.5px] h-full bg-accent shadow-[0_0_6px_#C6F432]" />
          <span className="font-mono text-[8px] uppercase tracking-tighter text-accent bg-bg/90 px-1 py-0.2 rounded border border-accent/40 mt-0.5">
            now
          </span>
        </div>

        {/* Schedule Bars */}
        <div className="space-y-3 relative z-10">
          {/* Row 1: Two Sum (Due Today - Lime) */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-fg-muted">
              <span>Two Sum</span>
              <span className="text-accent">Due Now</span>
            </div>
            <div className="h-4 w-full bg-surface-2 rounded-md overflow-hidden relative">
              <div
                className="absolute top-0 bottom-0 rounded-md bg-accent shadow-[0_0_12px_rgba(198,244,50,0.5)]"
                style={{ left: '32%', width: '38%' }}
              />
            </div>
          </div>

          {/* Row 2: Invert Binary Tree (Due +2d - Grey) */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-fg-muted">
              <span>Invert Tree</span>
              <span className="text-fg-faint">+2 days</span>
            </div>
            <div className="h-4 w-full bg-surface-2 rounded-md overflow-hidden relative">
              <div
                className="absolute top-0 bottom-0 rounded-md bg-white/20 border border-white/10"
                style={{ left: '60%', width: '35%' }}
              />
            </div>
          </div>

          {/* Row 3: 3Sum (Upcoming tomorrow) */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-fg-muted">
              <span>3Sum</span>
              <span className="text-fg-faint">+1 day</span>
            </div>
            <div className="h-4 w-full bg-surface-2 rounded-md overflow-hidden relative">
              <div
                className="absolute top-0 bottom-0 rounded-md bg-white/30 border border-white/10"
                style={{ left: '45%', width: '30%' }}
              />
            </div>
          </div>

          {/* Row 4: Coin Change (Upcoming) */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-fg-muted">
              <span>Coin Change</span>
              <span className="text-fg-faint">+3 days</span>
            </div>
            <div className="h-4 w-full bg-surface-2 rounded-md overflow-hidden relative">
              <div
                className="absolute top-0 bottom-0 rounded-md bg-white/20 border border-white/10"
                style={{ left: '72%', width: '25%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

