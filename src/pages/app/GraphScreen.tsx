import { FC, useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Pill } from '../../components/common/Pill';
import { Button } from '../../components/common/Button';
import { getTopics, getGraphLayout, TopicSummary, GraphLayoutResult } from '../../api';
import { Lock, Unlock, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TreeNode {
  id: string;
  name: string;
  x: number; // center x
  y: number; // center y
  width: number;
  height: number;
  parentIds: string[];
  summary: TopicSummary;
}

export const GraphScreen: FC<{ onLogTopic?: (topicId: string) => void }> = ({
  onLogTopic,
}) => {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [layout, setLayout] = useState<GraphLayoutResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  useEffect(() => {
    Promise.all([getTopics(), getGraphLayout()]).then(([resTopics, resLayout]) => {
      setTopics(resTopics);
      setLayout(resLayout);
    });
  }, []);

  const svgWidth = layout?.width || 860;
  const svgHeight = layout?.height || 580;

  const topicMap = new Map(topics.map((t) => [t.topic.id, t]));

  const nodes: TreeNode[] = (layout?.nodes || []).map((info) => {
    const summary = topicMap.get(info.id) || {
      topic: { id: info.id, name: info.name, prerequisites: info.parentIds, importance_weight: 4 },
      strength: 0,
      attempts: 0,
      success_rate: 0,
      is_unlocked: info.parentIds.length === 0,
      trend: 'insufficient_data' as const,
    };

    return {
      id: info.id,
      name: summary.topic.name,
      x: info.x,
      y: info.y,
      width: info.width,
      height: info.height,
      parentIds: info.parentIds,
      summary,
    };
  });

  const nodeLookup = new Map(nodes.map((n) => [n.id, n]));

  // Auto-select Graphs or first locked node to highlight inspector
  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      const target = nodes.find((n) => n.id === 'graphs') || nodes[0];
      setSelectedNode(target);
    }
  }, [nodes, selectedNode]);

  /**
   * Helper to generate smooth orthogonal elbow connector path between parent and child.
   * Path: parent bottom center -> down -> horizontal -> down into child top center.
   */
  const renderConnector = (parent: TreeNode, child: TreeNode) => {
    const startX = parent.x;
    const startY = parent.y + parent.height / 2;
    const endX = child.x;
    const endY = child.y - child.height / 2;
    const midY = startY + (endY - startY) * 0.5;

    // Corner radius for smooth rounded elbow
    const r = 8;
    const isDirectVertical = Math.abs(startX - endX) < 1;

    let pathD = '';
    if (isDirectVertical) {
      pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
    } else if (endX > startX) {
      // Branching right
      pathD = `M ${startX} ${startY}
               L ${startX} ${midY - r}
               Q ${startX} ${midY} ${startX + r} ${midY}
               L ${endX - r} ${midY}
               Q ${endX} ${midY} ${endX} ${midY + r}
               L ${endX} ${endY}`;
    } else {
      // Branching left
      pathD = `M ${startX} ${startY}
               L ${startX} ${midY - r}
               Q ${startX} ${midY} ${startX - r} ${midY}
               L ${endX + r} ${midY}
               Q ${endX} ${midY} ${endX} ${midY + r}
               L ${endX} ${endY}`;
    }

    const isUnlocked = parent.summary.is_unlocked && child.summary.is_unlocked;

    return (
      <path
        key={`${parent.id}->${child.id}`}
        d={pathD}
        fill="none"
        stroke={isUnlocked ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.18)'}
        strokeWidth={isUnlocked ? '2' : '1.5'}
        strokeDasharray={isUnlocked ? 'none' : '4 3'}
        className="transition-colors duration-300"
      />
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
            Prerequisite <em className="italic text-accent">Roadmap Graph</em>
          </h1>
          <p className="font-mono text-xs text-fg-muted mt-1">
            NeetCode-style tree roadmap. Progress bars display mastery rate; locked topics require prerequisite threshold.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-accent">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Unlocked
          </span>
          <span className="flex items-center gap-1.5 text-fg-faint">
            <span className="w-2.5 h-2.5 rounded-full bg-[#202434] border border-border" /> Locked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Tree Roadmap Canvas */}
        <Card className="lg:col-span-8 p-6 bg-[#111319] border-border overflow-x-auto relative shadow-2xl">
          <div className="min-w-[780px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none overflow-visible"
            >
              {/* 1. Render all Orthogonal Connectors */}
              <g className="connectors">
                {nodes.map((node) => {
                  return node.parentIds.map((pid) => {
                    const parent = nodeLookup.get(pid);
                    if (!parent) return null;
                    return renderConnector(parent, node);
                  });
                })}
              </g>

              {/* 2. Render Roadmap Nodes */}
              <g className="nodes">
                {nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isUnlocked = node.summary.is_unlocked;
                  const successRate = node.summary.success_rate || 0;
                  const progressWidth = Math.min(100, Math.round(successRate * 100));

                  const left = node.x - node.width / 2;
                  const top = node.y - node.height / 2;

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer group"
                    >
                      {/* Highlight aura if selected */}
                      {isSelected && (
                        <rect
                          x={left - 4}
                          y={top - 4}
                          width={node.width + 8}
                          height={node.height + 8}
                          rx={18}
                          fill="none"
                          stroke={isUnlocked ? '#C6F432' : '#E5604D'}
                          strokeWidth="2"
                          strokeDasharray="4 3"
                          className="animate-pulse"
                        />
                      )}

                      {/* Main Node Card (Slate Blue rounded rect matching reference) */}
                      <rect
                        x={left}
                        y={top}
                        width={node.width}
                        height={node.height}
                        rx={14}
                        fill={
                          isUnlocked
                            ? isSelected
                              ? '#3A426B'
                              : '#2C3454'
                            : '#191C28'
                        }
                        stroke={
                          isSelected
                            ? isUnlocked
                              ? '#C6F432'
                              : '#E5604D'
                            : isUnlocked
                            ? '#485582'
                            : 'rgba(255,255,255,0.1)'
                        }
                        strokeWidth={isSelected ? '2' : '1.2'}
                        className="transition-all duration-200 group-hover:brightness-110"
                      />

                      {/* Topic Title Text */}
                      <text
                        x={node.x}
                        y={top + 24}
                        textAnchor="middle"
                        fill={isUnlocked ? '#FFFFFF' : '#888F9E'}
                        fontSize="13"
                        fontFamily="system-ui, sans-serif"
                        fontWeight="600"
                        letterSpacing="0.01em"
                        className="select-none pointer-events-none"
                      >
                        {node.name}
                      </text>

                      {/* Lock Icon if Locked */}
                      {!isUnlocked && (
                        <g transform={`translate(${node.x + node.width / 2 - 24}, ${top + 8})`}>
                          <circle cx="8" cy="8" r="8" fill="#E5604D" opacity="0.2" />
                          <text
                            x="8"
                            y="11.5"
                            textAnchor="middle"
                            fill="#E5604D"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            🔒
                          </text>
                        </g>
                      )}

                      {/* Progress Bar Container */}
                      <g transform={`translate(${node.x - 55}, ${top + 36})`}>
                        {/* Background Track (White / Light pill track matching reference) */}
                        <rect
                          x="0"
                          y="0"
                          width="110"
                          height="5.5"
                          rx="3"
                          fill={isUnlocked ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.2)'}
                        />

                        {/* Progress Fill (Vibrant Green matching reference) */}
                        {isUnlocked && progressWidth > 0 && (
                          <rect
                            x="0"
                            y="0"
                            width={(110 * progressWidth) / 100}
                            height="5.5"
                            rx="3"
                            fill="#00E676"
                          />
                        )}
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </Card>

        {/* Selected Topic Details Panel */}
        <Card className="lg:col-span-4 p-6 bg-surface border-border space-y-6">
          {selectedNode ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-ui text-lg font-bold text-fg">
                      {selectedNode.name}
                    </span>
                    {selectedNode.summary.is_unlocked ? (
                      <Unlock className="w-4 h-4 text-accent" />
                    ) : (
                      <Lock className="w-4 h-4 text-danger" />
                    )}
                  </div>
                  <div className="font-mono text-xs text-fg-faint mt-1">
                    Importance weight: {selectedNode.summary.topic.importance_weight}/5
                  </div>
                </div>
                {selectedNode.summary.is_unlocked ? (
                  <Pill variant="due" size="sm">Unlocked</Pill>
                ) : (
                  <Pill variant="failed" size="sm">Locked</Pill>
                )}
              </div>

              {/* Progress & Wilson Strength */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/50">
                  <div className="font-mono text-[10px] text-fg-faint uppercase">
                    Wilson Strength
                  </div>
                  <div className="font-display text-2xl text-fg mt-0.5">
                    {selectedNode.summary.strength}
                    <span className="text-xs font-display text-fg-faint">/100</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/50">
                  <div className="font-mono text-[10px] text-fg-faint uppercase">
                    Success Rate
                  </div>
                  <div className="font-display text-2xl text-fg mt-0.5">
                    {Math.round(selectedNode.summary.success_rate * 100)}%
                  </div>
                </div>
              </div>

              {/* Locked Warning */}
              {!selectedNode.summary.is_unlocked && selectedNode.summary.weakest_prerequisite && (
                <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-xs font-mono text-danger space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0" /> Prerequisite Incomplete
                  </div>
                  <div>
                    Weakest: <strong className="text-fg">{selectedNode.summary.weakest_prerequisite.name}</strong>
                  </div>
                  <div className="text-[11px] opacity-80">
                    Needs ≥5 attempts (currently {selectedNode.summary.weakest_prerequisite.attempts}) & ≥60% success rate (currently {Math.round(selectedNode.summary.weakest_prerequisite.success_rate * 100)}%).
                  </div>
                </div>
              )}

              {/* Unlocked Confirmation */}
              {selectedNode.summary.is_unlocked && (
                <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/30 text-xs font-mono text-accent flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Topic is unlocked and active in Today's Plan.</span>
                </div>
              )}

              {/* Direct Prerequisites */}
              <div className="space-y-2">
                <div className="font-mono text-xs text-fg-faint uppercase tracking-wider">
                  Prerequisites
                </div>
                {selectedNode.summary.topic.prerequisites.length === 0 ? (
                  <p className="font-mono text-xs text-fg-muted">
                    Root foundation topic — no prerequisites required.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.summary.topic.prerequisites.map((pid) => (
                      <span
                        key={pid}
                        className="font-mono text-xs px-2.5 py-1 rounded-md bg-surface-2 border border-border text-fg-muted flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3 text-accent" />
                        {pid}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {onLogTopic && (
                <Button
                  variant="primary"
                  className="w-full shadow-glow"
                  onClick={() => onLogTopic(selectedNode.id)}
                >
                  Log attempt on {selectedNode.name}
                </Button>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-fg-faint font-mono text-xs">
              Click any node on the roadmap to inspect its stats and prerequisites.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
