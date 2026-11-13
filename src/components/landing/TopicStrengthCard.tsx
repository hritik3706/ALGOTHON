import type { FC } from 'react';
import { Card } from '../common/Card';
import { Pill } from '../common/Pill';

interface TopicStrengthCardProps {
  score?: number;
  label?: string;
  isUnlocked?: boolean;
  points?: number[];
}

export const TopicStrengthCard: FC<TopicStrengthCardProps> = ({
  score = 0,
  label = 'Awaiting Data',
  isUnlocked = false,
  points = [0, 0, 0, 0, 0, 0, 0],
}) => {
  // 7-point line chart data (0-100 scale over last 7 days)
  const chartPoints = points.length === 7 ? points : [0, 0, 0, 0, 0, 0, score];
  const width = 280;
  const height = 90;
  const paddingX = 15;
  const paddingY = 15;

  const dx = (width - paddingX * 2) / (chartPoints.length - 1);
  const minVal = 0;
  const maxVal = 100;

  const coordinates = chartPoints.map((rawVal, i) => {
    const val = Math.max(minVal, Math.min(maxVal, rawVal));
    const x = paddingX + i * dx;
    const y = height - paddingY - (val / (maxVal - minVal)) * (height - paddingY * 2);
    return { x, y, val };
  });

  const pathD = coordinates.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const areaD = `${pathD} L ${coordinates[coordinates.length - 1].x} ${height} L ${coordinates[0].x} ${height} Z`;

  return (
    <Card className="card-center-elevated p-6 bg-surface/95 border-border shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),0_0_40px_-5px_rgba(198,244,50,0.18)] relative select-none z-10">
      {/* Header matching reference */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-xs text-fg-muted font-medium">Topic strength</span>
        </div>
        <Pill variant={isUnlocked ? 'due' : score > 0 ? 'failed' : 'neutral'} size="sm" dot>
          {isUnlocked ? 'Unlocked' : score > 0 ? 'Locked' : 'Awaiting Data'}
        </Pill>
      </div>

      {/* Score */}
      <div className="my-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl sm:text-6xl text-fg font-normal leading-none tracking-tight">
            {score}
          </span>
          <span className="font-display text-lg text-fg-faint">
            / 100 <span className="font-mono text-[11px] text-fg-muted ml-1">Wilson health</span>
          </span>
        </div>
        <div className="font-mono text-[11px] text-fg-faint mt-1">
          Top performer: <span className="text-fg-muted font-medium">{label}</span>
        </div>
      </div>

      {/* 7-Point Lime Line Chart */}
      <div className="mt-4 pt-2 relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-24 overflow-visible"
        >
          <defs>
            <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C6F432" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#C6F432" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#C6F432" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Shaded Area */}
          <path d={areaD} fill="url(#limeGradient)" />

          {/* Glowing Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#C6F432"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Data Points */}
          {coordinates.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={i === coordinates.length - 1 ? 4.5 : 2.5}
                fill={i === coordinates.length - 1 ? '#C6F432' : '#0B0B0C'}
                stroke="#C6F432"
                strokeWidth={i === coordinates.length - 1 ? 2.5 : 1.5}
              />
            </g>
          ))}
        </svg>

        {/* Axis days */}
        <div className="flex justify-between font-mono text-[9px] text-fg-faint mt-1 px-1">
          <span>7d ago</span>
          <span>4d ago</span>
          <span className="text-accent font-semibold">Today</span>
        </div>
      </div>
    </Card>
  );
};

