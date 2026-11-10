import type { FC, ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: 'surface' | 'surface-2' | 'glow';
  interactive?: boolean;
}

export const Card: FC<CardProps> = ({
  children,
  className = '',
  variant = 'surface',
  interactive = false,
  ...props
}) => {
  const base =
    'rounded-card border border-border transition-all duration-200 overflow-hidden';

  const variantStyles = {
    surface: 'bg-surface',
    'surface-2': 'bg-surface-2',
    glow: 'bg-surface shadow-[0_0_35px_-8px_rgba(198,244,50,0.22)] border-accent/20',
  };

  const interactiveStyles = interactive
    ? 'hover:border-white/20 hover:bg-surface-2/80 cursor-pointer'
    : '';

  return (
    <div
      className={`${base} ${variantStyles[variant]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
