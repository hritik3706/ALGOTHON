import type { FC } from 'react';
import { LogoMark } from '../brand/LogoMark';
import { useAuth } from '../../core/auth/AuthContext';
import {
  Calendar,
  PlusCircle,
  FolderTree,
  Network,
  Clock,
  BarChart3,
  ArrowLeft,
  LogOut,
  LogIn,
} from 'lucide-react';

export type AppScreenId =
  | 'today'
  | 'log'
  | 'topics'
  | 'graph'
  | 'revisions'
  | 'insights';

interface AppNavProps {
  currentScreen: AppScreenId;
  onSelectScreen: (screen: AppScreenId) => void;
  onBackToLanding: () => void;
}

export const AppNav: FC<AppNavProps> = ({
  currentScreen,
  onSelectScreen,
  onBackToLanding,
}) => {
  const { user, openAuthModal, signOut } = useAuth();
  const navItems: { id: AppScreenId; label: string; icon: typeof Calendar }[] = [
    { id: 'today', label: "Today's Plan", icon: Calendar },
    { id: 'log', label: 'Log Attempt', icon: PlusCircle },
    { id: 'topics', label: 'Topics', icon: FolderTree },
    { id: 'graph', label: 'Topic Graph', icon: Network },
    { id: 'revisions', label: 'Revisions', icon: Clock },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-border bg-surface/50 backdrop-blur-xl h-screen sticky top-0 p-5 select-none shrink-0">
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <LogoMark showWordmark={true} size={28} />
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              v1.0
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-wider text-fg-faint px-3 mb-2">
              Practice Modules
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectScreen(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-ui text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent text-accent-ink shadow-sm font-semibold'
                      : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-ink" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-border space-y-2">
          {/* User Auth Profile / Sign In */}
          {user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface-2/60 border border-border/50">
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <div className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center font-mono text-[10px] font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="font-mono text-xs text-fg truncate">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                title="Sign out"
                className="text-fg-faint hover:text-danger p-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-fg-muted hover:text-accent font-ui text-xs hover:bg-surface-2 transition-colors border border-border/60"
            >
              <LogIn className="w-3.5 h-3.5 text-accent" />
              <span>Sign in / Sync</span>
            </button>
          )}

          <button
            onClick={onBackToLanding}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-fg-muted hover:text-fg font-ui text-xs hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Landing</span>
          </button>
          <div className="font-mono text-[10px] text-fg-faint px-3">
            Local storage • Pure algorithms
          </div>
        </div>
      </aside>

      {/* Mobile Top & Bottom Navigation */}
      <div className="lg:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <LogoMark showWordmark={true} size={24} />
        <button
          onClick={onBackToLanding}
          className="text-xs font-mono text-fg-muted flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Landing
        </button>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-mono transition-colors ${
                isActive ? 'text-accent font-bold' : 'text-fg-faint hover:text-fg'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};

