import { Topic } from '../../types';
import { PriorityQueue } from './PriorityQueue';

export interface UnlockConfig {
  minAttempts: number;
  minSuccessRate: number;
}

export const DEFAULT_UNLOCK_CONFIG: UnlockConfig = {
  minAttempts: 5,
  minSuccessRate: 0.6,
};

export class TopicGraph {
  private topics: Map<string, Topic> = new Map();
  private adjacency: Map<string, Set<string>> = new Map(); // prereq -> downstream topics
  private inDegrees: Map<string, number> = new Map();

  constructor(topics: Topic[]) {
    this.loadTopics(topics);
  }

  public loadTopics(topics: Topic[]): void {
    this.topics.clear();
    this.adjacency.clear();
    this.inDegrees.clear();

    // 1. Register all topics
    for (const t of topics) {
      if (this.topics.has(t.id)) {
        throw new Error(`Duplicate topic ID detected: "${t.id}"`);
      }
      this.topics.set(t.id, t);
      this.adjacency.set(t.id, new Set());
      this.inDegrees.set(t.id, 0);
    }

    // 2. Validate prerequisites & build graph edges
    for (const t of topics) {
      for (const prereqId of t.prerequisites) {
        if (!this.topics.has(prereqId)) {
          throw new Error(
            `Unknown prerequisite topic ID: "${prereqId}" referenced by "${t.name}" (${t.id})`
          );
        }
        this.adjacency.get(prereqId)!.add(t.id);
        this.inDegrees.set(t.id, (this.inDegrees.get(t.id) || 0) + 1);
      }
    }

    // 3. Verify graph is acyclic on load
    const cycle = this.findCycle();
    if (cycle) {
      throw new Error(`Cyclic prerequisite graph rejected: ${cycle}`);
    }
  }

  public getTopic(id: string): Topic | undefined {
    return this.topics.get(id);
  }

  public getAllTopics(): Topic[] {
    return Array.from(this.topics.values());
  }

  /**
   * Kahn's Algorithm: Returns standard topological order in true O(V+E) time using index pointer.
   * Throws if cycle exists with cycle path diagnostics.
   */
  public getTopologicalOrder(): Topic[] {
    const inDeg = new Map<string, number>(this.inDegrees);
    const queue: string[] = [];

    for (const [id, deg] of inDeg.entries()) {
      if (deg === 0) queue.push(id);
    }
    queue.sort(); // Deterministic tie-breaking by id

    const order: Topic[] = [];
    let head = 0;

    while (head < queue.length) {
      const currId = queue[head++];
      order.push(this.topics.get(currId)!);

      const nextNodes: string[] = [];
      for (const downstreamId of this.adjacency.get(currId) || []) {
        const newDeg = inDeg.get(downstreamId)! - 1;
        inDeg.set(downstreamId, newDeg);
        if (newDeg === 0) {
          nextNodes.push(downstreamId);
        }
      }
      nextNodes.sort();
      for (const nextId of nextNodes) {
        queue.push(nextId);
      }
    }

    if (order.length !== this.topics.size) {
      const cycle = this.findCycle();
      throw new Error(`Cycle detected in topic graph: ${cycle || 'unknown cycle'}`);
    }

    return order;
  }

  /**
   * Weighted topological order:
   * Kahn's algorithm with a Max-Priority Queue on importance_weight (1-5).
   * Front-loads high importance topics while strictly preserving DAG dependencies.
   */
  public getWeightedTopologicalOrder(): Topic[] {
    const inDeg = new Map<string, number>(this.inDegrees);
    const pq = new PriorityQueue<Topic>();

    for (const [id, deg] of inDeg.entries()) {
      if (deg === 0) {
        const topic = this.topics.get(id)!;
        pq.enqueue(topic, topic.importance_weight);
      }
    }

    const order: Topic[] = [];

    while (!pq.isEmpty()) {
      const curr = pq.dequeue()!;
      order.push(curr);

      for (const downstreamId of this.adjacency.get(curr.id) || []) {
        const newDeg = inDeg.get(downstreamId)! - 1;
        inDeg.set(downstreamId, newDeg);
        if (newDeg === 0) {
          const downstreamTopic = this.topics.get(downstreamId)!;
          pq.enqueue(downstreamTopic, downstreamTopic.importance_weight);
        }
      }
    }

    if (order.length !== this.topics.size) {
      const cycle = this.findCycle();
      throw new Error(`Cycle detected in weighted sort: ${cycle || 'unknown'}`);
    }

    return order;
  }

  /**
   * Detects cycles and formats them cleanly, e.g. "A -> B -> C -> A"
   */
  public findCycle(): string | null {
    const visited = new Map<string, number>(); // 0=unvisited, 1=visiting, 2=visited
    const parent = new Map<string, string>();

    for (const id of this.topics.keys()) {
      visited.set(id, 0);
    }

    const dfs = (nodeId: string): string[] | null => {
      visited.set(nodeId, 1);

      for (const neighborId of this.adjacency.get(nodeId) || []) {
        if (visited.get(neighborId) === 1) {
          // Cycle found! Reconstruct path
          const path = [neighborId, nodeId];
          let curr = nodeId;
          while (parent.has(curr) && parent.get(curr) !== neighborId) {
            curr = parent.get(curr)!;
            path.push(curr);
          }
          path.push(neighborId);
          path.reverse();
          return path.map((id) => this.topics.get(id)?.name || id);
        }

        if (visited.get(neighborId) === 0) {
          parent.set(neighborId, nodeId);
          const result = dfs(neighborId);
          if (result) return result;
        }
      }

      visited.set(nodeId, 2);
      return null;
    };

    for (const id of this.topics.keys()) {
      if (visited.get(id) === 0) {
        const cycle = dfs(id);
        if (cycle) return cycle.join(' -> ');
      }
    }

    return null;
  }

  /**
   * Check if a topic is unlocked based on prerequisite performance.
   */
  public checkUnlock(
    topicId: string,
    getStats: (id: string) => { attempts: number; success_rate: number },
    config: UnlockConfig = DEFAULT_UNLOCK_CONFIG
  ): {
    isUnlocked: boolean;
    weakestPrerequisite?: {
      id: string;
      name: string;
      attempts: number;
      success_rate: number;
    };
  } {
    const topic = this.topics.get(topicId);
    if (!topic) throw new Error(`Topic "${topicId}" not found in graph`);

    // Topics with no prerequisites are always unlocked
    if (topic.prerequisites.length === 0) {
      return { isUnlocked: true };
    }

    let isUnlocked = true;
    let weakestPrereq: {
      id: string;
      name: string;
      attempts: number;
      success_rate: number;
    } | undefined;
    let lowestScore = Infinity;

    for (const pid of topic.prerequisites) {
      const prereq = this.topics.get(pid);
      if (!prereq) continue;

      const stats = getStats(pid);
      const isSolid =
        stats.attempts >= config.minAttempts &&
        stats.success_rate >= config.minSuccessRate;

      if (!isSolid) {
        isUnlocked = false;
        // Prioritize naming the prerequisite furthest below threshold
        const score = stats.attempts === 0 ? -1 : stats.success_rate;
        if (score < lowestScore) {
          lowestScore = score;
          weakestPrereq = {
            id: pid,
            name: prereq.name,
            attempts: stats.attempts,
            success_rate: stats.success_rate,
          };
        }
      }
    }

    return { isUnlocked, weakestPrerequisite: weakestPrereq };
  }

  /**
   * Locked topic warning string naming the weakest prerequisite.
   */
  public getLockedWarning(
    topicId: string,
    getStats: (id: string) => { attempts: number; success_rate: number },
    config: UnlockConfig = DEFAULT_UNLOCK_CONFIG
  ): string | null {
    const check = this.checkUnlock(topicId, getStats, config);
    if (check.isUnlocked || !check.weakestPrerequisite) return null;

    const wp = check.weakestPrerequisite;
    return `Topic is locked. Prerequisite "${wp.name}" requires at least ${config.minAttempts} attempts with ${Math.round(config.minSuccessRate * 100)}% success (currently ${wp.attempts} attempts, ${Math.round(wp.success_rate * 100)}% success).`;
  }

  /**
   * Backward BFS:
   * Finds the shortest chain of locked prerequisites leading to the target.
   * Returns empty array if already unlocked.
   */
  public getShortestPrerequisitePath(
    targetTopicId: string,
    isPrereqUnlocked: (id: string) => boolean
  ): Topic[] {
    const target = this.topics.get(targetTopicId);
    if (!target) return [];

    if (isPrereqUnlocked(targetTopicId)) {
      return [];
    }

    // BFS queue: storing [topicId, pathSoFar]
    const queue: { id: string; path: string[] }[] = [];
    const visited = new Set<string>();

    for (const prereqId of target.prerequisites) {
      if (!isPrereqUnlocked(prereqId)) {
        queue.push({ id: prereqId, path: [prereqId] });
        visited.add(prereqId);
      }
    }

    let shortestChainIds: string[] = [];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      const currTopic = this.topics.get(id);
      if (!currTopic) continue;

      // Check if this topic has any locked prerequisites
      const lockedPrereqs = currTopic.prerequisites.filter(
        (pid) => !isPrereqUnlocked(pid)
      );

      if (lockedPrereqs.length === 0) {
        // We reached an actionable locked topic at the start of the chain!
        shortestChainIds = path;
        break;
      }

      for (const p of lockedPrereqs) {
        if (!visited.has(p)) {
          visited.add(p);
          queue.push({ id: p, path: [...path, p] });
        }
      }
    }

    if (shortestChainIds.length === 0 && target.prerequisites.length > 0) {
      shortestChainIds = [target.prerequisites[0]];
    }

    return shortestChainIds
      .map((id) => this.topics.get(id)!)
      .filter(Boolean);
  }

  /**
   * Computes dynamic hierarchical tree layout coordinates:
   * level(t) = 0 if t has no prerequisites, else 1 + max(level(p) for p in prerequisites).
   * Assigns x by order within level and y by level.
   * ViewBox dimensions are dynamically computed.
   */
  public static computeGraphLayout(
    topics: Topic[],
    nodeWidth: number = 150,
    nodeHeight: number = 56
  ): GraphLayoutResult {
    const graph = new TopicGraph(topics);
    const order = graph.getTopologicalOrder();

    // Compute level for each topic
    const levelMap = new Map<string, number>();
    for (const t of order) {
      if (t.prerequisites.length === 0) {
        levelMap.set(t.id, 0);
      } else {
        let maxPrereqLevel = 0;
        for (const p of t.prerequisites) {
          if (levelMap.has(p)) {
            maxPrereqLevel = Math.max(maxPrereqLevel, levelMap.get(p)!);
          }
        }
        levelMap.set(t.id, maxPrereqLevel + 1);
      }
    }

    // Group topics by level
    const levelGroups = new Map<number, Topic[]>();
    for (const t of order) {
      const lvl = levelMap.get(t.id)!;
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl)!.push(t);
    }

    const maxLevel = Math.max(0, ...Array.from(levelGroups.keys()));
    let maxNodesInLevel = 1;
    for (const group of levelGroups.values()) {
      maxNodesInLevel = Math.max(maxNodesInLevel, group.length);
    }

    const canvasWidth = Math.max(860, maxNodesInLevel * 220 + 80);
    const canvasHeight = Math.max(580, (maxLevel + 1) * 115 + 70);

    const nodes: GraphLayoutNode[] = [];
    const edges: GraphLayoutEdge[] = [];

    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      const group = levelGroups.get(lvl) || [];
      const count = group.length;

      group.forEach((t, idx) => {
        const x =
          count === 1
            ? canvasWidth / 2
            : 140 + ((canvasWidth - 280) / (count - 1)) * idx;
        const y = 55 + lvl * 105;

        nodes.push({
          id: t.id,
          name: t.name,
          level: lvl,
          indexInLevel: idx,
          x: Math.round(x),
          y: Math.round(y),
          width: nodeWidth,
          height: nodeHeight,
          parentIds: t.prerequisites,
        });

        for (const p of t.prerequisites) {
          edges.push({ from: p, to: t.id });
        }
      });
    }

    return {
      nodes,
      edges,
      width: canvasWidth,
      height: canvasHeight,
    };
  }
}

export interface GraphLayoutNode {
  id: string;
  name: string;
  level: number;
  indexInLevel: number;
  x: number;
  y: number;
  width: number;
  height: number;
  parentIds: string[];
}

export interface GraphLayoutEdge {
  from: string;
  to: string;
}

export interface GraphLayoutResult {
  nodes: GraphLayoutNode[];
  edges: GraphLayoutEdge[];
  width: number;
  height: number;
}
