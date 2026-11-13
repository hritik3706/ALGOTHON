import { IStorageAdapter, StorageData } from './types';
import {
  Problem,
  Attempt,
  Revision,
  Topic,
  ProblemDifficulty,
  AttemptStatus,
  MistakeTag,
} from '../../types';
import { SEED_TOPICS, SEED_PROBLEMS, SEED_ATTEMPTS, SEED_REVISIONS } from '../seed';

const CURRENT_SCHEMA_VERSION = 1;

const VALID_DIFFICULTIES: ProblemDifficulty[] = ['easy', 'medium', 'hard'];
const VALID_STATUSES: AttemptStatus[] = ['solved', 'hint', 'failed'];
const VALID_MISTAKE_TAGS: MistakeTag[] = [
  'off_by_one',
  'edge_case',
  'complexity',
  'tle',
  'logic',
  'syntax',
  'none',
];

export class Storage {
  private adapter: IStorageAdapter;
  private topics: Map<string, Topic> = new Map();
  private problems: Map<string, Problem> = new Map();
  private attempts: Map<string, Attempt> = new Map();
  private revisions: Map<string, Revision> = new Map();
  private listeners: (() => void)[] = [];

  constructor(adapter: IStorageAdapter) {
    this.adapter = adapter;
    this.init();
  }

  private init(): void {
    // 1. Load or initialize versioned seed topics (kept separate from user data)
    let storedTopics = this.adapter.loadSeedTopics();
    if (!storedTopics || storedTopics.length === 0) {
      storedTopics = SEED_TOPICS;
      this.adapter.saveSeedTopics(storedTopics);
    }
    for (const t of storedTopics) {
      this.topics.set(t.id, t);
    }

    // 2. Load user problems, attempts, and revisions
    const storedData = this.adapter.loadData();
    if (storedData) {
      for (const p of storedData.problems) this.problems.set(p.id, p);
      for (const a of storedData.attempts) this.attempts.set(a.id, a);
      for (const r of storedData.revisions) this.revisions.set(r.problem_id, r);
    } else {
      // First boot: boots completely empty (0 problems, 0 attempts, 0 revisions)
      this.persist();
    }
  }

  public loadDemoData(): void {
    this.problems.clear();
    this.attempts.clear();
    this.revisions.clear();
    for (const p of SEED_PROBLEMS) this.problems.set(p.id, p);
    for (const a of SEED_ATTEMPTS) this.attempts.set(a.id, a);
    for (const r of SEED_REVISIONS) this.revisions.set(r.problem_id, r);
    this.persist();
  }

  public clearAllData(): void {
    this.adapter.createBackup();
    this.problems.clear();
    this.attempts.clear();
    this.revisions.clear();
    this.persist();
  }

  public exportJSON(): string {
    const data: StorageData = {
      schema_version: CURRENT_SCHEMA_VERSION,
      problems: Array.from(this.problems.values()),
      attempts: Array.from(this.attempts.values()),
      revisions: Array.from(this.revisions.values()),
      updated_at: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  public exportMarkdown(): string {
    const lines: string[] = [
      '# Algothon Practice & Study Notes',
      `*Generated on: ${new Date().toISOString()}*`,
      '',
      '## Problem Summary',
      `Total Problems: ${this.problems.size} | Total Attempts: ${this.attempts.size}`,
      '',
    ];

    const topics = Array.from(this.topics.values());
    for (const t of topics) {
      const topicProblems = Array.from(this.problems.values()).filter((p) =>
        p.topic_ids.includes(t.id)
      );
      if (topicProblems.length === 0) continue;

      lines.push(`### ${t.name}`);
      for (const p of topicProblems) {
        const rev = this.revisions.get(p.id);
        const pAttempts = Array.from(this.attempts.values()).filter(
          (a) => a.problem_id === p.id
        );
        lines.push(`- **[${p.difficulty.toUpperCase()}] ${p.title}** (${p.platform})`);
        if (p.link) lines.push(`  - Link: ${p.link}`);
        if (rev) {
          lines.push(
            `  - Interval: ${rev.interval_days}d | Repetitions: ${rev.repetitions} | EF: ${rev.ease_factor} | Due: ${rev.next_due_date}`
          );
        }
        if (pAttempts.length > 0) {
          lines.push(`  - Attempts: ${pAttempts.length}`);
          const notes = pAttempts
            .map((a) => a.notes)
            .filter(Boolean) as string[];
          if (notes.length > 0) {
            lines.push(`  - **Notes:** ${notes.join('; ')}`);
          }
        }
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  public importJSON(rawJson: string): { importedProblems: number; importedAttempts: number } {
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error('Invalid JSON format');
    }

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.problems)) {
      throw new Error('Invalid Algothon backup structure: missing problems array');
    }

    // Safety backup
    this.adapter.createBackup();

    let problemsCount = 0;
    let attemptsCount = 0;

    for (const p of parsed.problems) {
      if (p.id && p.title) {
        this.problems.set(p.id, {
          id: p.id,
          title: p.title,
          platform: p.platform || 'LeetCode',
          link: p.link || '',
          difficulty: VALID_DIFFICULTIES.includes(p.difficulty) ? p.difficulty : 'medium',
          topic_ids: Array.isArray(p.topic_ids) ? p.topic_ids : ['arrays'],
          created_date: p.created_date || new Date().toISOString().split('T')[0],
        });
        problemsCount++;
      }
    }

    if (Array.isArray(parsed.attempts)) {
      for (const a of parsed.attempts) {
        if (a.id && a.problem_id) {
          this.attempts.set(a.id, {
            id: a.id,
            problem_id: a.problem_id,
            date: a.date || new Date().toISOString().split('T')[0],
            status: VALID_STATUSES.includes(a.status) ? a.status : 'solved',
            time_taken: typeof a.time_taken === 'number' ? a.time_taken : 15,
            mistake_tag: VALID_MISTAKE_TAGS.includes(a.mistake_tag) ? a.mistake_tag : 'none',
            recall_quality: typeof a.recall_quality === 'number' ? a.recall_quality : 4,
            notes: a.notes || undefined,
          });
          attemptsCount++;
        }
      }
    }

    if (Array.isArray(parsed.revisions)) {
      for (const r of parsed.revisions) {
        if (r.problem_id) {
          this.revisions.set(r.problem_id, {
            problem_id: r.problem_id,
            next_due_date: r.next_due_date || new Date().toISOString().split('T')[0],
            interval_index: typeof r.interval_index === 'number' ? r.interval_index : 1,
            interval_days: typeof r.interval_days === 'number' ? r.interval_days : 1,
            ease_factor: typeof r.ease_factor === 'number' ? r.ease_factor : 2.5,
            repetitions: typeof r.repetitions === 'number' ? r.repetitions : 0,
            failed_count: typeof r.failed_count === 'number' ? r.failed_count : 0,
            leech_flag: Boolean(r.leech_flag),
          });
        }
      }
    }

    this.persist();
    return { importedProblems: problemsCount, importedAttempts: attemptsCount };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  private persist(): void {
    const data: StorageData = {
      schema_version: CURRENT_SCHEMA_VERSION,
      problems: Array.from(this.problems.values()),
      attempts: Array.from(this.attempts.values()),
      revisions: Array.from(this.revisions.values()),
      updated_at: new Date().toISOString(),
    };
    this.adapter.saveData(data);
    this.notify();
  }

  // --- TOPIC QUERIES ---
  public getTopics(): Topic[] {
    return Array.from(this.topics.values());
  }

  public getTopic(id: string): Topic | undefined {
    return this.topics.get(id);
  }

  // --- PROBLEM CRUD & INTEGRITY CHECKS ---
  public getProblems(): Problem[] {
    return Array.from(this.problems.values());
  }

  public getProblem(id: string): Problem | undefined {
    return this.problems.get(id);
  }

  public addProblem(input: {
    id?: string;
    title: string;
    platform: string;
    link?: string;
    difficulty: ProblemDifficulty;
    topic_ids: string[];
    created_date?: string;
  }): Problem {
    // 1. Validate title
    if (!input.title || !input.title.trim()) {
      throw new Error('Problem title must not be empty');
    }

    // 2. Validate difficulty
    if (!VALID_DIFFICULTIES.includes(input.difficulty)) {
      throw new Error(
        `Invalid difficulty "${input.difficulty}". Expected one of: ${VALID_DIFFICULTIES.join(', ')}`
      );
    }

    // 3. Validate topic IDs: every topic id on a problem must exist!
    if (!input.topic_ids || input.topic_ids.length === 0) {
      throw new Error('Problem must belong to at least one valid topic');
    }
    for (const tid of input.topic_ids) {
      if (!this.topics.has(tid)) {
        throw new Error(`Unknown topic id rejected: "${tid}"`);
      }
    }

    const problem: Problem = {
      id: input.id || `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: input.title.trim(),
      platform: input.platform || 'LeetCode',
      link: input.link?.trim() || '',
      difficulty: input.difficulty,
      topic_ids: input.topic_ids,
      created_date: input.created_date || new Date().toISOString().split('T')[0],
    };

    this.problems.set(problem.id, problem);
    this.persist();
    return problem;
  }

  public updateProblem(id: string, updates: Partial<Problem>): Problem {
    const existing = this.problems.get(id);
    if (!existing) {
      throw new Error(`Cannot update problem: problem ID "${id}" not found`);
    }

    if (updates.difficulty && !VALID_DIFFICULTIES.includes(updates.difficulty)) {
      throw new Error(`Invalid difficulty "${updates.difficulty}"`);
    }

    if (updates.topic_ids) {
      for (const tid of updates.topic_ids) {
        if (!this.topics.has(tid)) {
          throw new Error(`Unknown topic id rejected: "${tid}"`);
        }
      }
    }

    const updated: Problem = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
    };

    this.problems.set(id, updated);
    this.persist();
    return updated;
  }

  /**
   * Cascade delete: Deleting a problem cascades to its attempts and revision.
   * Creates a backup before destructive operation.
   */
  public deleteProblem(id: string): boolean {
    if (!this.problems.has(id)) return false;

    // Snapshot backup before destructive delete
    this.adapter.createBackup();

    // 1. Delete Problem
    this.problems.delete(id);

    // 2. Cascade delete attempts
    for (const [attId, att] of this.attempts.entries()) {
      if (att.problem_id === id) {
        this.attempts.delete(attId);
      }
    }

    // 3. Cascade delete revision
    this.revisions.delete(id);

    this.persist();
    return true;
  }

  // --- ATTEMPT CRUD & INTEGRITY CHECKS ---
  public getAttempts(): Attempt[] {
    return Array.from(this.attempts.values());
  }

  public getAttemptsForProblem(problemId: string): Attempt[] {
    return Array.from(this.attempts.values()).filter(
      (a) => a.problem_id === problemId
    );
  }

  public addAttempt(input: {
    id?: string;
    problem_id: string;
    date: string;
    status: AttemptStatus;
    time_taken: number;
    mistake_tag: MistakeTag;
    recall_quality: number;
    notes?: string;
  }): Attempt {
    // 1. Verify problem exists
    if (!this.problems.has(input.problem_id)) {
      throw new Error(
        `Cannot add attempt: Problem ID "${input.problem_id}" does not exist`
      );
    }

    // 2. Validate status
    if (!VALID_STATUSES.includes(input.status)) {
      throw new Error(
        `Invalid attempt status "${input.status}". Expected one of: ${VALID_STATUSES.join(', ')}`
      );
    }

    // 3. Validate mistake tag
    if (!VALID_MISTAKE_TAGS.includes(input.mistake_tag)) {
      throw new Error(
        `Invalid mistake tag "${input.mistake_tag}". Expected one of: ${VALID_MISTAKE_TAGS.join(', ')}`
      );
    }

    // 4. Validate recall_quality 0-5
    if (
      typeof input.recall_quality !== 'number' ||
      input.recall_quality < 0 ||
      input.recall_quality > 5 ||
      !Number.isInteger(input.recall_quality)
    ) {
      throw new Error(
        `Invalid recall_quality "${input.recall_quality}". Must be an integer between 0 and 5 inclusive.`
      );
    }

    // 5. Validate time_taken >= 0
    if (typeof input.time_taken !== 'number' || input.time_taken < 0) {
      throw new Error('time_taken must be a non-negative number');
    }

    const attempt: Attempt = {
      id: input.id || `a-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      problem_id: input.problem_id,
      date: input.date,
      status: input.status,
      time_taken: input.time_taken,
      mistake_tag: input.mistake_tag,
      recall_quality: input.recall_quality,
      notes: input.notes?.trim() || undefined,
    };

    this.attempts.set(attempt.id, attempt);
    this.persist();
    return attempt;
  }

  public deleteAttempt(id: string): boolean {
    if (!this.attempts.has(id)) return false;
    this.adapter.createBackup();
    this.attempts.delete(id);
    this.persist();
    return true;
  }

  // --- REVISION CRUD ---
  public getRevisions(): Revision[] {
    return Array.from(this.revisions.values());
  }

  public getRevision(problemId: string): Revision | undefined {
    return this.revisions.get(problemId);
  }

  public saveRevision(rev: Revision): void {
    if (!this.problems.has(rev.problem_id)) {
      throw new Error(
        `Cannot save revision: problem ID "${rev.problem_id}" does not exist`
      );
    }
    this.revisions.set(rev.problem_id, rev);
    this.persist();
  }
}

