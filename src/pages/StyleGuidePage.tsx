import React, { useState } from 'react';
import { LogoMark } from '../components/brand/LogoMark';
import { Button } from '../components/common/Button';
import { Pill } from '../components/common/Pill';
import { Card } from '../components/common/Card';
import { StatBlock } from '../components/common/StatBlock';
import { SegmentedControl } from '../components/common/SegmentedControl';
import { FormField } from '../components/common/FormField';
import { NumberedSelect } from '../components/common/NumberedSelect';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import { MistakeTag } from '../types';

export const StyleGuidePage: React.FC = () => {
  const { showToast } = useToast();
  const [attemptStatus, setAttemptStatus] = useState<'solved' | 'hint' | 'failed'>('solved');
  const [mistakeTag, setMistakeTag] = useState<MistakeTag>('off_by_one');
  const [formText, setFormText] = useState('Two Sum');

  return (
    <div className="min-h-screen bg-bg text-fg p-6 md:p-12 max-w-6xl mx-auto space-y-12">
      {/* Brand Header */}
      <div className="border-b border-border pb-6 flex flex-wrap items-center justify-between gap-4">
        <LogoMark showWordmark={true} size={32} />
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs px-3 py-1 rounded-pill bg-surface-2 text-accent border border-accent/30">
            Step 1B Checkpoint: Primitive Components
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => showToast('Attempt logged')}
          >
            Trigger Toast
          </Button>
        </div>
      </div>

      {/* 01. Buttons */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fg-faint">
          01. Buttons (Pill shape, radius 999px)
        </h2>
        <Card className="p-6 flex flex-wrap items-center gap-4">
          <Button variant="primary" onClick={() => showToast('Attempt logged')}>
            Primary action (Start tracking)
          </Button>
          <Button variant="secondary" onClick={() => showToast('Plan generated')}>
            Secondary (See today's plan)
          </Button>
          <Button variant="ghost">Ghost (Docs)</Button>
          <Button variant="danger">Danger (Reset)</Button>
          <Button variant="primary" disabled>
            Disabled state
          </Button>
        </Card>
      </section>

      {/* 02. Status Pills */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fg-faint">
          02. Status Pills (Outline due, solid solved, muted grey, red leech)
        </h2>
        <Card className="p-6 flex flex-wrap items-center gap-3">
          <Pill variant="due" dot>
            Due today
          </Pill>
          <Pill variant="solved">Solved (Clean)</Pill>
          <Pill variant="neutral">Upcoming</Pill>
          <Pill variant="draft">Draft</Pill>
          <Pill variant="failed">Failed attempt</Pill>
          <Pill variant="leech" dot>
            Leech (3 fails)
          </Pill>
          <Pill variant="new" dot>
            New topic
          </Pill>
        </Card>
      </section>

      {/* 03. Stat Blocks */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fg-faint">
          03. StatBlocks (Display Serif + JetBrains Mono Caption)
        </h2>
        <Card className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <StatBlock value="12" label="Problems Logged" />
          <StatBlock value="3" label="Topics Unlocked" />
          <StatBlock value="7" suffix="d" label="Current Streak" trend="+2 from last week" />
          <StatBlock value="5" label="Revisions Due Today" />
        </Card>
      </section>

      {/* 04. Segmented Control */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fg-faint">
          04. Segmented Control (Solved / Hint / Failed)
        </h2>
        <Card className="p-6 flex flex-wrap items-center gap-6">
          <SegmentedControl
            options={[
              { value: 'solved', label: 'Solved Clean' },
              { value: 'hint', label: 'With Hint' },
              { value: 'failed', label: 'Failed' },
            ]}
            value={attemptStatus}
            onChange={setAttemptStatus}
          />
          <span className="font-mono text-xs text-fg-muted">
            Selected status: <strong className="text-accent">{attemptStatus}</strong>
          </span>
        </Card>
      </section>

      {/* 05. Numbered Select (Mistake Tag Enum) */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fg-faint">
          05. Numbered Select (7-Option Enum with 1-7 keys)
        </h2>
        <Card className="p-6 space-y-3">
          <FormField label="Mistake Pattern Tag" hint="Press keys 1-7">
            <NumberedSelect value={mistakeTag} onChange={setMistakeTag} />
          </FormField>
          <p className="font-mono text-xs text-fg-faint">
            Current enum value: <span className="text-accent">{mistakeTag}</span>
          </p>
        </Card>
      </section>

      {/* 06. Form Field */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fg-faint">
          06. FormField (Accessible Label, Input, Error)
        </h2>
        <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Problem Title" required hint="e.g. Two Sum">
            <input
              type="text"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-card bg-surface-2 border border-border text-fg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </FormField>
          <FormField
            label="Problem Link"
            error="Please enter a valid URL starting with https://"
          >
            <input
              type="text"
              defaultValue="leetcode.com/two-sum"
              className="w-full px-3.5 py-2.5 rounded-card bg-surface-2 border border-danger/50 text-fg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger"
            />
          </FormField>
        </Card>
      </section>

      {/* 07. Empty State */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fg-faint">
          07. EmptyState (Action-oriented microcopy)
        </h2>
        <EmptyState
          title="No revisions due today"
          description="You are all caught up! Log a new problem to expand your learning frontier or strengthen prerequisite chains."
          actionLabel="Log attempt"
          onAction={() => showToast('Attempt logged')}
        />
      </section>
    </div>
  );
};
