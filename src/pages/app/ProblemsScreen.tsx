import { FC, useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import {
  getProblemCatalog,
  getTopics,
  importCuratedList,
  TopicSummary,
  Problem,
  ProblemDifficulty,
} from '../../api';
import { matchProblemQuery } from '../../data/curatedProblems';
import {
  Search,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Shuffle,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface CatalogItem {
  problem: Problem;
  attemptsCount: number;
  solvedCount: number;
  status: 'solved' | 'attempted' | 'unsolved';
  lastAttemptDate?: string;
  nextDueDate?: string;
  isTracked: boolean;
}

type ListTagFilter = 'all' | 'blind75' | 'neetcode150' | 'neetcode250' | 'tracked';

interface ProblemsScreenProps {
  onLogProblem: (
    title?: string,
    topicId?: string,
    link?: string,
    difficulty?: ProblemDifficulty
  ) => void;
}

export const ProblemsScreen: FC<ProblemsScreenProps> = ({ onLogProblem }) => {
  const { showToast } = useToast();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedList, setSelectedList] = useState<ListTagFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const reloadData = async () => {
    setIsLoading(true);
    try {
      const [items, tList] = await Promise.all([
        getProblemCatalog({ listTag: selectedList }),
        getTopics(),
      ]);
      setCatalogItems(items);
      setTopics(tList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
    setCurrentPage(1);
  }, [selectedList]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedDifficulty, selectedTopic, selectedStatus, pageSize]);

  // Derived filtered problems
  const filtered = useMemo(() => {
    return catalogItems.filter((item) => {
      const p = item.problem;

      // Multi-token, ID, and category fuzzy matching
      const matchesQuery = matchProblemQuery(p, query);

      // Difficulty match
      const matchesDiff =
        selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;

      // Topic match
      const matchesTopic =
        selectedTopic === 'all' || p.topic_ids.includes(selectedTopic);

      // Status match
      const matchesStatus =
        selectedStatus === 'all' || item.status === selectedStatus;

      return matchesQuery && matchesDiff && matchesTopic && matchesStatus;
    });
  }, [catalogItems, query, selectedDifficulty, selectedTopic, selectedStatus]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Statistics for current collection
  const stats = useMemo(() => {
    const total = catalogItems.length;
    const solved = catalogItems.filter((i) => i.status === 'solved').length;
    const attempted = catalogItems.filter((i) => i.status === 'attempted').length;
    const easy = catalogItems.filter((i) => i.problem.difficulty === 'easy').length;
    const medium = catalogItems.filter((i) => i.problem.difficulty === 'medium').length;
    const hard = catalogItems.filter((i) => i.problem.difficulty === 'hard').length;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { total, solved, attempted, easy, medium, hard, pct };
  }, [catalogItems]);

  const handleImportCurated = async () => {
    if (selectedList === 'tracked') return;
    setIsImporting(true);
    try {
      const res = await importCuratedList(
        selectedList === 'all' ? 'neetcode250' : selectedList
      );
      showToast(
        `Added ${res.imported} new problems to your practice library (${res.existing} were already tracked).`,
        'success'
      );
      await reloadData();
    } catch {
      showToast('Unable to import problems. Please try again.', 'danger');
    } finally {
      setIsImporting(false);
    }
  };

  const handlePickRandomUnsolved = () => {
    const unsolved = filtered.filter((i) => i.status !== 'solved');
    if (unsolved.length === 0) {
      showToast('You have solved all problems matching the current filters!', 'info');
      return;
    }
    const pick = unsolved[Math.floor(Math.random() * unsolved.length)];
    if (pick.problem.link) {
      window.open(pick.problem.link, '_blank', 'noopener,noreferrer');
    }
    onLogProblem(
      pick.problem.title,
      pick.problem.topic_ids[0],
      pick.problem.link,
      pick.problem.difficulty
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
              LeetCode Problemset • 4,115 Questions
            </span>
            <span className="font-mono text-xs text-fg-faint">• Direct LeetCode Links</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-fg font-normal tracking-tight">
            Problem <em className="italic text-accent">Library & Curated Sets</em>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1 max-w-2xl">
            Complete database of 4,115 LeetCode problems including Blind 75, NeetCode 150, and NeetCode 250.
            Click any problem to practice directly on LeetCode, then log your attempt for automated SM-2 spaced repetition.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            icon={<Shuffle className="w-4 h-4 text-accent" />}
            onClick={handlePickRandomUnsolved}
            title="Pick a random unsolved problem from current view"
            className="border border-border text-xs"
          >
            Random Unsolved
          </Button>
          <Button
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => onLogProblem()}
            className="shadow-glow text-xs"
          >
            Add problem
          </Button>
        </div>
      </div>

      {/* Curated List Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/60">
        {[
          { id: 'all', label: 'All LeetCode', badge: '4,115' },
          { id: 'blind75', label: 'Blind 75', badge: '75' },
          { id: 'neetcode150', label: 'NeetCode 150', badge: '150' },
          { id: 'neetcode250', label: 'NeetCode 250', badge: '250' },
          { id: 'tracked', label: 'My Tracked', badge: 'Active' },
        ].map((tab) => {
          const isActive = selectedList === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedList(tab.id as ListTagFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-accent text-accent-ink shadow-sm'
                  : 'bg-surface text-fg-muted hover:text-fg hover:bg-surface-2 border border-border/50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  isActive
                    ? 'bg-black/20 text-accent-ink'
                    : 'bg-surface-2 text-fg-faint'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}

        {selectedList !== 'tracked' && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleImportCurated}
              disabled={isImporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface hover:bg-surface-2 text-fg-muted hover:text-accent border border-border text-xs font-mono transition-colors disabled:opacity-50"
              title="Import all problems from this list into your local tracking database"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isImporting ? 'Importing...' : 'Import to My Library'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress & Quick Metrics Card */}
      <Card className="p-5 bg-surface border-border grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase text-fg-muted font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              {selectedList === 'all'
                ? 'All LeetCode Database'
                : selectedList === 'blind75'
                ? 'Blind 75 Progress'
                : selectedList === 'neetcode150'
                ? 'NeetCode 150 Progress'
                : selectedList === 'neetcode250'
                ? 'NeetCode 250 Progress'
                : 'Tracked Practice Progress'}
            </span>
            <span className="font-mono text-xs font-bold text-accent">
              {stats.solved} / {stats.total.toLocaleString()} Solved ({stats.pct}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border/40">
            <div
              className="h-full bg-accent transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, stats.pct)}%` }}
            />
          </div>
        </div>

        <div className="md:col-span-7 grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-border md:pl-6 text-center">
          <div className="bg-surface-2/60 rounded p-2">
            <span className="block font-mono text-[10px] text-fg-faint uppercase">Easy</span>
            <span className="font-mono text-sm font-bold text-emerald-400">
              {stats.easy.toLocaleString()}
            </span>
          </div>
          <div className="bg-surface-2/60 rounded p-2">
            <span className="block font-mono text-[10px] text-fg-faint uppercase">Medium</span>
            <span className="font-mono text-sm font-bold text-amber-400">
              {stats.medium.toLocaleString()}
            </span>
          </div>
          <div className="bg-surface-2/60 rounded p-2">
            <span className="block font-mono text-[10px] text-fg-faint uppercase">Hard</span>
            <span className="font-mono text-sm font-bold text-rose-400">
              {stats.hard.toLocaleString()}
            </span>
          </div>
          <div className="hidden sm:block bg-surface-2/60 rounded p-2">
            <span className="block font-mono text-[10px] text-fg-faint uppercase">Attempted</span>
            <span className="font-mono text-sm font-bold text-fg">
              {stats.attempted.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Search and Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 text-fg-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search #ID, title, slug, topic..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border text-xs font-mono text-fg placeholder:text-fg-faint focus-visible:outline-accent"
          />
        </div>

        {/* Difficulty */}
        <div className="sm:col-span-2">
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

        {/* Topic */}
        <div className="sm:col-span-3">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs font-mono text-fg"
          >
            <option value="all">All Topics ({topics.length})</option>
            {topics.map((t) => (
              <option key={t.topic.id} value={t.topic.id}>
                {t.topic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="sm:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs font-mono text-fg"
          >
            <option value="all">All Status</option>
            <option value="solved">🟢 Solved Only</option>
            <option value="attempted">🟡 Attempted (Unsolved)</option>
            <option value="unsolved">⚪ Unsolved / New</option>
          </select>
        </div>
      </div>

      {/* Problem Items List */}
      <Card className="p-6 bg-surface space-y-4">
        {/* Header & Pagination Top Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-fg uppercase font-semibold">
              {filtered.length.toLocaleString()} Problems Found
            </span>
            {filtered.length > 0 && (
              <span className="font-mono text-[11px] text-fg-faint">
                (Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filtered.length)})
              </span>
            )}
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-xs text-fg-muted">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-surface-2 border border-border rounded px-2 py-1 text-xs font-mono text-fg"
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-2 font-mono text-xs text-fg-muted">
            <Clock className="w-5 h-5 mx-auto text-accent animate-spin" />
            <p>Loading LeetCode problem catalog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2 font-mono text-xs text-fg-faint">
            <p>No matching problems found.</p>
            {(query ||
              selectedDifficulty !== 'all' ||
              selectedTopic !== 'all' ||
              selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedDifficulty('all');
                  setSelectedTopic('all');
                  setSelectedStatus('all');
                }}
                className="text-accent underline text-[11px] hover:text-accent-hover mt-1"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {paginatedItems.map((item) => {
              const p = item.problem;
              return (
                <div
                  key={p.id}
                  className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-surface-2/30 px-2 -mx-2 rounded transition-colors"
                >
                  {/* Left: Problem Title, ID, Difficulty, Tags */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* LeetCode Number */}
                      {p.leetcode_id && (
                        <span className="font-mono text-xs text-fg-faint font-semibold">
                          #{p.leetcode_id}
                        </span>
                      )}

                      {/* Title with LeetCode Link */}
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-ui text-sm font-semibold text-fg group-hover:text-accent transition-colors hover:underline inline-flex items-center gap-1.5"
                        title={`Open ${p.title} on LeetCode`}
                      >
                        <span>{p.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-fg-faint opacity-60 group-hover:opacity-100 group-hover:text-accent" />
                      </a>

                      {/* Difficulty Chip */}
                      <span
                        className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          p.difficulty === 'easy'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : p.difficulty === 'medium'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {p.difficulty}
                      </span>

                      {/* Solve Status Badge */}
                      {item.status === 'solved' ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Solved ({item.solvedCount}x)
                        </span>
                      ) : item.status === 'attempted' ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-semibold">
                          <Clock className="w-3 h-3" /> Attempted ({item.attemptsCount}x)
                        </span>
                      ) : null}

                      {/* Tracked Indicator */}
                      {item.isTracked && (
                        <span
                          className="font-mono text-[10px] text-fg-faint bg-surface-2 px-1.5 py-0.2 rounded flex items-center gap-0.5"
                          title="Problem is in your local practice library"
                        >
                          <BookmarkCheck className="w-2.5 h-2.5 text-accent" /> Tracked
                        </span>
                      )}
                    </div>

                    {/* Metadata: Category, Topics, Curated Tags */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-fg-muted">
                      {p.category && (
                        <span className="text-accent/90 font-medium">
                          {p.category}
                        </span>
                      )}
                      {p.category && <span className="text-fg-faint">•</span>}
                      <span>Topics: {p.topic_ids.join(', ')}</span>

                      {/* Curated list badges */}
                      {p.list_tags && p.list_tags.length > 0 && (
                        <div className="flex items-center gap-1 ml-1">
                          {p.list_tags.map((lt) => (
                            <span
                              key={lt}
                              className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-surface-2 text-fg-faint border border-border/40"
                            >
                              {lt === 'blind75'
                                ? 'Blind 75'
                                : lt === 'neetcode150'
                                ? 'NeetCode 150'
                                : 'NeetCode 250'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Direct LeetCode & Log Attempt */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Direct LeetCode Button */}
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-2 text-xs font-mono text-fg-muted hover:text-accent transition-colors"
                      title="Open problem directly on LeetCode"
                    >
                      <span className="text-amber-500 font-bold">LC</span>
                      <span>LeetCode</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Log Attempt Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onLogProblem(
                          p.title,
                          p.topic_ids[0],
                          p.link,
                          p.difficulty
                        )
                      }
                      className="text-xs text-accent hover:bg-accent/10 border border-accent/20"
                    >
                      Log attempt →
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bottom Bar */}
        {filtered.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
            <span className="font-mono text-xs text-fg-muted">
              Page <strong className="text-fg">{currentPage}</strong> of{' '}
              <strong className="text-fg">{totalPages.toLocaleString()}</strong> ({filtered.length.toLocaleString()} total)
            </span>

            <div className="flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-surface border border-border text-fg-muted hover:text-fg disabled:opacity-40"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-surface border border-border text-fg-muted hover:text-fg disabled:opacity-40"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 rounded bg-surface-2 border border-border text-xs text-fg font-bold">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-surface border border-border text-fg-muted hover:text-fg disabled:opacity-40"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-surface border border-border text-fg-muted hover:text-fg disabled:opacity-40"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
