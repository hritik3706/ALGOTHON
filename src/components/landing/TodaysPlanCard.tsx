import type { FC } from 'react';
import { Card } from '../common/Card';
import { Pill } from '../common/Pill';
import { PlanItem } from '../../types';

interface TodaysPlanCardProps {
  planItems: PlanItem[];
  onItemClick?: (item: PlanItem) => void;
}

export const TodaysPlanCard: FC<TodaysPlanCardProps> = ({
  planItems,
  onItemClick,
}) => {
  // Use first 3-4 items for card display
  const displayItems = planItems.slice(0, 4);
  const distinctTopicCount = new Set(planItems.map((i) => i.topic.id)).size;

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return <span className="w-5 h-5 rounded-md bg-accent/20 text-accent font-mono text-[10px] font-bold flex items-center justify-center shrink-0">E</span>;
      case 'hard':
        return <span className="w-5 h-5 rounded-md bg-danger/20 text-danger font-mono text-[10px] font-bold flex items-center justify-center shrink-0">H</span>;
      default:
        return <span className="w-5 h-5 rounded-md bg-surface-2 text-fg-muted border border-border font-mono text-[10px] font-bold flex items-center justify-center shrink-0">M</span>;
    }
  };

  const getStatusPill = (type: PlanItem['type']) => {
    switch (type) {
      case 'due':
        return <Pill variant="due" size="sm" dot>Due</Pill>;
      case 'relearn':
        return <Pill variant="leech" size="sm" dot>Relearn</Pill>;
      case 'new':
        return <Pill variant="new" size="sm">New</Pill>;
    }
  };

  return (
    <Card className="card-tilt-left p-5 bg-surface/95 border-border/80 shadow-2xl relative select-none">
      {/* Header matching reference card */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-xs text-fg-muted font-medium">Today's plan</span>
        </div>
        <span className="font-mono text-[11px] text-fg-faint">
          {distinctTopicCount > 0
            ? `Interleaved (${distinctTopicCount} topic${distinctTopicCount > 1 ? 's' : ''})`
            : '0 topics'}
        </span>
      </div>

      {/* Rows */}
      <div className="space-y-2.5">
        {displayItems.length === 0 ? (
          <div className="py-7 text-center space-y-1">
            <p className="font-mono text-xs text-fg-muted">Queue is clear</p>
            <p className="font-mono text-[10px] text-fg-faint">No problems pending for today</p>
          </div>
        ) : (
          displayItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick && onItemClick(item)}
              className="flex items-center justify-between p-2 rounded-xl bg-surface-2/40 border border-border/40 hover:bg-surface-2/80 hover:border-white/10 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {getDifficultyBadge(item.problem.difficulty)}
                <div className="min-w-0">
                  <div className="font-ui text-xs font-medium text-fg truncate group-hover:text-accent transition-colors">
                    {item.problem.title}
                  </div>
                  <div className="font-mono text-[10px] text-fg-faint truncate">
                    {item.topic.name}
                  </div>
                </div>
              </div>
              <div className="shrink-0">{getStatusPill(item.type)}</div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

