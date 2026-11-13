import type { FC } from 'react';

interface LogoMarkProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

export const LogoMark: FC<LogoMarkProps> = ({
  size = 28,
  className = '',
  showWordmark = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* 28px rounded square in #C6F432 with 3-node DAG SVG */}
      <div
        className="rounded-[7px] bg-accent flex items-center justify-center shrink-0 shadow-sm"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 28 28"
          width={size * 0.75}
          height={size * 0.75}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DAG: One parent at top (14, 7), two children at (7, 20) and (21, 20) */}
          <line x1="14" y1="7" x2="7" y2="20" stroke="#0B1326" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="14" y1="7" x2="21" y2="20" stroke="#0B1326" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="14" cy="7" r="3.2" fill="#0B1326" />
          <circle cx="7" cy="20" r="3" fill="#0B1326" />
          <circle cx="21" cy="20" r="3" fill="#0B1326" />
        </svg>
      </div>

      {showWordmark && (
        <span className="font-display text-[22px] font-normal tracking-tight text-fg leading-none flex items-center gap-1.5">
          Algothon
        </span>
      )}
    </div>
  );
};
