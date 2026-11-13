import { FC, useState, useEffect } from 'react';
import { Search, Compass, BookOpen, Clock, BarChart2, PlusCircle, Settings, Bot, X } from 'lucide-react';
import { AppScreenId } from '../app/AppNav';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: AppScreenId) => void;
  onOpenCoach: () => void;
}

export const CommandPalette: FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCoach,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'today', title: "Today's Practice Plan", icon: Compass, action: () => onNavigate('today') },
    { id: 'review', title: 'Flashcard Review Focus Mode', icon: Clock, action: () => onNavigate('review') },
    { id: 'log', title: 'Log Problem Attempt', icon: PlusCircle, action: () => onNavigate('log') },
    { id: 'problems', title: 'Problem Library & Search', icon: BookOpen, action: () => onNavigate('problems') },
    { id: 'mistakes', title: 'Mistake Pattern Journal', icon: BookOpen, action: () => onNavigate('mistakes') },
    { id: 'graph', title: 'Prerequisite Roadmap Graph', icon: Compass, action: () => onNavigate('graph') },
    { id: 'topics', title: 'Topic Mastery & Prereqs', icon: Compass, action: () => onNavigate('topics') },
    { id: 'insights', title: 'Performance Insights & Analytics', icon: BarChart2, action: () => onNavigate('insights') },
    { id: 'settings', title: 'System Settings & Backups', icon: Settings, action: () => onNavigate('settings') },
    { id: 'coach', title: 'Ask Coach (AI Assistant)', icon: Bot, action: onOpenCoach },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
      <div className="w-full max-w-lg rounded-card bg-surface border border-border shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-accent shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a screen or command..."
            className="w-full bg-transparent border-none text-xs font-mono text-fg placeholder:text-fg-faint focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-fg-faint hover:text-fg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center font-mono text-xs text-fg-faint">
              No matching commands.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 text-fg-muted hover:text-fg cursor-pointer transition-colors text-xs font-mono group"
                >
                  <Icon className="w-4 h-4 text-fg-faint group-hover:text-accent transition-colors" />
                  <span className="flex-1">{item.title}</span>
                  <span className="text-[10px] text-fg-faint">Jump →</span>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-surface-2/40 border-t border-border flex justify-between text-[10px] font-mono text-fg-faint">
          <span>Navigation: Click or Enter</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};
