import { describe, it, expect, beforeEach } from 'vitest';
import {
  CURATED_PROBLEMS_RAW,
  getCuratedProblems,
  getCuratedCounts,
} from '../src/data/curatedProblems';
import { storeManager } from '../src/core/storeManager';

describe('Curated Problems & LeetCode Catalog', () => {
  beforeEach(() => {
    storeManager.clearAllData();
  });

  it('validates all curated problems have authentic LeetCode URLs and valid properties', () => {
    expect(CURATED_PROBLEMS_RAW.length).toBeGreaterThanOrEqual(230);

    for (const p of CURATED_PROBLEMS_RAW) {
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(['easy', 'medium', 'hard']).toContain(p.difficulty);
      expect(p.topic_ids.length).toBeGreaterThan(0);
      expect(p.list_tags.length).toBeGreaterThan(0);
      expect(p.category).toBeTruthy();
      expect(p.leetcode_id).toBeGreaterThan(0);
    }
  });

  it('generates genuine LeetCode links for every curated problem', () => {
    const curated = getCuratedProblems();
    for (const p of curated) {
      expect(p.link).toMatch(/^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/);
      expect(p.platform).toBe('LeetCode');
    }
  });

  it('returns correct counts for Blind 75, NeetCode 150, and NeetCode 250', () => {
    const counts = getCuratedCounts();
    expect(counts.blind75).toBeGreaterThanOrEqual(75);
    expect(counts.neetcode150).toBeGreaterThanOrEqual(150);
    expect(counts.neetcode250).toBeGreaterThanOrEqual(230);
    expect(counts.totalAllLeetcode).toBeGreaterThanOrEqual(4000);
    expect(counts.total).toBeGreaterThanOrEqual(4000);
  });

  it('filters curated problems by list tag accurately', () => {
    const b75 = getCuratedProblems('blind75');
    const n150 = getCuratedProblems('neetcode150');
    const n250 = getCuratedProblems('neetcode250');

    expect(b75.length).toBe(getCuratedCounts().blind75);
    expect(n150.length).toBe(getCuratedCounts().neetcode150);
    expect(n250.length).toBe(getCuratedCounts().neetcode250);

    // Every Blind 75 problem must have 'blind75' tag
    for (const p of b75) {
      expect(p.list_tags).toContain('blind75');
    }
  });

  it('returns unified problem catalog with solve status and tracking indicators', () => {
    // Initially empty storage
    const catalog = storeManager.getProblemCatalog({ listTag: 'all' });
    expect(catalog.length).toBeGreaterThanOrEqual(4000);

    // First item should be unsolved and not tracked
    const first = catalog[0];
    expect(first.status).toBe('unsolved');
    expect(first.attemptsCount).toBe(0);
    expect(first.solvedCount).toBe(0);

    // Log an attempt on the first problem
    const logRes = storeManager.logAttempt({
      problem_id: first.problem.id,
      title: first.problem.title,
      platform: first.problem.platform,
      link: first.problem.link,
      difficulty: first.problem.difficulty,
      topic_ids: first.problem.topic_ids,
      status: 'solved',
      time_taken: 15,
      mistake_tag: 'none',
      notes: 'Clean O(N) hash solution',
    });

    expect(logRes.attempt.status).toBe('solved');
    expect(logRes.updated_revision).toBeDefined();

    // Now reload catalog: that problem should now be marked solved and tracked!
    const updatedCatalog = storeManager.getProblemCatalog({ listTag: 'all' });
    const matched = updatedCatalog.find(
      (i) => i.problem.title.toLowerCase() === first.problem.title.toLowerCase()
    );

    expect(matched).toBeDefined();
    expect(matched?.status).toBe('solved');
    expect(matched?.solvedCount).toBe(1);
    expect(matched?.isTracked).toBe(true);
  });

  it('imports curated lists without duplicating existing problems', () => {
    // Import Blind 75
    const res1 = storeManager.importCuratedList('blind75');
    expect(res1.imported).toBeGreaterThan(0);
    expect(res1.existing).toBe(0);

    // Re-importing Blind 75 should detect existing problems
    const res2 = storeManager.importCuratedList('blind75');
    expect(res2.imported).toBe(0);
    expect(res2.existing).toBe(res1.imported);
  });
});

