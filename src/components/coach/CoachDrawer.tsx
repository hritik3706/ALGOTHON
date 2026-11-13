import { FC, useState, useEffect, useRef } from 'react';
import { askCoach, logAttempt, CoachResponse, ProposedAction } from '../../api';
import { useToast } from '../common/Toast';
import { Bot, Send, X, RotateCcw, Check, ShieldCheck, Sparkles } from 'lucide-react';

interface CoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  basedOnChips?: string[];
  suggestionChips?: string[];
  proposedAction?: ProposedAction;
  timestamp: string;
}

interface CoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTopicId?: string;
}

export const CoachDrawer: FC<CoachDrawerProps> = ({ isOpen, onClose, currentTopicId }) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<CoachMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'coach',
      text: "Hello! I am your personal Algothon practice coach. I run 100% locally on your machine with zero network calls.\n\nAsk me about your daily practice plan, weakest topics, prerequisite chains, or spaced revisions.",
      basedOnChips: ['Offline Engine', 'Local-First Data'],
      suggestionChips: [
        'What should I do today?',
        'What is my weakest topic?',
        'Am I avoiding anything?',
        'What is due this week?',
      ],
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
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

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || isLoading) return;

    const userMsg: CoachMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response: CoachResponse = await askCoach(q, currentTopicId);
      const coachMsg: CoachMessage = {
        id: `coach_${Date.now()}`,
        sender: 'coach',
        text: response.text,
        basedOnChips: response.basedOnChips,
        suggestionChips: response.suggestionChips,
        proposedAction: response.proposedAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (err) {
      console.error(err);
      showToast('Error consulting Coach', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (action: ProposedAction) => {
    try {
      if (action.type === 'log_attempt') {
        await logAttempt(action.payload);
        showToast(`Action confirmed: ${action.summary}`);
        setMessages((prev) => [
          ...prev,
          {
            id: `sys_${Date.now()}`,
            sender: 'coach',
            text: `Confirmed and saved: **${action.summary}** has been recorded into your local database.`,
            basedOnChips: ['Action Executed', 'Storage Mutated'],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      showToast('Error executing action', 'danger');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-surface border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-2/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-ui text-sm font-semibold text-fg flex items-center gap-1.5">
                <span>Coach</span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-accent/15 text-accent font-bold">
                  OFFLINE
                </span>
              </div>
              <div className="font-mono text-[10px] text-fg-faint flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Zero network • 100% private</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages([messages[0]])}
              className="p-1.5 rounded hover:bg-surface-2 text-fg-faint hover:text-fg"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-surface-2 text-fg-faint hover:text-fg"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          {messages.map((m) => {
            const isCoach = m.sender === 'coach';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isCoach ? 'items-start' : 'items-end'} space-y-1.5`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl whitespace-pre-wrap ${
                    isCoach
                      ? 'bg-[#F4EDE0] text-[#14213D] shadow-sm rounded-tl-sm border border-[#E0BFBA]/50'
                      : 'bg-surface-2 text-fg border border-border rounded-tr-sm'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>

                  {/* Proposed Action Confirmation Card */}
                  {m.proposedAction && (
                    <div className="mt-3 p-3 rounded-xl bg-surface border border-accent/40 text-fg space-y-2">
                      <div className="flex items-center gap-1.5 text-accent font-bold text-[10px] uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Proposed Action Card</span>
                      </div>
                      <div className="text-[11px] font-ui text-fg">{m.proposedAction.summary}</div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleExecuteAction(m.proposedAction!)}
                          className="px-3 py-1 rounded bg-accent text-accent-ink font-bold text-[10px] hover:bg-accent-hover transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Confirm & Save
                        </button>
                        <button
                          onClick={() => showToast('Action cancelled')}
                          className="px-2 py-1 rounded hover:bg-surface-2 text-fg-faint text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Based On Chips for Coach */}
                {m.basedOnChips && m.basedOnChips.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-1">
                    {m.basedOnChips.map((chip, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-surface-2/60 text-fg-faint border border-border/40"
                      >
                        Based on: {chip}
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggestion Chips */}
                {m.suggestionChips && m.suggestionChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.suggestionChips.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(chip)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-surface-2 text-accent border border-border hover:border-accent/40 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-fg-faint px-1">{m.timestamp}</span>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex items-center gap-2 text-fg-faint text-xs font-mono">
              <Bot className="w-3.5 h-3.5 text-accent animate-spin" />
              <span>Analyzing practice graph...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border bg-surface-2/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your practice..."
              className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-xs font-mono text-fg placeholder:text-fg-faint focus-visible:outline-accent"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-40 transition-colors shrink-0"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex justify-between items-center text-[10px] font-mono text-fg-faint mt-1.5 px-1">
            <span>Shortcut: Ctrl+J to toggle</span>
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
