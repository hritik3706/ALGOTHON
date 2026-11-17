import { FC, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CONCEPT_CARDS } from '../../data/conceptCards';
import {
  Sparkles,
  BookOpen,
  Search,
  Code2,
  AlertCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface ConceptsScreenProps {
  onOpenCoachWithPrompt?: (prompt: string) => void;
}

export const ConceptsScreen: FC<ConceptsScreenProps> = ({ onOpenCoachWithPrompt }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [activeCardId, setActiveCardId] = useState<string>(CONCEPT_CARDS[0].id);

  const topics = Array.from(new Set(CONCEPT_CARDS.map((c) => c.topicName)));

  const filteredCards = CONCEPT_CARDS.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.triggerCondition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.topicName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || c.topicName === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const activeCard =
    CONCEPT_CARDS.find((c) => c.id === activeCardId) || filteredCards[0] || CONCEPT_CARDS[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>High-Yield Interview Invariants</span>
          </div>
          <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
            Algorithmic <em className="italic text-accent">Concept Patterns</em>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1 max-w-2xl">
            Interviews test patterns, not memorized problems. Master the mathematical invariants, trigger conditions, and canonical templates behind top technical rounds.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-fg-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pattern or invariant..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-border text-xs font-mono text-fg placeholder:text-fg-faint focus-visible:outline-accent"
          />
        </div>
      </div>

      {/* Topic Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-xs">
        <button
          onClick={() => setSelectedTopic('all')}
          className={`px-3 py-1.5 rounded-xl border transition-colors shrink-0 ${
            selectedTopic === 'all'
              ? 'bg-accent text-accent-ink border-accent font-bold'
              : 'bg-surface-2/60 border-border text-fg-muted hover:text-fg'
          }`}
        >
          All Patterns ({CONCEPT_CARDS.length})
        </button>
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTopic(t)}
            className={`px-3 py-1.5 rounded-xl border transition-colors shrink-0 ${
              selectedTopic === t
                ? 'bg-accent text-accent-ink border-accent font-bold'
                : 'bg-surface-2/60 border-border text-fg-muted hover:text-fg'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Two-Column Master/Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Cards List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {filteredCards.map((c) => {
            const isActive = c.id === activeCard.id;
            return (
              <div
                key={c.id}
                onClick={() => setActiveCardId(c.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isActive
                    ? 'border-accent bg-accent/10 text-fg shadow-[0_0_15px_rgba(255,107,91,0.2)] ring-1 ring-accent/30'
                    : 'border-border bg-surface hover:bg-surface-2/60 text-fg-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-accent">
                    {c.topicName}
                  </span>
                  <span className="font-mono text-[10px] text-fg-faint">{c.timeComplexity}</span>
                </div>
                <div className="font-ui text-sm font-semibold text-fg mt-1 flex items-center justify-between">
                  <span>{c.title}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-accent' : 'opacity-40'}`} />
                </div>
                <p className="font-mono text-[11px] text-fg-faint mt-1 line-clamp-2">
                  {c.triggerCondition}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Active Detail Card */}
        <div className="lg:col-span-7">
          <Card className="p-6 bg-surface border-border space-y-5">
            {/* Title & Topic */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-accent font-bold">
                  {activeCard.topicName} Pattern
                </span>
                <h2 className="font-display text-3xl text-fg font-normal mt-1 leading-tight">
                  {activeCard.title}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1 font-mono text-xs">
                <span className="px-2.5 py-1 rounded bg-surface-2 text-fg border border-border">
                  Time: <strong className="text-accent">{activeCard.timeComplexity}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-surface-2 text-fg border border-border">
                  Space: <strong>{activeCard.spaceComplexity}</strong>
                </span>
              </div>
            </div>

            {/* When to use (Trigger Condition) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase font-bold text-fg">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>When to Trigger This Pattern</span>
              </div>
              <p className="font-mono text-xs text-fg-muted bg-surface-2/40 p-3.5 rounded-xl border border-border/60 leading-relaxed">
                {activeCard.triggerCondition}
              </p>
            </div>

            {/* Key Invariant & Mathematical Principle */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase font-bold text-fg">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span>Core Algorithmic Invariant</span>
              </div>
              <p className="font-mono text-xs text-fg leading-relaxed bg-[#F4EDE0] text-[#14213D] p-3.5 rounded-xl border border-[#E0BFBA]/60 shadow-sm">
                {activeCard.keyInvariant}
              </p>
            </div>

            {/* Canonical Code Template */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase font-bold text-fg">
                <Code2 className="w-3.5 h-3.5 text-accent" />
                <span>Canonical Implementation Template</span>
              </div>
              <div className="p-4 rounded-xl bg-surface-2 border border-border font-mono text-xs text-fg overflow-x-auto">
                <pre className="leading-relaxed">
                  <code>{activeCard.codeTemplate}</code>
                </pre>
              </div>
            </div>

            {/* Common Pitfall */}
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/25 flex items-start gap-2.5 font-mono text-xs text-danger">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="uppercase text-[10px] font-bold block mb-0.5">#1 Interview Trap:</strong>
                <span>{activeCard.commonPitfall}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="font-mono text-[10px] text-fg-faint">
                Mastered patterns lead to confident $O(N)$ solutions.
              </span>
              {onOpenCoachWithPrompt && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onOpenCoachWithPrompt(
                      `Explain the "${activeCard.title}" pattern in detail with a step-by-step example and common interview edge cases.`
                    )
                  }
                  className="font-mono text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-accent" />
                  Ask Gemini Coach
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
