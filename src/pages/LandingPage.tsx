import { FC, useEffect, useState } from 'react';
import { LandingNav } from '../components/landing/LandingNav';
import { StatBlock } from '../components/common/StatBlock';
import { Button } from '../components/common/Button';
import { TodaysPlanCard } from '../components/landing/TodaysPlanCard';
import { TopicStrengthCard } from '../components/landing/TopicStrengthCard';
import { RevisionTimelineCard } from '../components/landing/RevisionTimelineCard';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { getPlan, getInsights, PlanItem, InsightSummary } from '../api';

interface LandingPageProps {
  onNavigateToApp: (screen?: string) => void;
}

export const LandingPage: FC<LandingPageProps> = ({ onNavigateToApp }) => {
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [insights, setInsights] = useState<InsightSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getPlan(), getInsights()]).then(([p, ins]) => {
      if (mounted) {
        setPlan(p);
        setInsights(ins);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const totalProblems = insights?.total_problems ?? 32;
  const topicsUnlocked = insights?.topics_unlocked ?? 8;
  const streak = insights?.streak ?? 5;
  const dueToday = insights?.revisions_due_today ?? 2;

  return (
    <div className="min-h-screen bg-bg text-fg relative overflow-hidden flex flex-col justify-between selection:bg-accent selection:text-accent-ink">
      {/* Top Nav */}
      <LandingNav onNavigateToApp={onNavigateToApp} />

      {/* Main Hero Container */}
      <main className="relative pt-8 sm:pt-14 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Luminous Vertical Lime Glow Beam behind headline */}
        <div className="hero-glow-beam" />

        {/* Hero Content Area with Flanking Stats */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Main Grid: Flanking Left Stats - Center Headline & CTAs - Flanking Right Stats */}
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Flanking Stats (Desktop) */}
            <div className="hidden md:flex md:col-span-3 flex-col items-start space-y-10 pl-2">
              <StatBlock
                value={totalProblems}
                label="Problems Logged"
                align="left"
              />
              <StatBlock
                value={topicsUnlocked}
                label="Topics Unlocked"
                align="left"
              />
            </div>

            {/* Center Hero Column */}
            <div className="col-span-1 md:col-span-6 flex flex-col items-center space-y-6">
              {/* Headline matching reference typography */}
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-normal text-fg leading-[1.02] tracking-tight">
                Practice <em className="italic text-accent font-normal">smarter</em> than{' '}
                <em className="italic text-fg font-normal">your streak.</em>
              </h1>

              {/* Subline matching reference mono style */}
              <p className="font-mono text-xs sm:text-sm text-fg-muted max-w-md mx-auto leading-relaxed">
                Log every problem. Find weak topics. Revise at the right time, before you forget.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => onNavigateToApp('log')}
                  className="font-semibold px-6 shadow-glow"
                >
                  Start tracking
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => onNavigateToApp('today')}
                  className="px-6"
                >
                  See today's plan
                </Button>
              </div>
            </div>

            {/* Right Flanking Stats (Desktop) */}
            <div className="hidden md:flex md:col-span-3 flex-col items-end space-y-10 pr-2">
              <StatBlock
                value={streak}
                suffix="d"
                label="Day Streak"
                align="right"
              />
              <StatBlock
                value={dueToday}
                label="Due Today"
                align="right"
              />
            </div>
          </div>

          {/* Mobile Flanking Stats (2x2 Grid below CTAs at 375px - 768px) */}
          <div className="grid md:hidden grid-cols-2 gap-6 w-full max-w-sm mt-10 pt-6 border-t border-border/40">
            <StatBlock
              value={totalProblems}
              label="Problems Logged"
              align="center"
            />
            <StatBlock
              value={topicsUnlocked}
              label="Topics Unlocked"
              align="center"
            />
            <StatBlock
              value={streak}
              suffix="d"
              label="Day Streak"
              align="center"
            />
            <StatBlock
              value={dueToday}
              label="Due Today"
              align="center"
            />
          </div>
        </div>

        {/* Tilted Cards Section over Soft Radial Aura */}
        <div className="relative mt-14 sm:mt-20 pt-6">
          {/* Radial aura underneath cards */}
          <div className="cards-glow-aura" />

          {/* Three Cards Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 items-center max-w-6xl mx-auto relative z-10 px-2">
            {/* Left Card: Today's Plan (Tilted -4deg) */}
            <div className="w-full max-w-md mx-auto lg:max-w-none">
              <TodaysPlanCard
                planItems={plan}
                onItemClick={() => onNavigateToApp('today')}
              />
            </div>

            {/* Center Card: Topic Strength (Elevated Flat with 7-point line chart) */}
            <div className="w-full max-w-md mx-auto lg:max-w-none">
              <TopicStrengthCard score={94} label="Arrays & Hashing" />
            </div>

            {/* Right Card: Revision Timeline (Tilted +4deg with vertical NOW marker) */}
            <div className="w-full max-w-md mx-auto lg:max-w-none">
              <RevisionTimelineCard />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <FeatureGrid />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border/40 py-8 text-center select-none bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-fg-faint">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>Algothon. Built for interview prep.</span>
          </div>
          <div>No scraping • Local-first storage • Zero telemetry</div>
        </div>
      </footer>
    </div>
  );
};

