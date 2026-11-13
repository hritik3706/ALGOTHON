import { FC, useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getProblems, Problem, MistakeTag } from '../../api';
import { AlertTriangle, Tag } from 'lucide-react';

interface MistakesScreenProps {
  onLogProblem?: (title: string, topicId?: string) => void;
}

export const MistakesScreen: FC<MistakesScreenProps> = ({ onLogProblem }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedTag, setSelectedTag] = useState<MistakeTag>('logic');

  useEffect(() => {
    getProblems().then((pList) => {
      setProblems(pList);
    });
  }, []);

  const mistakeTags: { tag: MistakeTag; label: string; desc: string }[] = [
    { tag: 'logic', label: 'Algorithmic / Logic Error', desc: 'Flawed invariant or incorrect branch condition' },
    { tag: 'off_by_one', label: 'Off-by-One', desc: 'Index boundary, array termination, or pointer arithmetic' },
    { tag: 'edge_case', label: 'Edge Case Omission', desc: 'Empty input, duplicates, single element, negative numbers' },
    { tag: 'tle', label: 'Time Limit Exceeded (TLE)', desc: 'Brute force sub-optimal time complexity' },
    { tag: 'complexity', label: 'Space / Memory Overrun', desc: 'Unnecessary deep recursion or memory allocation' },
    { tag: 'syntax', label: 'Language / Syntax Slip', desc: 'API misuse, type errors, or language quirk' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
            Mistake <em className="italic text-accent">Pattern Journal</em>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1">
            Group repeated failure modes across practice sessions to eliminate recurring blind spots.
          </p>
        </div>
      </div>

      {/* Mistake Tag Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {mistakeTags.map((m) => {
          const isSelected = selectedTag === m.tag;
          return (
            <div
              key={m.tag}
              onClick={() => setSelectedTag(m.tag)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-accent bg-accent/10 text-fg shadow-glow'
                  : 'border-border bg-surface hover:bg-surface-2/60 text-fg-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase">{m.tag}</span>
                <Tag className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="font-ui text-sm font-semibold text-fg mt-1.5">{m.label}</div>
              <p className="font-mono text-[10px] text-fg-faint mt-1 line-clamp-1">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Detail List of Problems with this Mistake */}
      <Card className="p-6 bg-surface space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-ui text-base font-semibold text-fg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent" />
            Problems Tagged with "{selectedTag}"
          </h2>
          <span className="font-mono text-xs text-fg-faint">
            Review and re-solve
          </span>
        </div>

        <div className="space-y-3">
          {problems.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-fg-faint">
              No problems logged in library yet.
            </div>
          ) : (
            problems.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-surface-2/50 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-ui text-sm font-medium text-fg">{p.title}</span>
                    <span className="font-mono text-[10px] uppercase font-bold text-accent">
                      {p.difficulty}
                    </span>
                    <span className="font-mono text-[10px] text-fg-faint">• {p.platform}</span>
                  </div>
                  <div className="font-mono text-[11px] text-fg-muted mt-1">
                    Topics: {p.topic_ids.join(', ')}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onLogProblem?.(p.title, p.topic_ids[0])}
                  className="text-xs text-accent self-end sm:self-center"
                >
                  Log attempt →
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
