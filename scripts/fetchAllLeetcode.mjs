import fs from 'fs';
import path from 'path';

// Known Blind 75 and NeetCode slugs
const BLIND_75_SLUGS = new Set([
  'two-sum', 'valid-anagram', 'contains-duplicate', 'group-anagrams', 'top-k-frequent-elements',
  'product-of-array-except-self', 'longest-consecutive-sequence', 'valid-palindrome', '3sum',
  'container-with-most-water', 'trapping-rain-water', 'best-time-to-buy-and-sell-stock',
  'longest-substring-without-repeating-characters', 'longest-repeating-character-replacement',
  'minimum-window-substring', 'valid-parentheses', 'min-stack', 'daily-temperatures',
  'binary-search', 'find-minimum-in-rotated-sorted-array', 'search-in-rotated-sorted-array',
  'reverse-linked-list', 'merge-two-sorted-lists', 'reorder-list', 'remove-nth-node-from-end-of-list',
  'linked-list-cycle', 'merge-k-sorted-lists', 'invert-binary-tree', 'maximum-depth-of-binary-tree',
  'same-tree', 'subtree-of-another-tree', 'lowest-common-ancestor-of-a-binary-search-tree',
  'binary-tree-level-order-traversal', 'validate-binary-search-tree', 'kth-smallest-element-in-a-bst',
  'construct-binary-tree-from-preorder-and-inorder-traversal', 'binary-tree-maximum-path-sum',
  'serialize-and-deserialize-binary-tree', 'implement-trie-prefix-tree',
  'design-add-and-search-words-data-structure', 'word-search-ii', 'combination-sum', 'word-search',
  'number-of-islands', 'clone-graph', 'pacific-atlantic-water-flow', 'course-schedule',
  'graph-valid-tree', 'number-of-connected-components-in-an-undirected-graph', 'alien-dictionary',
  'climbing-stairs', 'house-robber', 'house-robber-ii', 'longest-palindromic-substring',
  'palindromic-substrings', 'decode-ways', 'coin-change', 'maximum-product-subarray',
  'word-break', 'longest-increasing-subsequence', 'unique-paths', 'longest-common-subsequence',
  'maximum-subarray', 'jump-game', 'insert-interval', 'merge-intervals',
  'non-overlapping-intervals', 'meeting-rooms', 'meeting-rooms-ii', 'rotate-image',
  'spiral-matrix', 'set-matrix-zeroes', 'single-number', 'number-of-1-bits',
  'counting-bits', 'reverse-bits', 'missing-number', 'sum-of-two-integers'
]);

const NEETCODE_150_EXTRA_SLUGS = new Set([
  'valid-sudoku', 'encode-and-decode-strings', 'two-sum-ii-input-array-is-sorted',
  'permutation-in-string', 'sliding-window-maximum', 'evaluate-reverse-polish-notation',
  'generate-parentheses', 'car-fleet', 'largest-rectangle-in-histogram', 'search-a-2d-matrix',
  'koko-eating-bananas', 'time-based-key-value-store', 'median-of-two-sorted-arrays',
  'copy-list-with-random-pointer', 'add-two-numbers', 'find-the-duplicate-number',
  'lru-cache', 'reverse-nodes-in-k-group', 'diameter-of-binary-tree', 'balanced-binary-tree',
  'binary-tree-right-side-view', 'count-good-nodes-in-binary-tree', 'kth-largest-element-in-a-stream',
  'last-stone-weight', 'k-closest-points-to-origin', 'kth-largest-element-in-an-array',
  'task-scheduler', 'design-twitter', 'find-median-from-data-stream', 'subsets', 'permutations',
  'subsets-ii', 'combination-sum-ii', 'palindrome-partitioning', 'letter-combinations-of-a-phone-number',
  'n-queens', 'max-area-of-island', 'walls-and-gates', 'rotting-oranges', 'surrounded-regions',
  'course-schedule-ii', 'redundant-connection', 'word-ladder', 'reconstruct-itinerary',
  'min-cost-to-connect-all-points', 'network-delay-time', 'swim-in-rising-water',
  'cheapest-flights-within-k-stops', 'min-cost-climbing-stairs', 'partition-equal-subset-sum',
  'best-time-to-buy-and-sell-stock-with-cooldown', 'coin-change-ii', 'target-sum',
  'interleaving-string', 'edit-distance', 'distinct-subsequences', 'burst-balloons',
  'regular-expression-matching', 'longest-increasing-path-in-a-matrix', 'jump-game-ii',
  'gas-station', 'hand-of-straights', 'merge-triplets-to-form-target-triplet',
  'partition-labels', 'valid-parenthesis-string', 'minimum-interval-to-include-each-query',
  'happy-number', 'plus-one', 'powx-n', 'multiply-strings', 'detect-squares', 'reverse-integer'
]);

function mapLeetCodeTopics(tags) {
  const slugs = new Set((tags || []).map((t) => t.slug));
  const res = [];

  if (slugs.has('array') || slugs.has('matrix')) res.push('arrays');
  if (slugs.has('hash-table')) res.push('hashing');
  if (slugs.has('two-pointers') || slugs.has('sliding-window')) res.push('two_pointers');
  if (slugs.has('binary-search')) res.push('binary_search');
  if (slugs.has('stack') || slugs.has('queue') || slugs.has('monotonic-stack') || slugs.has('heap-priority-queue')) {
    res.push('stacks_queues');
  }
  if (slugs.has('recursion') || slugs.has('linked-list')) res.push('recursion');
  if (slugs.has('backtracking')) res.push('backtracking');
  if (slugs.has('tree') || slugs.has('binary-tree') || slugs.has('binary-search-tree') || slugs.has('trie')) {
    res.push('trees');
  }
  if (slugs.has('graph') || slugs.has('breadth-first-search') || slugs.has('depth-first-search') || slugs.has('union-find')) {
    res.push('graphs');
  }
  if (slugs.has('dynamic-programming') || slugs.has('memoization')) res.push('dp');

  if (res.length === 0) res.push('arrays');
  return Array.from(new Set(res));
}

async function fetchAll() {
  console.log('Fetching all problems from LeetCode GraphQL...');
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
        total: totalNum
        questions: data {
          frontendQuestionId: questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {
            slug
          }
        }
      }
    }
  `;

  // First fetch page 0 to get total
  const initialRes = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Referer': 'https://leetcode.com/problemset/all/',
    },
    body: JSON.stringify({
      query,
      variables: { categorySlug: '', skip: 0, limit: 100, filters: {} },
    }),
  });
  const initialData = await initialRes.json();
  const total = initialData?.data?.problemsetQuestionList?.total || 4115;
  console.log(`Total questions on LeetCode: ${total}`);

  let allRaw = [...(initialData?.data?.problemsetQuestionList?.questions || [])];

  const pageSize = 100;
  const skips = [];
  for (let s = pageSize; s < total; s += pageSize) {
    skips.push(s);
  }

  // Fetch in concurrency batches of 6
  const concurrency = 6;
  for (let i = 0; i < skips.length; i += concurrency) {
    const batch = skips.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (skip) => {
        try {
          const res = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Referer': 'https://leetcode.com/problemset/all/',
            },
            body: JSON.stringify({
              query,
              variables: { categorySlug: '', skip, limit: pageSize, filters: {} },
            }),
          });
          const d = await res.json();
          return d?.data?.problemsetQuestionList?.questions || [];
        } catch (e) {
          console.error(`Error fetching skip=${skip}:`, e.message);
          return [];
        }
      })
    );
    for (const r of results) allRaw.push(...r);
    process.stdout.write(`\rProgress: ${allRaw.length} / ${total} fetched...`);
  }

  console.log(`\nSuccessfully fetched ${allRaw.length} total questions.`);

  // Transform into compact, high-efficiency structure
  // [ id, title, slug, diff ('E'|'M'|'H'), [topics], [tags] ]
  const transformed = allRaw.map((q) => {
    const id = parseInt(q.frontendQuestionId, 10) || 0;
    const diff =
      q.difficulty === 'Easy' ? 'easy' : q.difficulty === 'Medium' ? 'medium' : 'hard';
    const topics = mapLeetCodeTopics(q.topicTags);

    const tags = [];
    if (BLIND_75_SLUGS.has(q.titleSlug)) {
      tags.push('blind75');
      tags.push('neetcode150');
      tags.push('neetcode250');
    } else if (NEETCODE_150_EXTRA_SLUGS.has(q.titleSlug)) {
      tags.push('neetcode150');
      tags.push('neetcode250');
    }

    return {
      id,
      title: q.title,
      slug: q.titleSlug,
      difficulty: diff,
      topic_ids: topics,
      list_tags: tags.length > 0 ? tags : undefined,
    };
  });

  // Sort deterministically by ID ascending
  transformed.sort((a, b) => a.id - b.id);

  const outPath = path.resolve('src/data/allLeetcodeProblems.json');
  fs.writeFileSync(outPath, JSON.stringify(transformed), 'utf8');
  const stats = fs.statSync(outPath);
  console.log(`Wrote ${transformed.length} problems to ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

fetchAll();

