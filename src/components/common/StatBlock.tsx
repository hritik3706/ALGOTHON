import type { FC } from 'react';

interface StatBlockProps {
  value: string | number;
  label: string;
  suffix?: string;
  trend?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export const StatBlock: FC<StatBlockProps> = ({
  value,
  label,
  suffix,
  trend,
  align = 'left',
  className = '',
}) => {
  const alignClass = {
    left: 'text-left items-start',
    right: 'text-right items-end',
    center: 'text-center items-center',
  }[align];

  return (
    <div className={`flex flex-col select-none ${alignClass} ${className}`}>
      <div className="font-display text-4xl sm:text-5xl text-fg leading-none font-normal tracking-tight flex items-baseline gap-1">
        <span>{value}</span>
        {suffix && (
          <span className="text-accent text-3xl font-display">{suffix}</span>
        )}
      </div>
      <div className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-fg-faint mt-1.5 leading-snug">
        {label}
      </div>
      {trend && (
        <span className="font-mono text-[10px] text-accent mt-0.5">
          {trend}
        </span>
      )}
    </div>
  );
};
