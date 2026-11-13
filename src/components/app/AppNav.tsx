import type { FC } from 'react';
import { LogoMark } from '../brand/LogoMark';
import {
  Calendar,
  PlusCircle,
  FolderTree,
  Network,
  Clock,
  BarChart3,
  ArrowLeft,
  BookOpen,
  Layers,
  AlertTriangle,
  Settings,
  Bot,
  Command,
} from 'lucide-react';

export type AppScreenId =
  | 'today'
  | 'review'
  | 'log'
  | 'problems'
  | 'topics'
  | 'graph'
  | 'revisions'
  | 'mistakes'
  | 'insights'
  | 'settings';

interface AppNavProps {
  currentScreen: AppScreenId;
  onSelectScreen: (screen: AppScreenId) => void;
  onBackToLanding: () => void;
  onOpenCoach?: () => void;
  onOpenCommandPalette?: () => void;
}

export const AppNav: FC<AppNavProps> = ({
  currentScreen,
  onSelectScreen,
  onBackToLanding,
  onOpenCoach,
  onOpenCommandPalette,
}) => {
  const navItems: { id: AppScreenId; label: string; icon: any }[] = [
    { id: 'today', label: "Today's Plan", icon: Calendar },
    { id: 'review', label: 'Flashcard Review', icon: Layers },
    { id: 'log', label: 'Log Attempt', icon: PlusCircle },
    { id: 'problems', label: 'Problem Library', icon: BookOpen },
    { id: 'mistakes', label: 'Mistake Journal', icon: AlertTriangle },
    { id: 'topics', label: 'Topic Mastery', icon: FolderTree },
    { id: 'graph', label: 'Roadmap Graph', icon: Network },
    { id: 'revisions', label: 'SM-2 Scheduler', icon: Clock },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Data', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-border bg-surface/50 backdrop-blur-xl h-screen sticky top-0 p-5 select-none shrink-0 overflow-y-auto">
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <LogoMark showWordmark={true} size={28} />
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
              v1.0.0
            </span>
          </div>

          {/* Quick Search Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-2 border border-border text-fg-faint hover:text-fg hover:border-accent/40 font-mono text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Command className="w-3.5 h-3.5 text-accent" />
                <span>Quick Jump...</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border">
                Ctrl+K
              </span>
            </button>
          )}

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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-ui text-sm font-medium transition-all ${
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
          {onOpenCoach && (
            <button
              onClick={onOpenCoach}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent font-ui text-xs font-semibold hover:bg-accent/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span>Ask Coach</span>
              </div>
              <span className="font-mono text-[10px] px-1 rounded bg-surface border border-accent/20">
                Ctrl+J
              </span>
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
            Local storage • Paper on Night
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <LogoMark showWordmark={true} size={24} />
        <div className="flex items-center gap-2">
          {onOpenCoach && (
            <button
              onClick={onOpenCoach}
              className="p-1.5 rounded-lg bg-accent/15 text-accent border border-accent/30 font-mono text-xs flex items-center gap-1"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Coach</span>
            </button>
          )}
          <button
            onClick={onBackToLanding}
            className="text-xs font-mono text-fg-muted flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Landing
          </button>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border px-1 py-1.5 flex items-center justify-around overflow-x-auto">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[9px] font-mono transition-colors shrink-0 ${
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
