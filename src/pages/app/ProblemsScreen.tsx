import { FC, useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getProblems, getTopics, Problem, TopicSummary } from '../../api';
import { Search, PlusCircle, ExternalLink } from 'lucide-react';

interface ProblemsScreenProps {
  onLogProblem: (title?: string, topicId?: string) => void;
}

export const ProblemsScreen: FC<ProblemsScreenProps> = ({ onLogProblem }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [query, setQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  useEffect(() => {
    Promise.all([getProblems(), getTopics()]).then(([pList, tList]) => {
      setProblems(pList);
      setTopics(tList);
    });
  }, []);

  const filtered = problems.filter((p) => {
    const matchesQuery =
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.platform.toLowerCase().includes(query.toLowerCase()) ||
      p.topic_ids.some((tid) => tid.toLowerCase().includes(query.toLowerCase()));

    const matchesDiff =
      selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;

    const matchesTopic =
      selectedTopic === 'all' || p.topic_ids.includes(selectedTopic);

    return matchesQuery && matchesDiff && matchesTopic;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
            Problem <em className="italic text-accent">Library & Search</em>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1">
            Browse, search, and review all tracked problems in your local database.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => onLogProblem()}
          className="shadow-glow"
        >
          Add problem
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-fg-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems, topics, platforms..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border text-xs font-mono text-fg placeholder:text-fg-faint focus-visible:outline-accent"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs font-mono text-fg"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs font-mono text-fg"
          >
            <option value="all">All Topics</option>
            {topics.map((t) => (
              <option key={t.topic.id} value={t.topic.id}>
                {t.topic.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Problems List */}
      <Card className="p-6 bg-surface space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="font-mono text-xs text-fg uppercase font-semibold">
            Tracked Problems ({filtered.length})
          </span>
          <span className="font-mono text-xs text-fg-faint">Local-First Storage</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2 font-mono text-xs text-fg-faint">
            <p>No matching problems found.</p>
            {query && <p className="text-[10px]">Try clearing search filters.</p>}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((problem) => (
              <div
                key={problem.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-ui text-sm font-medium text-fg group-hover:text-accent transition-colors">
                      {problem.title}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        problem.difficulty === 'easy'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : problem.difficulty === 'medium'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                    <span className="font-mono text-[10px] text-fg-faint">
                      • {problem.platform}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-fg-muted mt-1">
                    Topics: {problem.topic_ids.join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {problem.link && (
                    <a
                      href={problem.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded hover:bg-surface-2 text-fg-faint hover:text-fg"
                      title="Open external problem link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onLogProblem(problem.title, problem.topic_ids[0])}
                    className="text-xs text-accent"
                  >
                    Log attempt →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
