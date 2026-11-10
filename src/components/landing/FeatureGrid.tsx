import type { FC } from 'react';
import { Card } from '../common/Card';
import { Pill } from '../common/Pill';

export const FeatureGrid: FC = () => {
  const features = [
    {
      num: '01',
      title: 'Fast Problem Logging',
      description:
        'Log problems and attempts in under 20 seconds with keyboard-driven mistake tags and status controls.',
      preview: (
        <div className="p-3 rounded-xl bg-surface-2/60 border border-border/50 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-fg-muted">
            <span>Two Sum (LeetCode #1)</span>
            <span className="text-accent font-semibold">12 min</span>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded-full bg-accent text-accent-ink font-mono text-[10px] font-bold">Solved</span>
            <span className="px-2 py-0.5 rounded-full bg-surface text-fg-muted border border-border font-mono text-[10px]">Tag 1: Clean</span>
          </div>
        </div>
      ),
    },
    {
      num: '02',
      title: 'Prerequisite DAG Unlocks',
      description:
        'Harder topics stay locked until every prerequisite satisfies minimum 5 attempts and 60% success rate.',
      preview: (
        <div className="p-3 rounded-xl bg-surface-2/60 border border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
            <div>
              <div className="text-xs font-ui font-medium text-fg">Graphs</div>
              <div className="text-[10px] font-mono text-danger">Needs: Trees (3/5 attempts)</div>
            </div>
          </div>
          <Pill variant="failed" size="sm">Locked</Pill>
        </div>
      ),
    },
    {
      num: '03',
      title: 'SM-2 Spaced Revision',
      description:
        'Resurface failed problems at calibrated intervals with automatic ease factor decay and leech defense.',
      preview: (
        <div className="p-3 rounded-xl bg-surface-2/60 border border-border/50 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-fg-muted">
            <span>Word Break</span>
            <span className="text-danger">Leech (3 fails)</span>
          </div>
          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-danger w-4/5" />
          </div>
          <div className="text-[10px] font-mono text-fg-faint">EF: 1.4 • Interval: 1 day</div>
        </div>
      ),
    },
    {
      num: '04',
      title: 'Interleaved Today’s Plan',
      description:
        'Mixes due revisions and weak topics using Wilson lower-bound confidence intervals with topic interleaving.',
      preview: (
        <div className="p-3 rounded-xl bg-surface-2/60 border border-border/50 space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono text-fg">
            <span className="truncate">1. Two Sum (Due)</span>
            <span className="text-accent text-[11px]">Arrays</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono text-fg">
            <span className="truncate">2. Subsets (New)</span>
            <span className="text-accent text-[11px]">Backtracking</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="py-20 border-t border-border/50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <span className="font-mono text-xs uppercase tracking-widest text-accent">
          Built on Real Algorithms
        </span>
        <h2 className="font-display text-4xl sm:text-5xl text-fg font-normal tracking-tight">
          Every feature maps to <em className="italic text-accent">concrete data structures.</em>
        </h2>
        <p className="font-mono text-sm text-fg-muted">
          No bolted-on fluff. Min-heap due queues, DAG topological ordering, and Wilson score weakness ranking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <Card key={f.num} className="p-6 bg-surface/80 hover:bg-surface-2/80 transition-colors flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="font-mono text-xs text-accent font-bold">
                {f.num}
              </span>
              <h3 className="font-ui text-base font-semibold text-fg">
                {f.title}
              </h3>
              <p className="font-ui text-xs text-fg-muted leading-relaxed">
                {f.description}
              </p>
            </div>
            {f.preview}
          </Card>
        ))}
      </div>
    </section>
  );
};

