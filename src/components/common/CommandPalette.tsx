import { FC, useState, useEffect } from 'react';
import {
  Search,
  Compass,
  BookOpen,
  Clock,
  BarChart2,
  PlusCircle,
  Settings,
  Bot,
  X,
  ExternalLink,
} from 'lucide-react';
import { AppScreenId } from '../app/AppNav';
import { searchProblems, Problem, ProblemDifficulty } from '../../api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: AppScreenId) => void;
  onOpenCoach: () => void;
  onLogProblem?: (
    title?: string,
    topicId?: string,
    link?: string,
    difficulty?: ProblemDifficulty
  ) => void;
}

export const CommandPalette: FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCoach,
  onLogProblem,
}) => {
  const [query, setQuery] = useState('');
  const [matchedProblems, setMatchedProblems] = useState<Problem[]>([]);

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

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setMatchedProblems([]);
      return;
    }
    searchProblems(q, 6).then((res) => {
      setMatchedProblems(res);
    });
  }, [query]);

  if (!isOpen) return null;

  const commands = [
    { id: 'today', title: "Today's Practice Plan", icon: Compass, action: () => onNavigate('today') },
    { id: 'review', title: 'Flashcard Review Focus Mode', icon: Clock, action: () => onNavigate('review') },
    { id: 'log', title: 'Log Problem Attempt', icon: PlusCircle, action: () => onNavigate('log') },
    { id: 'problems', title: 'Problem Library & Search (4,115 LeetCode)', icon: BookOpen, action: () => onNavigate('problems') },
    { id: 'concepts', title: 'Concept Patterns & Invariants', icon: BookOpen, action: () => onNavigate('concepts') },
    { id: 'visualizer', title: 'Algorithm Interactive Visualizers', icon: Compass, action: () => onNavigate('visualizer') },
    { id: 'mistakes', title: 'Mistake Pattern Journal', icon: BookOpen, action: () => onNavigate('mistakes') },
    { id: 'graph', title: 'Prerequisite Roadmap Graph', icon: Compass, action: () => onNavigate('graph') },
    { id: 'topics', title: 'Topic Mastery & Prereqs', icon: Compass, action: () => onNavigate('topics') },
    { id: 'insights', title: 'Performance Insights & Analytics', icon: BarChart2, action: () => onNavigate('insights') },
    { id: 'settings', title: 'System Settings & Backups', icon: Settings, action: () => onNavigate('settings') },
    { id: 'coach', title: 'Ask Coach (AI Assistant)', icon: Bot, action: onOpenCoach },
  ];

  const filteredCommands = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-xl rounded-card bg-surface border border-border shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-accent shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search screens or 4,115 LeetCode problems (e.g. #1, two sum, rain water)..."
            className="w-full bg-transparent border-none text-xs font-mono text-fg placeholder:text-fg-faint focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-fg-faint hover:text-fg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Matching LeetCode Problems */}
          {matchedProblems.length > 0 && (
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-mono uppercase text-fg-faint font-semibold tracking-wider">
                LeetCode Problems ({matchedProblems.length})
              </span>
              <div className="space-y-1 mt-1">
                {matchedProblems.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-surface-2 text-fg transition-colors group"
                  >
                    <div
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        if (onLogProblem) {
                          onLogProblem(p.title, p.topic_ids[0], p.link, p.difficulty);
                        } else {
                          onNavigate('problems');
                        }
                        onClose();
                      }}
                    >
                      {p.leetcode_id && (
                        <span className="font-mono text-xs text-fg-faint font-bold">
                          #{p.leetcode_id}
                        </span>
                      )}
                      <span className="font-ui text-xs font-medium truncate group-hover:text-accent">
                        {p.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${
                          p.difficulty === 'easy'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : p.difficulty === 'medium'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-surface text-fg-faint hover:text-accent"
                          title="Open on LeetCode"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          if (onLogProblem) {
                            onLogProblem(p.title, p.topic_ids[0], p.link, p.difficulty);
                          }
                          onClose();
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 hover:bg-accent/20 text-accent font-semibold"
                      >
                        Log →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Commands */}
          <div className="space-y-1">
            {matchedProblems.length > 0 && (
              <span className="px-3 text-[10px] font-mono uppercase text-fg-faint font-semibold tracking-wider">
                App Screens & Actions
              </span>
            )}
            {filteredCommands.length === 0 && matchedProblems.length === 0 ? (
              <div className="py-6 text-center font-mono text-xs text-fg-faint">
                No matching screens or problems found.
              </div>
            ) : (
              filteredCommands.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-2 text-fg-muted hover:text-fg cursor-pointer transition-colors text-xs font-mono group"
                  >
                    <Icon className="w-4 h-4 text-fg-faint group-hover:text-accent transition-colors" />
                    <span className="flex-1">{item.title}</span>
                    <span className="text-[10px] text-fg-faint">Jump →</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
