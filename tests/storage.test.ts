import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Storage } from '../src/core/storage/Storage';
import { FileStorageAdapter } from '../src/core/storage/FileStorageAdapter';

describe('Storage', () => {
  const testDir = path.join(__dirname, 'tmp_storage_test');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('performs atomic writes via temporary file and atomic rename', () => {
    const adapter = new FileStorageAdapter(testDir);
    const storage = new Storage(adapter);

    const problem = storage.addProblem({
      title: 'Atomic Test Problem',
      platform: 'LeetCode',
      difficulty: 'easy',
      topic_ids: ['arrays'],
    });

    const storePath = path.join(testDir, 'algothon_store.json');
    const tempPath = path.join(testDir, 'algothon_store.temp.json');

    // Primary store exists and contains problem
    expect(fs.existsSync(storePath)).toBe(true);
    // Temporary file should not be left lingering after atomic commit
    expect(fs.existsSync(tempPath)).toBe(false);

    const content = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    expect(content.schema_version).toBe(1);
    expect(content.problems.some((p: { id: string }) => p.id === problem.id)).toBe(true);
  });

  it('rejects unknown topic IDs immediately with clean error', () => {
    const adapter = new FileStorageAdapter(testDir);
    const storage = new Storage(adapter);

    expect(() =>
      storage.addProblem({
        title: 'Invalid Topic Problem',
        platform: 'LeetCode',
        difficulty: 'medium',
        topic_ids: ['non_existent_topic'],
      })
    ).toThrowError(/Unknown topic id rejected: "non_existent_topic"/);
  });

  it('validates attempt enums and recall_quality 0-5', () => {
    const adapter = new FileStorageAdapter(testDir);
    const storage = new Storage(adapter);

    const problem = storage.addProblem({
      title: 'Valid Problem',
      platform: 'LeetCode',
      difficulty: 'medium',
      topic_ids: ['arrays'],
    });

    // 1. Invalid status
    expect(() =>
      storage.addAttempt({
        problem_id: problem.id,
        date: '2026-11-01',
        status: 'invalid_status' as any,
        time_taken: 10,
        mistake_tag: 'none',
        recall_quality: 4,
      })
    ).toThrowError(/Invalid attempt status "invalid_status"/);

    // 2. Invalid recall_quality (<0 or >5)
    expect(() =>
      storage.addAttempt({
        problem_id: problem.id,
        date: '2026-11-01',
        status: 'solved',
        time_taken: 10,
        mistake_tag: 'none',
        recall_quality: 6,
      })
    ).toThrowError(/Invalid recall_quality "6"/);

    // 3. Valid attempt succeeds
    const validAttempt = storage.addAttempt({
      problem_id: problem.id,
      date: '2026-11-01',
      status: 'solved',
      time_taken: 15,
      mistake_tag: 'none',
      recall_quality: 5,
    });
    expect(validAttempt.id).toBeDefined();
  });

  it('cascade deletes: deleting a problem removes its attempts and revision', () => {
    const adapter = new FileStorageAdapter(testDir);
    const storage = new Storage(adapter);

    const problem = storage.addProblem({
      title: 'Cascade Delete Target',
      platform: 'LeetCode',
      difficulty: 'hard',
      topic_ids: ['arrays'],
    });

    storage.addAttempt({
      problem_id: problem.id,
      date: '2026-11-01',
      status: 'failed',
      time_taken: 30,
      mistake_tag: 'logic',
      recall_quality: 1,
    });

    storage.saveRevision({
      problem_id: problem.id,
      next_due_date: '2026-11-02',
      interval_index: 0,
      interval_days: 1,
      ease_factor: 2.5,
      repetitions: 0,
      failed_count: 1,
      leech_flag: false,
    });

    expect(storage.getAttemptsForProblem(problem.id).length).toBe(1);
    expect(storage.getRevision(problem.id)).toBeDefined();

    // Delete problem
    const deleted = storage.deleteProblem(problem.id);
    expect(deleted).toBe(true);

    // Verify cascade
    expect(storage.getProblem(problem.id)).toBeUndefined();
    expect(storage.getAttemptsForProblem(problem.id).length).toBe(0);
    expect(storage.getRevision(problem.id)).toBeUndefined();
  });

  it('handles a corrupt store file by quarantining it and preventing silent overwrite', () => {
    const adapter = new FileStorageAdapter(testDir);
    const storePath = path.join(testDir, 'algothon_store.json');

    // Simulate corrupted store file
    fs.writeFileSync(storePath, '{ corrupt_json: [ unclosed_syntax ...', 'utf-8');

    expect(() => adapter.loadData()).toThrowError(
      /Persistent store is corrupt.*Silent overwrite prevented/
    );

    // Confirm corrupt file was quarantined with timestamp
    const files = fs.readdirSync(testDir);
    const quarantined = files.some((f) => f.includes('corrupt_'));
    expect(quarantined).toBe(true);
  });
});

