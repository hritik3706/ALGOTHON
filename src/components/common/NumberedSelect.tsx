import React, { useEffect, useRef, useState } from 'react';
import { MistakeTag } from '../../types';

export interface NumberedOption {
  num: number;
  value: MistakeTag;
  label: string;
  description: string;
}

export const MISTAKE_OPTIONS: NumberedOption[] = [
  { num: 1, value: 'none', label: 'None / Clean', description: 'Clean execution without conceptual flaws' },
  { num: 2, value: 'off_by_one', label: 'Off-by-one', description: 'Index boundaries, loop termination, fencepost error' },
  { num: 3, value: 'edge_case', label: 'Edge case', description: 'Empty input, null pointers, negatives, single element' },
  { num: 4, value: 'complexity', label: 'Complexity', description: 'Suboptimal Big-O, wrong data structure overhead' },
  { num: 5, value: 'tle', label: 'Time Limit (TLE)', description: 'Infinite loop, missing memoization, unpruned recursion' },
  { num: 6, value: 'logic', label: 'Logic / Invariant', description: 'Wrong algorithm premise, violated loop invariant' },
  { num: 7, value: 'syntax', label: 'Syntax / Language API', description: 'Standard library method confusion, typing error' },
];

interface NumberedSelectProps {
  value: MistakeTag;
  onChange: (value: MistakeTag) => void;
  className?: string;
}

export const NumberedSelect: React.FC<NumberedSelectProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = MISTAKE_OPTIONS.find((o) => o.value === value) || MISTAKE_OPTIONS[0];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: when dropdown is open, typing 1-7 picks directly
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 7) {
        const match = MISTAKE_OPTIONS.find((o) => o.num === num);
        if (match) {
          onChange(match.value);
          setIsOpen(false);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onChange]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-card bg-surface-2 border border-border hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent text-left transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs w-5 h-5 rounded-md bg-accent/15 text-accent flex items-center justify-center font-bold">
            {selected.num}
          </span>
          <span className="font-ui text-sm text-fg font-medium">
            {selected.label}
          </span>
          <span className="hidden sm:inline font-mono text-[11px] text-fg-faint truncate max-w-xs">
            — {selected.description}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-fg-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Options Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-2 p-1.5 rounded-card bg-surface-2 border border-border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto"
        >
          <div className="px-3 py-1.5 font-mono text-[10px] text-fg-faint uppercase tracking-wider flex justify-between border-b border-border/50 mb-1">
            <span>Press number 1-7 to select</span>
            <span>Enum Value</span>
          </div>
          {MISTAKE_OPTIONS.map((opt) => {
            const isCurrent = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  isCurrent
                    ? 'bg-accent/15 text-accent font-medium'
                    : 'text-fg-muted hover:text-fg hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-mono text-xs w-5 h-5 rounded flex items-center justify-center font-bold ${
                      isCurrent
                        ? 'bg-accent text-accent-ink'
                        : 'bg-surface text-fg-faint border border-border'
                    }`}
                  >
                    {opt.num}
                  </span>
                  <div>
                    <div className="font-ui text-sm font-medium text-fg">
                      {opt.label}
                    </div>
                    <div className="font-mono text-[11px] text-fg-faint">
                      {opt.description}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-fg-faint">
                  {opt.value}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

