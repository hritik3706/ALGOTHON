import type { FC, ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
}

export const FormField: FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required = false,
  children,
  className = '',
  id,
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="font-ui text-xs font-medium text-fg-muted uppercase tracking-wider flex items-center gap-1 select-none"
        >
          {label}
          {required && <span className="text-accent">*</span>}
        </label>
        {hint && (
          <span className="font-mono text-[11px] text-fg-faint">{hint}</span>
        )}
      </div>

      <div>{children}</div>

      {error && (
        <span className="font-mono text-xs text-danger flex items-center gap-1 mt-0.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};
