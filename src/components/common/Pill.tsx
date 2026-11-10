import type { FC, ReactNode } from 'react';

export type PillVariant =
  | 'due'
  | 'done'
  | 'solved'
  | 'neutral'
  | 'draft'
  | 'failed'
  | 'leech'
  | 'new';

interface PillProps {
  children: ReactNode;
  variant?: PillVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Pill: FC<PillProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const base =
    'inline-flex items-center gap-1.5 font-mono rounded-pill select-none transition-colors';

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 leading-tight',
    md: 'text-xs px-3 py-1 leading-normal',
  };

  const variantStyles: Record<PillVariant, { pill: string; dotColor?: string }> = {
    due: {
      pill: 'border border-accent text-accent bg-accent/5',
      dotColor: 'bg-accent',
    },
    done: {
      pill: 'bg-accent text-accent-ink font-semibold',
      dotColor: 'bg-accent-ink',
    },
    solved: {
      pill: 'bg-accent text-accent-ink font-semibold',
      dotColor: 'bg-accent-ink',
    },
    neutral: {
      pill: 'bg-surface-2 text-fg-muted border border-border',
      dotColor: 'bg-fg-muted',
    },
    draft: {
      pill: 'bg-surface-2 text-fg-muted border border-border',
      dotColor: 'bg-fg-faint',
    },
    failed: {
      pill: 'bg-danger/10 text-danger border border-danger/30',
      dotColor: 'bg-danger',
    },
    leech: {
      pill: 'bg-danger/15 text-danger border border-danger/40 font-medium',
      dotColor: 'bg-danger animate-pulse',
    },
    new: {
      pill: 'border border-accent/60 text-accent bg-accent/10',
      dotColor: 'bg-accent',
    },
  };

  const style = variantStyles[variant] || variantStyles.neutral;

  return (
    <span className={`${base} ${sizeStyles[size]} ${style.pill} ${className}`}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotColor || 'bg-current'}`}
        />
      )}
      {children}
    </span>
  );
};
