import type { FC, ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  children,
  className = '',
}) => {
  return (
    <div
      className={`p-10 rounded-card border border-border border-dashed bg-surface/40 flex flex-col items-center justify-center text-center space-y-4 ${className}`}
    >
      {icon ? (
        <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center text-fg-muted">
          {icon}
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
      )}

      <div className="space-y-1 max-w-sm">
        <h4 className="font-ui text-base font-semibold text-fg">{title}</h4>
        <p className="font-mono text-xs text-fg-muted leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}

      {children}
    </div>
  );
};
