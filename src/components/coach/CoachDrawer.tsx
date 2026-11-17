import { FC, useState, useEffect, useRef } from 'react';
import {
  askCoach,
  logAttempt,
  CoachResponse,
  ProposedAction,
  getStoredCoachMode,
  setStoredCoachMode,
  getStoredGeminiKey,
  setStoredGeminiKey,
} from '../../api';
import { useToast } from '../common/Toast';
import {
  Bot,
  Send,
  X,
  RotateCcw,
  Check,
  ShieldCheck,
  Sparkles,
  Settings2,
  Key,
  HelpCircle,
} from 'lucide-react';

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
  const [coachMode, setCoachModeState] = useState<'gemini' | 'offline'>(() => {
    const m = getStoredCoachMode();
    return m === 'gemini' ? 'gemini' : 'offline';
  });
  const [geminiKey, setGeminiKeyState] = useState<string>(() => getStoredGeminiKey());
  const [showConfig, setShowConfig] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);

  const getInitialMessages = (mode: 'gemini' | 'offline'): CoachMessage[] => [
    {
      id: 'welcome',
      sender: 'coach',
      text:
        mode === 'gemini'
          ? "Hello! I am your Algothon DSA Coach, powered by Google Gemini. Ask me any DSA doubt — whether it's binary search on rotated arrays, dynamic programming state transitions, graph cycle detection, or time complexity tradeoffs!\n\nI can also review your daily practice plan and weakest topics."
          : "Hello! I am your personal Algothon practice coach. I run 100% locally on your machine with zero network calls.\n\nAsk me about your daily practice plan, weakest topics, prerequisite chains, or spaced revisions.",
      basedOnChips:
        mode === 'gemini'
          ? ['Gemini 3.1 Flash-Lite', 'Interactive DSA Coach']
          : ['Offline Engine', 'Local-First Data'],
      suggestionChips:
        mode === 'gemini'
          ? [
              'How does Two Pointers work on sorted arrays?',
              'Explain DP memoization vs tabulation',
              'What should I do today?',
              'Give me a hint for LRU Cache',
              'What is my weakest topic?',
            ]
          : [
              'What should I do today?',
              'What is my weakest topic?',
              'Am I avoiding anything?',
              'What is due this week?',
            ],
      timestamp: 'Just now',
    },
  ];

  const [messages, setMessages] = useState<CoachMessage[]>(() =>
    getInitialMessages(getStoredCoachMode() === 'gemini' ? 'gemini' : 'offline')
  );
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

  const handleModeChange = (newMode: 'gemini' | 'offline') => {
    setCoachModeState(newMode);
    setStoredCoachMode(newMode);
    showToast(`Switched Coach mode to ${newMode === 'gemini' ? 'Gemini AI' : 'Offline Engine'}`);
  };

  const handleSaveKey = () => {
    setStoredGeminiKey(geminiKey);
    showToast('Gemini API key saved in browser storage');
    if (geminiKey.trim()) {
      handleModeChange('gemini');
    }
    setShowConfig(false);
  };

  const handleTestGemini = async () => {
    if (!geminiKey.trim()) {
      showToast('Please enter an API key first', 'danger');
      return;
    }
    setIsTestingKey(true);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${encodeURIComponent(geminiKey.trim())}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Respond with "PONG"' }] }],
          }),
        }
      );
      if (res.ok) {
        showToast('Gemini connection successful! (HTTP 200)');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(`Gemini error: ${data.error?.message || res.statusText}`, 'danger');
      }
    } catch (e: any) {
      showToast(`Network error: ${e.message}`, 'danger');
    } finally {
      setIsTestingKey(false);
    }
  };

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
      <div className="w-full max-w-lg bg-surface border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border bg-surface-2/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                  coachMode === 'gemini'
                    ? 'bg-accent/20 border-accent/40 text-accent shadow-[0_0_12px_rgba(255,107,91,0.3)]'
                    : 'bg-surface-2 border-border text-fg-muted'
                }`}
              >
                {coachMode === 'gemini' ? (
                  <Sparkles className="w-4 h-4 text-accent" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="font-ui text-sm font-semibold text-fg flex items-center gap-2">
                  <span>Algothon Coach</span>
                  <button
                    onClick={() => setShowConfig(!showConfig)}
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1.5 border transition-all ${
                      coachMode === 'gemini'
                        ? 'bg-accent/15 border-accent/40 text-accent font-semibold hover:bg-accent/25'
                        : 'bg-surface-2 border-border text-fg-muted hover:text-fg'
                    }`}
                    title="Click to configure AI / Offline model settings"
                  >
                    {coachMode === 'gemini' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Gemini AI</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Offline Mode</span>
                      </>
                    )}
                    <Settings2 className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>
                </div>
                <div className="font-mono text-[10px] text-fg-faint flex items-center gap-1 mt-0.5">
                  {coachMode === 'gemini' ? (
                    <span>Google Gemini 3.1 Flash-Lite • Doubts & Concept Tutor</span>
                  ) : (
                    <span>100% Client-Side • Zero Telemetry</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages(getInitialMessages(coachMode))}
                className="p-1.5 rounded hover:bg-surface-2 text-fg-faint hover:text-fg"
                title="Reset conversation"
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

          {/* Quick Config Drawer */}
          {showConfig && (
            <div className="mt-3.5 p-3.5 rounded-xl bg-surface border border-accent/30 space-y-3 font-mono text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <span className="font-semibold text-fg flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-accent" />
                  <span>Coach Engine Settings</span>
                </span>
                <span className="text-[10px] text-fg-faint">Client-Side Only</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleModeChange('gemini')}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    coachMode === 'gemini'
                      ? 'border-accent bg-accent/10 text-fg'
                      : 'border-border bg-surface-2/40 text-fg-muted hover:border-border/80'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent" /> Gemini AI
                  </div>
                  <div className="text-[10px] text-fg-faint mt-0.5">Solves doubts & explains DSA</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('offline')}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    coachMode === 'offline'
                      ? 'border-accent bg-accent/10 text-fg'
                      : 'border-border bg-surface-2/40 text-fg-muted hover:border-border/80'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1">
                    <Bot className="w-3 h-3" /> Offline Engine
                  </div>
                  <div className="text-[10px] text-fg-faint mt-0.5">Local SM-2 & plan queries</div>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-fg font-medium flex items-center justify-between">
                  <span>Gemini API Key</span>
                  <span className="text-[10px] text-emerald-400">Never tracked in Git</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKeyState(e.target.value)}
                    placeholder="Enter or paste Gemini key..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-fg text-xs focus-visible:outline-accent"
                  />
                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={isTestingKey}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border hover:border-accent text-[11px] text-fg font-medium disabled:opacity-50"
                  >
                    {isTestingKey ? 'Testing...' : 'Test'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    className="px-3 py-1.5 rounded-lg bg-accent text-accent-ink hover:bg-accent-hover text-[11px] font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
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
                  className={`max-w-[90%] p-3.5 rounded-2xl whitespace-pre-wrap ${
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
                        className="text-[9px] px-1.5 py-0.5 rounded bg-surface-2/60 text-fg-faint border border-border/40 flex items-center gap-1"
                      >
                        {chip.toLowerCase().includes('gemini') ? (
                          <Sparkles className="w-2.5 h-2.5 text-accent" />
                        ) : null}
                        <span>{chip}</span>
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
                        className="text-[10px] px-2.5 py-1 rounded-full bg-surface-2 text-accent border border-border hover:border-accent/40 transition-colors flex items-center gap-1"
                      >
                        <HelpCircle className="w-3 h-3 opacity-60" />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-fg-faint px-1">{m.timestamp}</span>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex items-center gap-2 text-fg-faint text-xs font-mono p-2 rounded-lg bg-surface-2/40 border border-border/40 w-fit">
              {coachMode === 'gemini' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-accent animate-spin" />
                  <span>Gemini is analyzing your doubt & formulating explanation...</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-accent animate-spin" />
                  <span>Analyzing practice graph...</span>
                </>
              )}
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
              placeholder={
                coachMode === 'gemini'
                  ? 'Ask any DSA doubt or problem question (Gemini AI)...'
                  : 'Ask about daily plan, weakest topics, DAG paths...'
              }
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
            <span>Shortcut: Ctrl+J to toggle Coach</span>
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
