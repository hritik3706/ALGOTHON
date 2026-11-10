export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  badge?: string;
  color?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-sm',
  }[size];

  const itemPadding = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
  }[size];

  return (
    <div
      role="radiogroup"
      className={`inline-flex items-center rounded-pill bg-surface-2 border border-border ${sizeClasses} ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={`font-ui font-medium rounded-pill transition-all duration-150 select-none flex items-center gap-1.5 ${itemPadding} ${
              isSelected
                ? 'bg-accent text-accent-ink shadow-sm font-semibold'
                : 'text-fg-muted hover:text-fg hover:bg-white/[0.04]'
            }`}
          >
            <span>{opt.label}</span>
            {opt.badge && (
              <span
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-accent-ink/20 text-accent-ink'
                    : 'bg-surface text-fg-faint'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
