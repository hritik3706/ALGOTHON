import type { FC } from 'react';
import { LogoMark } from '../brand/LogoMark';
import { Button } from '../common/Button';
import { useAuth } from '../../core/auth/AuthContext';
import { User, LogOut } from 'lucide-react';

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
  const { user, openAuthModal, signOut } = useAuth();

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

        {/* Center: Navigation Links with active lime dot */}
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

        {/* Right: Auth State (Sign in / User Profile) + Start tracking CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface-2 border border-border text-xs font-mono text-fg">
                <User className="w-3.5 h-3.5 text-accent" />
                <span className="truncate max-w-[120px]">{user.email?.split('@')[0]}</span>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                title="Sign out"
                className="text-fg-faint hover:text-danger p-1.5 rounded-full hover:bg-surface-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('signin')}
              className="text-fg-muted hover:text-fg font-ui text-xs sm:text-sm px-3.5 py-1.5 rounded-pill border border-border/80 hover:border-white/20 transition-all"
            >
              Sign in
            </button>
          )}

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
