export type MistakeTag =
  | 'off_by_one'
  | 'edge_case'
  | 'complexity'
  | 'tle'
  | 'logic'
  | 'syntax'
  | 'none';

export type ProblemDifficulty = 'easy' | 'medium' | 'hard';
export type AttemptStatus = 'solved' | 'hint' | 'failed';
export type PlanItemType = 'due' | 'new' | 'relearn';
export type TopicTrend = 'improving' | 'flat' | 'regressing' | 'insufficient_data';

export interface Topic {
  id: string;
  name: string;
  prerequisites: string[];
  importance_weight: number; // 1 to 5
}

export interface Problem {
  id: string;
  title: string;
  platform: string;
  link: string;
  difficulty: ProblemDifficulty;
  topic_ids: string[];
  created_date: string;
  url_hash?: string;
}

export interface Attempt {
  id: string;
  problem_id: string;
  date: string; // ISO date string YYYY-MM-DD
  status: AttemptStatus;
  time_taken: number; // minutes
  mistake_tag: MistakeTag;
  recall_quality: number; // 0 to 5
  notes?: string;
}

export interface Revision {
  problem_id: string;
  next_due_date: string; // YYYY-MM-DD
  interval_index: number;
  interval_days: number;
  ease_factor: number; // init 2.5, floor 1.3
  repetitions: number;
  failed_count: number;
  leech_flag: boolean;
}

export interface PlanItem {
  id: string;
  problem: Problem;
  topic: Topic;
  type: PlanItemType;
  reason: string;
}

export interface TopicSummary {
  topic: Topic;
  strength: number; // 0 to 100
  attempts: number;
  success_rate: number; // 0.0 to 1.0
  is_unlocked: boolean;
  weakest_prerequisite?: {
    id: string;
    name: string;
    attempts: number;
    success_rate: number;
  };
  top_mistake?: MistakeTag;
  trend: TopicTrend;
}

export interface AvoidanceInsight {
  topic: Topic;
  expected_share: number;
  actual_share: number;
  attempts: number;
}

export interface DailyActivity {
  date: string;
  day_name: string;
  attempts_count: number;
  solved_count: number;
}

export interface CoverageCell {
  solved: number;
  total: number;
}

export interface TopicCoverageRow {
  topic_id: string;
  topic_name: string;
  easy: CoverageCell;
  medium: CoverageCell;
  hard: CoverageCell;
  total_solved: number;
  total_problems: number;
  mastery_percentage: number;
  is_unlocked: boolean;
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

export interface InsightSummary {
  weak_topics: TopicSummary[];
  avoided_topics: AvoidanceInsight[];
  streak: number;
  last_7_days: DailyActivity[];
  total_problems: number;
  topics_unlocked: number;
  total_topics?: number;
  revisions_due_today: number;
}

export interface UpcomingRevisionItem {
  problem: Problem;
  revision: Revision;
  topic?: Topic;
  days_until_due: number;
  is_due: boolean;
}

export interface TopTopicStrength {
  topic: Topic;
  strength: number;
  is_unlocked: boolean;
  history: number[];
}

export interface LogAttemptInput {
  problem_id?: string;
  // If creating a problem on the fly:
  title: string;
  platform: string;
  link?: string;
  difficulty: ProblemDifficulty;
  topic_ids: string[];
  // Attempt details:
  status: AttemptStatus;
  time_taken: number;
  mistake_tag: MistakeTag;
  recall_quality?: number; // 0-5
  notes?: string;
  date?: string; // defaults to today
}

export interface AddProblemInput {
  title: string;
  platform: string;
  link?: string;
  difficulty: ProblemDifficulty;
  topic_ids: string[];
}

