import { FC, useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Pill } from '../../components/common/Pill';
import { Button } from '../../components/common/Button';
import { getTopics, getTopicPath, TopicSummary, Topic } from '../../api';
import { Search, Lock, Unlock, ArrowRight, AlertTriangle } from 'lucide-react';

interface TopicsScreenProps {
  onLogTopic?: (topicId: string) => void;
}

export const TopicsScreen: FC<TopicsScreenProps> = ({ onLogTopic }) => {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('dp');
  const [prereqPath, setPrereqPath] = useState<{ path: Topic[]; is_unlocked: boolean } | null>(null);

  useEffect(() => {
    getTopics().then((res) => {
      setTopics(res);
      if (res.length > 0) {
        handleSearchPrereqs('dp');
      }
    });
  }, []);

  const handleSearchPrereqs = async (topicId: string) => {
    setSelectedTopicId(topicId);
    const result = await getTopicPath(topicId);
    setPrereqPath(result);
  };

  const getTrendBadge = (trend: TopicSummary['trend']) => {
    switch (trend) {
      case 'improving':
        return <span className="font-mono text-[10px] text-accent">↑ Improving</span>;
      case 'regressing':
        return <span className="font-mono text-[10px] text-danger">↓ Regressing</span>;
      case 'flat':
        return <span className="font-mono text-[10px] text-fg-muted">→ Flat</span>;
      default:
        return <span className="font-mono text-[10px] text-fg-faint">• New</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
            Topic <em className="italic text-accent">Mastery & Prerequisites</em>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1">
            Topics unlock only when every prerequisite achieves ≥5 attempts and ≥60% success rate.
          </p>
        </div>
      </div>

      {/* Prerequisite Path Query: "What do I need before X?" */}
      <Card className="p-6 bg-surface-2/40 border-accent/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-accent" />
            <span className="font-ui text-sm font-semibold text-fg">
              Prerequisite Explorer: "What do I need before...?"
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTopicId}
              onChange={(e) => handleSearchPrereqs(e.target.value)}
              className="px-3 py-1.5 rounded-card bg-surface border border-border text-xs font-mono text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {topics.map((t) => (
                <option key={t.topic.id} value={t.topic.id}>
                  {t.topic.name} {t.is_unlocked ? '(Unlocked)' : '(Locked)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chain visualization */}
        {prereqPath && (
          <div className="p-4 rounded-xl bg-surface border border-border/80">
            {prereqPath.is_unlocked ? (
              <div className="flex items-center gap-2 text-accent font-mono text-xs">
                <Unlock className="w-4 h-4 shrink-0" />
                <span>
                  All prerequisites for{' '}
                  <strong className="text-fg">
                    {topics.find((t) => t.topic.id === selectedTopicId)?.topic.name}
                  </strong>{' '}
                  are satisfied! Topic is fully unlocked.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-danger font-mono text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Locked prerequisite chain for{' '}
                    <strong className="text-fg">
                      {topics.find((t) => t.topic.id === selectedTopicId)?.topic.name}
                    </strong>
                    :
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {prereqPath.path.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-pill bg-danger/10 border border-danger/30 text-danger font-mono text-xs">
                        {item.name}
                      </span>
                      {idx < prereqPath.path.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-fg-faint" />
                      )}
                    </div>
                  ))}
                  <ArrowRight className="w-3.5 h-3.5 text-fg-faint" />
                  <span className="px-3 py-1 rounded-pill bg-surface-2 border border-border text-fg-muted font-mono text-xs">
                    {topics.find((t) => t.topic.id === selectedTopicId)?.topic.name} (Goal)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Topics Table List */}
      <div className="space-y-3">
        <div className="grid grid-cols-12 px-4 font-mono text-[11px] text-fg-faint uppercase tracking-wider">
          <div className="col-span-4">Topic & Dependencies</div>
          <div className="col-span-2 text-center">Strength (Wilson)</div>
          <div className="col-span-2 text-center">Attempts & Success</div>
          <div className="col-span-2 text-center">Top Mistake</div>
          <div className="col-span-2 text-right">Status / Action</div>
        </div>

        {topics.map((ts) => (
          <Card
            key={ts.topic.id}
            className={`p-4 transition-colors ${
              ts.is_unlocked ? 'bg-surface hover:bg-surface-2/60' : 'bg-surface/40 border-border/40'
            }`}
          >
            <div className="grid grid-cols-12 items-center gap-2">
              {/* Col 1: Topic Name & Prereqs */}
              <div className="col-span-4 space-y-1">
                <div className="flex items-center gap-2">
                  {ts.is_unlocked ? (
                    <Unlock className="w-3.5 h-3.5 text-accent shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-danger shrink-0" />
                  )}
                  <span className="font-ui text-sm font-semibold text-fg">
                    {ts.topic.name}
                  </span>
                </div>

                {!ts.is_unlocked && ts.weakest_prerequisite && (
                  <div className="font-mono text-[11px] text-danger flex items-center gap-1">
                    Needs: {ts.weakest_prerequisite.name} ({ts.weakest_prerequisite.attempts}/5 att,{' '}
                    {Math.round(ts.weakest_prerequisite.success_rate * 100)}%)
                  </div>
                )}
                {ts.topic.prerequisites.length > 0 && ts.is_unlocked && (
                  <div className="font-mono text-[10px] text-fg-faint">
                    Prereqs: {ts.topic.prerequisites.join(', ')}
                  </div>
                )}
              </div>

              {/* Col 2: Strength (Wilson Lower Bound Score) */}
              <div className="col-span-2 text-center">
                <div className="font-display text-2xl text-fg leading-none">
                  {ts.strength}
                  <span className="font-display text-sm text-fg-faint">/100</span>
                </div>
                <div className="mt-1">{getTrendBadge(ts.trend)}</div>
              </div>

              {/* Col 3: Attempts & Success Rate */}
              <div className="col-span-2 text-center font-mono">
                <div className="text-xs text-fg font-medium">
                  {Math.round(ts.success_rate * 100)}%
                </div>
                <div className="text-[10px] text-fg-faint">
                  {ts.attempts} {ts.attempts === 1 ? 'attempt' : 'attempts'}
                </div>
              </div>

              {/* Col 4: Top Mistake Tag */}
              <div className="col-span-2 text-center font-mono text-xs">
                {ts.top_mistake ? (
                  <span className="px-2 py-0.5 rounded bg-surface-2 text-fg-muted border border-border">
                    {ts.top_mistake}
                  </span>
                ) : (
                  <span className="text-fg-faint text-[11px]">None logged</span>
                )}
              </div>

              {/* Col 5: Status Pill & Action */}
              <div className="col-span-2 text-right flex items-center justify-end gap-2">
                {ts.is_unlocked ? (
                  <Pill variant="due" size="sm">Unlocked</Pill>
                ) : (
                  <Pill variant="failed" size="sm">Locked</Pill>
                )}
                {onLogTopic && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onLogTopic(ts.topic.id)}
                    className="text-xs"
                  >
                    +
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

