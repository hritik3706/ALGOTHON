import { FC, useEffect, useState, useCallback } from 'react';
import { Button } from '../components/common/Button';
import { StatBlock } from '../components/common/StatBlock';
import { LandingNav } from '../components/landing/LandingNav';
import { TodaysPlanCard } from '../components/landing/TodaysPlanCard';
import { TopicStrengthCard } from '../components/landing/TopicStrengthCard';
import { RevisionTimelineCard } from '../components/landing/RevisionTimelineCard';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import {
  getPlan,
  getInsights,
  loadDemoData,
  getTopTopicStrength,
  getUpcomingRevisions,
  subscribeToStore,
  PlanItem,
  InsightSummary,
  TopTopicStrength,
  UpcomingRevisionItem,
} from '../api';
import { Database } from 'lucide-react';

interface LandingPageProps {
  onNavigateToApp: (screen?: string) => void;
}

export const LandingPage: FC<LandingPageProps> = ({ onNavigateToApp }) => {
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [insights, setInsights] = useState<InsightSummary | null>(null);
  const [topTopic, setTopTopic] = useState<TopTopicStrength | null>(null);
  const [upcomingRevisions, setUpcomingRevisions] = useState<UpcomingRevisionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    return Promise.all([
      getPlan(),
      getInsights(),
      getTopTopicStrength(),
      getUpcomingRevisions(4),
    ]).then(([p, ins, top, upcoming]) => {
      setPlan(p);
      setInsights(ins);
      setTopTopic(top);
      setUpcomingRevisions(upcoming);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = subscribeToStore(fetchData);
    return () => unsubscribe();
  }, [fetchData]);

  const handleLoadDemo = async () => {
    setIsLoading(true);
    await loadDemoData();
    await fetchData();
  };

  const totalProblems = insights?.total_problems ?? 0;
  const topicsUnlocked = insights?.topics_unlocked ?? 0;
  const streak = insights?.streak ?? 0;
  const dueToday = insights?.revisions_due_today ?? 0;

  return (
    <div className="min-h-screen bg-bg text-fg relative overflow-hidden flex flex-col justify-between selection:bg-accent selection:text-accent-ink">
      {/* Top Nav */}
      <LandingNav onNavigateToApp={onNavigateToApp} />

      {/* Main Hero Container */}
      <main className="relative pt-8 sm:pt-14 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Luminous Vertical Glow Beam behind headline */}
        <div className="hero-glow-beam" />

        {/* Hero Content Area with Flanking Stats */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Main Grid: Flanking Left Stats - Center Headline & CTAs - Flanking Right Stats */}
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Flanking Stats (Desktop) */}
            <div className="hidden md:flex md:col-span-3 flex-col items-start space-y-10 pl-2">
              {isLoading ? (
                <div className="space-y-10 w-full animate-pulse">
                  <div className="h-14 bg-surface-2/60 rounded-xl w-32" />
                  <div className="h-14 bg-surface-2/60 rounded-xl w-32" />
                </div>
              ) : (
                <>
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
                </>
              )}
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
                {dueToday > 0 && (
                  <Button
                    size="md"
                    variant="secondary"
                    onClick={() => onNavigateToApp('review')}
                    className="px-6 text-accent border-accent/40 hover:bg-accent/15"
                  >
                    Flashcard review ({dueToday})
                  </Button>
                )}
              </div>

              {/* Empty First-Boot State Action */}
              {!isLoading && totalProblems === 0 && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Database className="w-3.5 h-3.5" />}
                    onClick={handleLoadDemo}
                    className="text-xs font-mono text-accent hover:border-accent"
                  >
                    Load demo data
                  </Button>
                </div>
              )}
            </div>

            {/* Right Flanking Stats (Desktop) */}
            <div className="hidden md:flex md:col-span-3 flex-col items-end space-y-10 pr-2">
              {isLoading ? (
                <div className="space-y-10 w-full animate-pulse flex flex-col items-end">
                  <div className="h-14 bg-surface-2/60 rounded-xl w-32" />
                  <div className="h-14 bg-surface-2/60 rounded-xl w-32" />
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Mobile Flanking Stats (2x2 Grid below CTAs at 375px - 768px) */}
          <div className="grid md:hidden grid-cols-2 gap-6 w-full max-w-sm mt-10 pt-6 border-t border-border/40">
            {isLoading ? (
              <div className="col-span-2 h-20 bg-surface-2/40 rounded-xl animate-pulse" />
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Tilted Cards Section over Soft Radial Aura */}
        <div className="relative mt-14 sm:mt-20 pt-6">
          {/* Radial aura underneath cards */}
          <div className="cards-glow-aura" />

          {/* Three Cards Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 items-center max-w-6xl mx-auto relative z-10 px-2">
            {/* Left Card: Today's Plan */}
            <div className="w-full max-w-md mx-auto lg:max-w-none">
              <TodaysPlanCard
                planItems={plan}
                onItemClick={() => onNavigateToApp('today')}
              />
            </div>

            {/* Center Card: Topic Strength */}
            <div className="w-full max-w-md mx-auto lg:max-w-none">
              <TopicStrengthCard
                score={topTopic?.strength ?? 0}
                label={topTopic?.topic.name ?? 'Awaiting Data'}
                isUnlocked={topTopic?.is_unlocked ?? false}
                points={topTopic?.history ?? [0, 0, 0, 0, 0, 0, 0]}
              />
            </div>

            {/* Right Card: Revision Timeline */}
            <div className="w-full max-w-md mx-auto lg:max-w-none">
              <RevisionTimelineCard
                items={upcomingRevisions.map((item) => ({
                  problemTitle: item.problem.title,
                  topicName: item.topic?.name,
                  isDue: item.is_due,
                  daysUntilDue: item.days_until_due,
                  intervalDays: item.revision.interval_days,
                }))}
                onItemClick={() => onNavigateToApp('revisions')}
              />
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
