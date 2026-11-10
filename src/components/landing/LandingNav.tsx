import type { FC } from 'react';
import { LogoMark } from '../brand/LogoMark';
import { Button } from '../common/Button';

interface LandingNavProps {
  onNavigateToApp: (screen?: string) => void;
  activeSection?: string;
  onSectionClick?: (section: string) => void;
}

export const LandingNav: FC<LandingNavProps> = ({
  onNavigateToApp,
  activeSection = 'features',
  onSectionClick,
}) => {
  const navLinks = [
    { id: 'features', label: 'Features' },
    { id: 'topics', label: 'Topics' },
    { id: 'planner', label: 'Planner' },
    { id: 'docs', label: 'Docs' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-bg/80 border-b border-border/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo + Wordmark */}
        <div
          className="cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <LogoMark showWordmark={true} size={28} />
        </div>

        {/* Center: Navigation Links with active dot */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  if (onSectionClick) onSectionClick(link.id);
                  else if (link.id === 'topics' || link.id === 'planner') {
                    onNavigateToApp(link.id);
                  }
                }}
                className={`font-ui text-sm transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'text-fg font-medium'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                )}
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Start tracking CTA */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onNavigateToApp('today')}
            className="text-xs sm:text-sm font-semibold"
          >
            Start tracking
          </Button>
        </div>
      </div>
    </header>
  );
};
