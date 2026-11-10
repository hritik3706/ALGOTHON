import { Topic, Problem, Attempt, Revision } from '../../types';

// Helper to get formatted date string YYYY-MM-DD relative to today
export function getRelativeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export const SEED_TOPICS: Topic[] = [
  { id: 'arrays', name: 'Arrays', prerequisites: [], importance_weight: 5 },
  { id: 'hashing', name: 'Hashing', prerequisites: ['arrays'], importance_weight: 5 },
  { id: 'two_pointers', name: 'Two pointers and sliding window', prerequisites: ['arrays'], importance_weight: 4 },
  { id: 'binary_search', name: 'Binary search', prerequisites: ['arrays'], importance_weight: 4 },
  { id: 'stacks_queues', name: 'Stacks and queues', prerequisites: ['arrays'], importance_weight: 3 },
  { id: 'recursion', name: 'Recursion', prerequisites: ['arrays'], importance_weight: 4 },
  { id: 'backtracking', name: 'Backtracking', prerequisites: ['recursion'], importance_weight: 3 },
  { id: 'trees', name: 'Trees', prerequisites: ['recursion', 'stacks_queues'], importance_weight: 5 },
  { id: 'graphs', name: 'Graphs', prerequisites: ['trees', 'hashing'], importance_weight: 5 },
  { id: 'dp', name: 'Dynamic programming', prerequisites: ['backtracking'], importance_weight: 5 },
];

export const SEED_PROBLEMS: Problem[] = [
  // Arrays & Hashing
  { id: 'p1', title: 'Two Sum', platform: 'LeetCode', link: 'https://leetcode.com/problems/two-sum/', difficulty: 'easy', topic_ids: ['arrays', 'hashing'], created_date: getRelativeDate(-20) },
  { id: 'p2', title: 'Contains Duplicate', platform: 'LeetCode', link: 'https://leetcode.com/problems/contains-duplicate/', difficulty: 'easy', topic_ids: ['arrays', 'hashing'], created_date: getRelativeDate(-19) },
  { id: 'p3', title: 'Valid Anagram', platform: 'LeetCode', link: 'https://leetcode.com/problems/valid-anagram/', difficulty: 'easy', topic_ids: ['hashing'], created_date: getRelativeDate(-18) },
  { id: 'p4', title: 'Group Anagrams', platform: 'LeetCode', link: 'https://leetcode.com/problems/group-anagrams/', difficulty: 'medium', topic_ids: ['arrays', 'hashing'], created_date: getRelativeDate(-15) },
  { id: 'p5', title: 'Top K Frequent Elements', platform: 'LeetCode', link: 'https://leetcode.com/problems/top-k-frequent-elements/', difficulty: 'medium', topic_ids: ['hashing'], created_date: getRelativeDate(-14) },
  { id: 'p6', title: 'Product of Array Except Self', platform: 'LeetCode', link: 'https://leetcode.com/problems/product-of-array-except-self/', difficulty: 'medium', topic_ids: ['arrays'], created_date: getRelativeDate(-13) },
  { id: 'p7', title: 'Longest Consecutive Sequence', platform: 'LeetCode', link: 'https://leetcode.com/problems/longest-consecutive-sequence/', difficulty: 'medium', topic_ids: ['hashing'], created_date: getRelativeDate(-12) },

  // Two Pointers & Sliding Window
  { id: 'p8', title: 'Valid Palindrome', platform: 'LeetCode', link: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'easy', topic_ids: ['two_pointers'], created_date: getRelativeDate(-11) },
  { id: 'p9', title: '3Sum', platform: 'LeetCode', link: 'https://leetcode.com/problems/3sum/', difficulty: 'medium', topic_ids: ['two_pointers', 'arrays'], created_date: getRelativeDate(-10) },
  { id: 'p10', title: 'Container With Most Water', platform: 'LeetCode', link: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'medium', topic_ids: ['two_pointers'], created_date: getRelativeDate(-9) },
  { id: 'p11', title: 'Best Time to Buy and Sell Stock', platform: 'LeetCode', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'easy', topic_ids: ['two_pointers'], created_date: getRelativeDate(-8) },
  { id: 'p12', title: 'Longest Substring Without Repeating Characters', platform: 'LeetCode', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'medium', topic_ids: ['two_pointers', 'hashing'], created_date: getRelativeDate(-7) },

  // Binary Search (Avoided topic: importance 4, only 1 problem & attempt!)
  { id: 'p13', title: 'Binary Search', platform: 'LeetCode', link: 'https://leetcode.com/problems/binary-search/', difficulty: 'easy', topic_ids: ['binary_search'], created_date: getRelativeDate(-16) },

  // Stacks & Queues
  { id: 'p14', title: 'Valid Parentheses', platform: 'LeetCode', link: 'https://leetcode.com/problems/valid-parentheses/', difficulty: 'easy', topic_ids: ['stacks_queues'], created_date: getRelativeDate(-14) },
  { id: 'p15', title: 'Min Stack', platform: 'LeetCode', link: 'https://leetcode.com/problems/min-stack/', difficulty: 'medium', topic_ids: ['stacks_queues'], created_date: getRelativeDate(-12) },
  { id: 'p16', title: 'Evaluate Reverse Polish Notation', platform: 'LeetCode', link: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', difficulty: 'medium', topic_ids: ['stacks_queues'], created_date: getRelativeDate(-9) },
  { id: 'p17', title: 'Daily Temperatures', platform: 'LeetCode', link: 'https://leetcode.com/problems/daily-temperatures/', difficulty: 'medium', topic_ids: ['stacks_queues'], created_date: getRelativeDate(-6) },
  { id: 'p18', title: 'Generate Parentheses', platform: 'LeetCode', link: 'https://leetcode.com/problems/generate-parentheses/', difficulty: 'medium', topic_ids: ['stacks_queues'], created_date: getRelativeDate(-4) },

  // Recursion
  { id: 'p19', title: 'Fibonacci Number', platform: 'LeetCode', link: 'https://leetcode.com/problems/fibonacci-number/', difficulty: 'easy', topic_ids: ['recursion'], created_date: getRelativeDate(-10) },
  { id: 'p20', title: 'Reverse Linked List', platform: 'LeetCode', link: 'https://leetcode.com/problems/reverse-linked-list/', difficulty: 'easy', topic_ids: ['recursion'], created_date: getRelativeDate(-8) },
  { id: 'p21', title: 'Merge Two Sorted Lists', platform: 'LeetCode', link: 'https://leetcode.com/problems/merge-two-sorted-lists/', difficulty: 'easy', topic_ids: ['recursion'], created_date: getRelativeDate(-5) },
  { id: 'p22', title: 'Pow(x, n)', platform: 'LeetCode', link: 'https://leetcode.com/problems/powx-n/', difficulty: 'medium', topic_ids: ['recursion'], created_date: getRelativeDate(-3) },
  { id: 'p23', title: 'K-th Symbol in Grammar', platform: 'LeetCode', link: 'https://leetcode.com/problems/k-th-symbol-in-grammar/', difficulty: 'medium', topic_ids: ['recursion'], created_date: getRelativeDate(-2) },

  // Backtracking (Only 2 attempts -> shaky prerequisite for DP)
  { id: 'p24', title: 'Subsets', platform: 'LeetCode', link: 'https://leetcode.com/problems/subsets/', difficulty: 'medium', topic_ids: ['backtracking'], created_date: getRelativeDate(-4) },
  { id: 'p25', title: 'Permutations', platform: 'LeetCode', link: 'https://leetcode.com/problems/permutations/', difficulty: 'medium', topic_ids: ['backtracking'], created_date: getRelativeDate(-3) },

  // Trees (Failing prerequisite: only 3 attempts, 33% success -> locks Graphs!)
  { id: 'p26', title: 'Invert Binary Tree', platform: 'LeetCode', link: 'https://leetcode.com/problems/invert-binary-tree/', difficulty: 'easy', topic_ids: ['trees'], created_date: getRelativeDate(-6) },
  { id: 'p27', title: 'Maximum Depth of Binary Tree', platform: 'LeetCode', link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', difficulty: 'easy', topic_ids: ['trees'], created_date: getRelativeDate(-5) },
  { id: 'p28', title: 'Binary Tree Level Order Traversal', platform: 'LeetCode', link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', difficulty: 'medium', topic_ids: ['trees'], created_date: getRelativeDate(-3) },

  // Graphs (LOCKED because Trees prerequisite is < 5 attempts & < 60% success)
  { id: 'p29', title: 'Number of Islands', platform: 'LeetCode', link: 'https://leetcode.com/problems/number-of-islands/', difficulty: 'medium', topic_ids: ['graphs'], created_date: getRelativeDate(-2) },

  // Dynamic Programming (Word Break is a LEECH: 3 failures, EF 1.4)
  { id: 'p30', title: 'Climbing Stairs', platform: 'LeetCode', link: 'https://leetcode.com/problems/climbing-stairs/', difficulty: 'easy', topic_ids: ['dp'], created_date: getRelativeDate(-5) },
  { id: 'p31', title: 'Coin Change', platform: 'LeetCode', link: 'https://leetcode.com/problems/coin-change/', difficulty: 'medium', topic_ids: ['dp'], created_date: getRelativeDate(-4) },
  { id: 'p32', title: 'Word Break', platform: 'LeetCode', link: 'https://leetcode.com/problems/word-break/', difficulty: 'medium', topic_ids: ['dp'], created_date: getRelativeDate(-6) },
];

export const SEED_ATTEMPTS: Attempt[] = [
  // Arrays & Hashing (Strong: ~10 attempts, high success)
  { id: 'a1', problem_id: 'p1', date: getRelativeDate(-7), status: 'solved', time_taken: 12, mistake_tag: 'none', recall_quality: 5, notes: 'Hash map single pass clean' },
  { id: 'a2', problem_id: 'p2', date: getRelativeDate(-19), status: 'solved', time_taken: 8, mistake_tag: 'none', recall_quality: 5 },
  { id: 'a3', problem_id: 'p3', date: getRelativeDate(-18), status: 'solved', time_taken: 9, mistake_tag: 'none', recall_quality: 4 },
  { id: 'a4', problem_id: 'p4', date: getRelativeDate(-15), status: 'solved', time_taken: 20, mistake_tag: 'complexity', recall_quality: 4, notes: 'Used tuple count signature' },
  { id: 'a5', problem_id: 'p5', date: getRelativeDate(-14), status: 'hint', time_taken: 25, mistake_tag: 'complexity', recall_quality: 3, notes: 'Bucket sort hint needed' },
  { id: 'a6', problem_id: 'p6', date: getRelativeDate(-13), status: 'solved', time_taken: 18, mistake_tag: 'none', recall_quality: 4 },
  { id: 'a7', problem_id: 'p7', date: getRelativeDate(-12), status: 'solved', time_taken: 22, mistake_tag: 'edge_case', recall_quality: 4 },

  // Two Pointers
  { id: 'a8', problem_id: 'p8', date: getRelativeDate(-11), status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 },
  { id: 'a9', problem_id: 'p9', date: getRelativeDate(-10), status: 'failed', time_taken: 35, mistake_tag: 'off_by_one', recall_quality: 1, notes: 'Duplicate skipping pointer bug' },
  { id: 'a10', problem_id: 'p9', date: getRelativeDate(-8), status: 'solved', time_taken: 20, mistake_tag: 'none', recall_quality: 4 },
  { id: 'a11', problem_id: 'p10', date: getRelativeDate(-9), status: 'solved', time_taken: 15, mistake_tag: 'none', recall_quality: 4 },
  { id: 'a12', problem_id: 'p11', date: getRelativeDate(-8), status: 'solved', time_taken: 11, mistake_tag: 'none', recall_quality: 5 },
  { id: 'a13', problem_id: 'p12', date: getRelativeDate(-7), status: 'solved', time_taken: 24, mistake_tag: 'edge_case', recall_quality: 4 },

  // Binary Search (Avoided: only 1 attempt!)
  { id: 'a14', problem_id: 'p13', date: getRelativeDate(-16), status: 'solved', time_taken: 14, mistake_tag: 'off_by_one', recall_quality: 3 },

  // Stacks & Queues (5 attempts, good)
  { id: 'a15', problem_id: 'p14', date: getRelativeDate(-14), status: 'solved', time_taken: 10, mistake_tag: 'none', recall_quality: 5 },
  { id: 'a16', problem_id: 'p15', date: getRelativeDate(-12), status: 'solved', time_taken: 18, mistake_tag: 'none', recall_quality: 4 },
  { id: 'a17', problem_id: 'p16', date: getRelativeDate(-9), status: 'solved', time_taken: 21, mistake_tag: 'syntax', recall_quality: 4 },
  { id: 'a18', problem_id: 'p17', date: getRelativeDate(-4), status: 'hint', time_taken: 28, mistake_tag: 'logic', recall_quality: 3, notes: 'Monotonic stack pattern' },
  { id: 'a19', problem_id: 'p18', date: getRelativeDate(-3), status: 'solved', time_taken: 22, mistake_tag: 'none', recall_quality: 4 },

  // Recursion (5 attempts, 100% success -> unlocked)
  { id: 'a20', problem_id: 'p19', date: getRelativeDate(-10), status: 'solved', time_taken: 5, mistake_tag: 'none', recall_quality: 5 },
  { id: 'a21', problem_id: 'p20', date: getRelativeDate(-8), status: 'solved', time_taken: 12, mistake_tag: 'none', recall_quality: 4 },
  { id: 'a22', problem_id: 'p21', date: getRelativeDate(-5), status: 'solved', time_taken: 14, mistake_tag: 'none', recall_quality: 4 },
  { id: 'a23', problem_id: 'p22', date: getRelativeDate(-2), status: 'solved', time_taken: 25, mistake_tag: 'edge_case', recall_quality: 4 },
  { id: 'a24', problem_id: 'p23', date: getRelativeDate(-1), status: 'solved', time_taken: 30, mistake_tag: 'logic', recall_quality: 4 },

  // Backtracking (Only 2 attempts -> DP prerequisite chain alert)
  { id: 'a25', problem_id: 'p24', date: getRelativeDate(-4), status: 'solved', time_taken: 25, mistake_tag: 'none', recall_quality: 4 },
  { id: 'a26', problem_id: 'p25', date: getRelativeDate(-2), status: 'hint', time_taken: 30, mistake_tag: 'complexity', recall_quality: 3 },

  // Trees (Only 3 attempts, 1 solved out of 3 = 33% success rate -> LOCKS Graphs!)
  { id: 'a27', problem_id: 'p26', date: getRelativeDate(-6), status: 'solved', time_taken: 15, mistake_tag: 'none', recall_quality: 4 },
  { id: 'a28', problem_id: 'p27', date: getRelativeDate(-5), status: 'failed', time_taken: 25, mistake_tag: 'logic', recall_quality: 1 },
  { id: 'a29', problem_id: 'p28', date: getRelativeDate(-3), status: 'failed', time_taken: 35, mistake_tag: 'edge_case', recall_quality: 1 },

  // DP (Climbing stairs solved, Coin Change hint, Word break is LEECH)
  { id: 'a30', problem_id: 'p30', date: getRelativeDate(-5), status: 'solved', time_taken: 12, mistake_tag: 'none', recall_quality: 4 },
  { id: 'a31', problem_id: 'p31', date: getRelativeDate(-4), status: 'hint', time_taken: 35, mistake_tag: 'complexity', recall_quality: 3 },

  // Word Break LEECH: 3 failures!
  { id: 'a32', problem_id: 'p32', date: getRelativeDate(-6), status: 'failed', time_taken: 40, mistake_tag: 'tle', recall_quality: 1 },
  { id: 'a33', problem_id: 'p32', date: getRelativeDate(-4), status: 'failed', time_taken: 35, mistake_tag: 'logic', recall_quality: 1 },
  { id: 'a34', problem_id: 'p32', date: getRelativeDate(-1), status: 'failed', time_taken: 45, mistake_tag: 'edge_case', recall_quality: 1, notes: 'Leech: 3 consecutive fails, memory limit exceeded' },

  // Recent attempts ensuring 5-day continuous streak (today, -1d, -2d, -3d, -4d)
  { id: 'a35', problem_id: 'p1', date: getRelativeDate(0), status: 'solved', time_taken: 15, mistake_tag: 'none', recall_quality: 5, notes: 'Streak keeper for today' },
];

export const SEED_REVISIONS: Revision[] = [
  // Two sum: Due TODAY!
  { problem_id: 'p1', next_due_date: getRelativeDate(0), interval_index: 2, interval_days: 7, ease_factor: 2.5, repetitions: 2, failed_count: 0, leech_flag: false },
  // Contains duplicate: upcoming in 4 days
  { problem_id: 'p2', next_due_date: getRelativeDate(4), interval_index: 3, interval_days: 14, ease_factor: 2.6, repetitions: 3, failed_count: 0, leech_flag: false },
  // 3Sum: due tomorrow
  { problem_id: 'p9', next_due_date: getRelativeDate(1), interval_index: 1, interval_days: 3, ease_factor: 2.3, repetitions: 1, failed_count: 1, leech_flag: false },
  // Invert Binary tree: due in 2 days
  { problem_id: 'p26', next_due_date: getRelativeDate(2), interval_index: 1, interval_days: 3, ease_factor: 2.4, repetitions: 1, failed_count: 0, leech_flag: false },
  // Coin Change: due in 3 days
  { problem_id: 'p31', next_due_date: getRelativeDate(3), interval_index: 1, interval_days: 3, ease_factor: 2.1, repetitions: 1, failed_count: 0, leech_flag: false },
  // Word Break: LEECH! failed 3 times, EF 1.4 < 1.5, next due today for relearning
  { problem_id: 'p32', next_due_date: getRelativeDate(0), interval_index: 0, interval_days: 1, ease_factor: 1.4, repetitions: 0, failed_count: 3, leech_flag: true },
];

