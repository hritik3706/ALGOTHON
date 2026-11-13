import { FC, useState, useEffect, useRef } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import { NumberedSelect } from '../../components/common/NumberedSelect';
import { Timer } from '../../components/common/Timer';
import { useToast } from '../../components/common/Toast';
import {
  logAttempt,
  getTopics,
  getProblems,
  TopicSummary,
  Problem,
  ProblemDifficulty,
  AttemptStatus,
  MistakeTag,
} from '../../api';
import { Check, Search, ExternalLink, X } from 'lucide-react';

interface LogScreenProps {
  initialTitle?: string;
  initialTopicId?: string;
  onSuccess: () => void;
}

export const LogScreen: FC<LogScreenProps> = ({
  initialTitle = '',
  initialTopicId,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);

  // Selected existing problem ID (if picked from dropdown)
  const [selectedProblemId, setSelectedProblemId] = useState<string | undefined>();

  // Form State
  const [title, setTitle] = useState(initialTitle);
  const [platform, setPlatform] = useState('LeetCode');
  const [link, setLink] = useState('');
  const [difficulty, setDifficulty] = useState<ProblemDifficulty>('medium');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    initialTopicId ? [initialTopicId] : ['arrays']
  );
  const [status, setStatus] = useState<AttemptStatus>('solved');
  const [timeTaken, setTimeTaken] = useState<number>(15);
  const [mistakeTag, setMistakeTag] = useState<MistakeTag>('none');
  const [recallQuality, setRecallQuality] = useState<number>(4);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Autocomplete dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getTopics(), getProblems()]).then(([tList, pList]) => {
      setTopics(tList);
      setAllProblems(pList);

      // If initialTitle was provided, auto-link to matching problem if exists
      if (initialTitle) {
        const match = pList.find(
          (p) => p.title.toLowerCase() === initialTitle.toLowerCase()
        );
        if (match) {
          selectProblem(match);
        }
      }
    });
  }, [initialTitle]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching problems as user types
  const query = title.trim().toLowerCase();
  const matchingProblems = query
    ? allProblems.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.platform.toLowerCase().includes(query) ||
          p.topic_ids.some((tid) => tid.toLowerCase().includes(query))
      )
    : allProblems.slice(0, 8); // show popular/recent when focused with empty query

  const selectProblem = (problem: Problem) => {
    setSelectedProblemId(problem.id);
    setTitle(problem.title);
    setPlatform(problem.platform);
    setDifficulty(problem.difficulty);
    if (problem.topic_ids && problem.topic_ids.length > 0) {
      setSelectedTopics(problem.topic_ids);
    }
    if (problem.link) {
      setLink(problem.link);
    }
    setIsDropdownOpen(false);
  };

  const handleUnlink = () => {
    setSelectedProblemId(undefined);
  };

  const handleLinkChange = (val: string) => {
    setLink(val);
    const trimmed = val.trim();
    if (trimmed.includes('leetcode.com/problems/')) {
      const match = trimmed.match(/leetcode\.com\/problems\/([^/?#]+)/i);
      if (match && match[1]) {
        const slug = match[1].replace(/-/g, ' ');
        const formattedTitle = slug
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        if (!title) {
          setTitle(formattedTitle);
          setPlatform('LeetCode');
        }
      }
    } else if (trimmed.includes('codeforces.com/')) {
      if (!title) setPlatform('Codeforces');
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsDropdownOpen(true);
      return;
    }

    if (isDropdownOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < matchingProblems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : matchingProblems.length - 1
        );
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        if (matchingProblems[highlightedIndex]) {
          selectProblem(matchingProblems[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }
  };

  // Sync default recall quality when status changes
  const handleStatusChange = (newStatus: AttemptStatus) => {
    setStatus(newStatus);
    if (newStatus === 'solved') {
      setRecallQuality(4);
      setMistakeTag('none');
    } else if (newStatus === 'hint') {
      setRecallQuality(3);
    } else {
      setRecallQuality(1);
    }
  };

  const toggleTopic = (id: string) => {
    if (selectedTopics.includes(id)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter((t) => t !== id));
      }
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Problem title is required (e.g. Two Sum).';
    }
    if (selectedTopics.length === 0) {
      newErrors.topics = 'Select at least one topic for this problem.';
    }
    if (timeTaken <= 0) {
      newErrors.timeTaken = 'Time taken must be at least 1 minute.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await logAttempt({
        problem_id: selectedProblemId,
        title: title.trim(),
        platform,
        link: link.trim(),
        difficulty,
        topic_ids: selectedTopics,
        status,
        time_taken: Number(timeTaken),
        mistake_tag: mistakeTag,
        recall_quality: Number(recallQuality),
        notes: notes.trim() || undefined,
      });

      showToast('Attempt logged');
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Error logging attempt. Please retry.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-3xl sm:text-4xl text-fg font-normal tracking-tight">
          Log an <em className="italic text-accent">Attempt</em>
        </h1>
        <p className="font-mono text-xs text-fg-muted mt-1">
          Type a problem name to select existing problems or record a new one. Takes under 20 seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 bg-surface space-y-5">
          {/* Autocomplete Problem Title Field */}
          <div ref={dropdownRef} className="relative">
            <FormField
              label="Problem Title"
              required
              hint={selectedProblemId ? 'Linked to existing problem' : 'Type to search or enter new'}
              error={errors.title}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Two Sum, Valid Anagram, Word Break..."
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSelectedProblemId(undefined);
                    setIsDropdownOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="w-full px-3.5 py-2.5 pr-10 rounded-card bg-surface-2 border border-border text-fg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
              </div>

              {/* Linked badge indicator */}
              {selectedProblemId && (
                <div className="flex items-center justify-between mt-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-xs font-mono text-accent">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Existing problem linked • Attempt will update SM-2 schedule
                  </span>
                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="text-fg-faint hover:text-fg text-[11px] underline flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> Unlink
                  </button>
                </div>
              )}

              {/* Autocomplete Dropdown List */}
              {isDropdownOpen && matchingProblems.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 rounded-card bg-surface-2 border border-border shadow-2xl backdrop-blur-xl max-h-64 overflow-y-auto divide-y divide-border/30">
                  <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-fg-faint flex justify-between">
                    <span>Matching Problems ({matchingProblems.length})</span>
                    <span>Click or press Enter</span>
                  </div>

                  {matchingProblems.map((p, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    const diffColor =
                      p.difficulty === 'easy'
                        ? 'text-accent bg-accent/10 border-accent/30'
                        : p.difficulty === 'hard'
                        ? 'text-danger bg-danger/10 border-danger/30'
                        : 'text-fg-muted bg-surface border-border';

                    return (
                      <div
                        key={p.id}
                        onMouseDown={() => selectProblem(p)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                          isHighlighted
                            ? 'bg-accent/15 text-fg'
                            : 'hover:bg-white/[0.04] text-fg-muted'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-ui text-sm font-medium text-fg truncate">
                            {p.title}
                          </div>
                          <div className="font-mono text-[11px] text-fg-faint flex items-center gap-2 mt-0.5 truncate">
                            <span>{p.platform}</span>
                            <span>•</span>
                            <span>{p.topic_ids.join(', ')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffColor}`}
                          >
                            {p.difficulty}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </FormField>
          </div>

          {/* Platform & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Platform">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2.5 rounded-card bg-surface-2 border border-border text-fg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="LeetCode">LeetCode</option>
                <option value="NeetCode">NeetCode</option>
                <option value="Codeforces">Codeforces</option>
                <option value="GeeksforGeeks">GeeksforGeeks</option>
                <option value="Other">Other</option>
              </select>
            </FormField>

            <FormField label="Difficulty">
              <SegmentedControl
                options={[
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Hard' },
                ]}
                value={difficulty}
                onChange={setDifficulty}
              />
            </FormField>
          </div>

          {/* Problem Link & Time Taken */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Problem URL (Optional)" hint="Auto-fills platform & title slug">
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://leetcode.com/problems/..."
                    value={link}
                    onChange={(e) => handleLinkChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-card bg-surface-2 border border-border text-fg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent pr-8"
                  />
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-accent"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </FormField>
            </div>

            <div>
              <FormField label="Time (Minutes)" error={errors.timeTaken}>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={timeTaken}
                    onChange={(e) => setTimeTaken(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-card bg-surface-2 border border-border text-fg text-sm font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  />
                  <Timer onTimeChange={(m) => setTimeTaken(m)} />
                </div>
              </FormField>
            </div>
          </div>

          {/* Topic Assignment (Pills) */}
          <FormField
            label="Topics Assigned"
            required
            hint="Click to toggle"
            error={errors.topics}
          >
            <div className="flex flex-wrap gap-2 pt-1">
              {topics.map((t) => {
                const isSelected = selectedTopics.includes(t.topic.id);
                return (
                  <button
                    key={t.topic.id}
                    type="button"
                    onClick={() => toggleTopic(t.topic.id)}
                    className={`font-mono text-xs px-3 py-1 rounded-pill transition-all ${
                      isSelected
                        ? 'bg-accent text-accent-ink font-semibold'
                        : 'bg-surface-2 text-fg-muted border border-border hover:border-white/20'
                    }`}
                  >
                    {t.topic.name}
                  </button>
                );
              })}
            </div>
          </FormField>
        </Card>

        {/* Attempt Performance & SM-2 Feedback */}
        <Card className="p-6 bg-surface space-y-5">
          <div className="font-mono text-xs text-accent uppercase tracking-wider font-semibold">
            Attempt Performance
          </div>

          {/* Status Segmented Control */}
          <FormField label="Attempt Result Status">
            <SegmentedControl
              options={[
                { value: 'solved', label: 'Solved Clean' },
                { value: 'hint', label: 'With Hint' },
                { value: 'failed', label: 'Failed' },
              ]}
              value={status}
              onChange={handleStatusChange}
            />
          </FormField>

          {/* Numbered Mistake Tag Enum (1-7) */}
          <FormField label="Mistake Tag" hint="Keys 1–7 to pick">
            <NumberedSelect value={mistakeTag} onChange={setMistakeTag} />
          </FormField>

          {/* Recall Quality (0-5) */}
          <FormField
            label={`Recall Quality: ${recallQuality} / 5`}
            hint={
              recallQuality >= 4
                ? 'Interval stretches'
                : recallQuality === 3
                ? 'Repeats interval'
                : 'Resets to 1 day'
            }
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={recallQuality}
                onChange={(e) => setRecallQuality(parseInt(e.target.value, 10))}
                className="w-full accent-accent h-2 bg-surface-2 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-sm text-accent font-bold w-6 text-center">
                {recallQuality}
              </span>
            </div>
          </FormField>

          {/* Notes */}
          <FormField label="Notes & Takeaways (Optional)">
            <textarea
              rows={2}
              placeholder="e.g. remember two-pointer shrink condition, beware off-by-one indices"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-card bg-surface-2 border border-border text-fg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent resize-none"
            />
          </FormField>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="px-8 shadow-glow"
          >
            {isSubmitting ? 'Saving...' : 'Log attempt'}
          </Button>
        </div>
      </form>
    </div>
  );
};
