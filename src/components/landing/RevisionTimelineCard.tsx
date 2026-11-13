import type { FC } from 'react';
import { Card } from '../common/Card';

export interface RevisionTimelineItem {
  problemTitle: string;
  topicName?: string;
  isDue: boolean;
  daysUntilDue: number;
  intervalDays: number;
}

interface RevisionTimelineCardProps {
  items?: RevisionTimelineItem[];
  onItemClick?: () => void;
}

export const RevisionTimelineCard: FC<RevisionTimelineCardProps> = ({
  items = [],
  onItemClick,
}) => {
  const days = [-2, -1, 0, 1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: offset === 0,
    };
  });

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
          {days.map((d) => (
            <span key={d.label} className={d.isToday ? 'text-accent font-bold' : ''}>
              {d.label}
            </span>
          ))}
        </div>

        {/* Vertical NOW marker at today (index 2 / 50%) */}
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
        {items.length === 0 ? (
          <div className="py-7 text-center space-y-1">
            <p className="font-mono text-xs text-fg-muted">No revisions scheduled</p>
            <p className="font-mono text-[10px] text-fg-faint">Log solved problems to schedule SM-2 intervals</p>
          </div>
        ) : (
          <div className="space-y-3 relative z-10">
            {items.slice(0, 4).map((item, idx) => {
              let left = '35%';
              let width = '30%';
              let barClass = 'bg-accent shadow-[0_0_12px_rgba(198,244,50,0.5)]';
              let badgeText = 'Due Now';
              let badgeClass = 'text-accent font-semibold';

              if (item.isDue || item.daysUntilDue === 0) {
                left = '35%';
                width = '30%';
                barClass = 'bg-accent shadow-[0_0_12px_rgba(198,244,50,0.5)]';
                badgeText = 'Due Now';
                badgeClass = 'text-accent font-semibold';
              } else if (item.daysUntilDue < 0) {
                left = '12%';
                width = '28%';
                barClass = 'bg-danger/80 border border-danger/40';
                badgeText = `${Math.abs(item.daysUntilDue)}d Overdue`;
                badgeClass = 'text-danger';
              } else if (item.daysUntilDue === 1) {
                left = '55%';
                width = '28%';
                barClass = 'bg-white/30 border border-white/10';
                badgeText = '+1 day';
                badgeClass = 'text-fg-faint';
              } else {
                left = '70%';
                width = '24%';
                barClass = 'bg-white/15 border border-white/10';
                badgeText = `+${item.daysUntilDue} days`;
                badgeClass = 'text-fg-faint';
              }

              return (
                <div
                  key={idx}
                  onClick={onItemClick}
                  className="space-y-1 cursor-pointer group"
                >
                  <div className="flex justify-between font-mono text-[10px] text-fg-muted">
                    <span className="truncate pr-2 group-hover:text-accent transition-colors">
                      {item.problemTitle}
                    </span>
                    <span className={badgeClass}>{badgeText}</span>
                  </div>
                  <div className="h-4 w-full bg-surface-2 rounded-md overflow-hidden relative">
                    <div
                      className={`absolute top-0 bottom-0 rounded-md transition-all ${barClass}`}
                      style={{ left, width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

