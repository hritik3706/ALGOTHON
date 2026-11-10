import { storeManager } from '../core/storeManager';
import {
  PlanItem,
  TopicSummary,
  Topic,
  LogAttemptInput,
  AddProblemInput,
  Problem,
  Revision,
  InsightSummary,
  Attempt,
} from '../types';

export * from '../types';

/**
 * Clean data-access layer. Components import ONLY from src/api.
 * Backed by real persistent Storage (with atomic writes and schema versioning),
 * TopicGraph (DAG and Kahn's algorithm), StatsEngine (Wilson score lower bounds),
 * RevisionScheduler (SM-2 and Min-Heap), and Planner (Interleaved daily plan).
 */

export async function getPlan(today?: string): Promise<PlanItem[]> {
  return Promise.resolve(storeManager.getPlan(today));
}

export async function getTopics(): Promise<TopicSummary[]> {
  return Promise.resolve(storeManager.getTopics());
}

export async function getTopicPath(topicId: string): Promise<{ path: Topic[]; is_unlocked: boolean }> {
  return Promise.resolve(storeManager.getTopicPath(topicId));
}

export async function getProblems(): Promise<Problem[]> {
  return Promise.resolve(storeManager.getProblems());
}

export async function searchProblems(query: string): Promise<Problem[]> {
  return Promise.resolve(storeManager.searchProblems(query));
}

export async function logAttempt(input: LogAttemptInput): Promise<{ attempt: Attempt; updated_revision?: Revision }> {
  return Promise.resolve(storeManager.logAttempt(input));
}

export async function markRelearned(problemId: string, today?: string): Promise<Revision> {
  return Promise.resolve(storeManager.markRelearned(problemId, today));
}

export async function addProblem(input: AddProblemInput): Promise<Problem> {
  return Promise.resolve(storeManager.addProblem(input));
}

export async function getDueRevisions(today?: string): Promise<{ problem: Problem; revision: Revision; topic?: Topic }[]> {
  return Promise.resolve(storeManager.getDueRevisions(today));
}

export async function getLeeches(): Promise<{ problem: Problem; revision: Revision; topic?: Topic }[]> {
  return Promise.resolve(storeManager.getLeeches());
}

export async function getStreak(today?: string): Promise<number> {
  return Promise.resolve(storeManager.getStreak(today));
}

export async function getInsights(today?: string): Promise<InsightSummary> {
  return Promise.resolve(storeManager.getInsights(today));
}

export function subscribeToStore(listener: () => void): () => void {
  return storeManager.subscribe(listener);
}

export function resetToSampleData(): void {
  storeManager.resetToSampleData();
}
