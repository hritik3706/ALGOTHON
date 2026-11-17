export interface ConceptCard {
  id: string;
  topicId: string;
  topicName: string;
  title: string;
  triggerCondition: string; // "When should you use this?"
  keyInvariant: string; // The core invariant / mathematical principle
  timeComplexity: string;
  spaceComplexity: string;
  codeTemplate: string;
  commonPitfall: string;
}

export const CONCEPT_CARDS: ConceptCard[] = [
  {
    id: 'c1',
    topicId: 'two_pointers',
    topicName: 'Two Pointers',
    title: 'Opposite-End Two Pointers',
    triggerCondition: 'Sorted array where you need pairs summing to target, palindromes, or container with most water.',
    keyInvariant: 'Moving left pointer increases sum/area; moving right pointer decreases it. Monotonicity guarantees no valid pairs are skipped.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    codeTemplate: `left = 0, right = n - 1
while left < right:
    cur = arr[left] + arr[right]
    if cur == target: return (left, right)
    elif cur < target: left += 1
    else: right -= 1`,
    commonPitfall: 'Forgetting that input array MUST be sorted before using opposite-end pointers.',
  },
  {
    id: 'c2',
    topicId: 'two_pointers',
    topicName: 'Sliding Window',
    title: 'Dynamic Sliding Window',
    triggerCondition: 'Find longest/shortest contiguous subarray or substring matching a condition (e.g. at most K distinct elements).',
    keyInvariant: 'Expand window by advancing right pointer. Shrink window from left until validity invariant is restored.',
    timeComplexity: 'O(N) (each index visited at most twice)',
    spaceComplexity: 'O(K) or O(1) hash map/frequency table',
    codeTemplate: `left = 0
for right in range(len(s)):
    add_to_window(s[right])
    while window_is_invalid():
        remove_from_window(s[left])
        left += 1
    ans = max(ans, right - left + 1)`,
    commonPitfall: 'Using nested loops instead of while loop for shrinking, or modifying window state in wrong order.',
  },
  {
    id: 'c3',
    topicId: 'binary_search',
    topicName: 'Binary Search',
    title: 'Binary Search on Solution Space',
    triggerCondition: 'Optimization problem ("minimize the maximum" or "maximize the minimum") with a monotonic feasible(x) predicate.',
    keyInvariant: 'If feasible(x) is True, then feasible(y) is True for all y > x. Bisect the answer range [low, high].',
    timeComplexity: 'O(N log(Range))',
    spaceComplexity: 'O(1)',
    codeTemplate: `low, high = min_possible, max_possible
ans = high
while low <= high:
    mid = (low + high) // 2
    if feasible(mid):
        ans = mid
        high = mid - 1
    else:
        low = mid + 1`,
    commonPitfall: 'Integer overflow in mid calculation or setting low/high to invalid search bounds.',
  },
  {
    id: 'c4',
    topicId: 'stacks_queues',
    topicName: 'Stacks & Queues',
    title: 'Monotonic Stack',
    triggerCondition: 'Finding the Next Greater Element, Next Smaller Element, or Largest Rectangle in Histogram.',
    keyInvariant: 'Maintain stack in strictly monotonic order. Pop elements that violate monotonicity — each popped element has found its boundary.',
    timeComplexity: 'O(N) amortized',
    spaceComplexity: 'O(N)',
    codeTemplate: `stack = [] # stores indices
for i in range(len(arr)):
    while stack and arr[i] > arr[stack[-1]]:
        popped_idx = stack.pop()
        res[popped_idx] = arr[i]
    stack.append(i)`,
    commonPitfall: 'Storing values instead of indices in stack, which prevents calculating distance/width.',
  },
  {
    id: 'c5',
    topicId: 'recursion',
    topicName: 'Linked Lists & Pointers',
    title: "Floyd's Fast & Slow Pointer (Cycle Detection)",
    triggerCondition: 'Detecting cycles in linked lists, find middle element, or duplicate number without extra space.',
    keyInvariant: 'Slow moves 1 step; fast moves 2 steps. In a cycle of length C, distance between them decreases by 1 each step modulo C.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    codeTemplate: `slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
    if slow == fast:
        return True # cycle detected`,
    commonPitfall: 'Not checking fast.next before dereferencing fast.next.next leading to NullPointer / AttributeError.',
  },
  {
    id: 'c6',
    topicId: 'trees',
    topicName: 'Trees',
    title: 'Tree Bottom-Up Post-Order DFS',
    triggerCondition: 'Calculating height, diameter, maximum path sum, or Lowest Common Ancestor (LCA).',
    keyInvariant: 'Compute child subproblem answers first, return aggregated value up to parent, and update global answer at current node.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(Height)',
    codeTemplate: `def dfs(node):
    if not node: return 0
    left = max(0, dfs(node.left))
    right = max(0, dfs(node.right))
    max_path[0] = max(max_path[0], left + right + node.val)
    return max(left, right) + node.val`,
    commonPitfall: 'Using global variable without resetting, or returning both paths to parent instead of single branch.',
  },
  {
    id: 'c7',
    topicId: 'graphs',
    topicName: 'Graphs',
    title: "Breadth-First Search (BFS) for Shortest Path",
    triggerCondition: 'Shortest path in unweighted graphs or matrix grids (word ladder, rotting oranges).',
    keyInvariant: 'Queue processes nodes layer by layer. The first time a node is popped, it is reached with minimum edge distance.',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    codeTemplate: `queue = deque([(start_node, 0)])
visited = {start_node}
while queue:
    node, dist = queue.popleft()
    if node == target: return dist
    for neighbor in graph[node]:
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append((neighbor, dist + 1))`,
    commonPitfall: 'Marking node as visited when POPPING rather than when PUSHING to queue, causing duplicate processing.',
  },
  {
    id: 'c8',
    topicId: 'graphs',
    topicName: 'Graphs',
    title: "Topological Sort (Kahn's Algorithm)",
    triggerCondition: 'Ordering tasks with dependencies, detecting cycles in directed graphs (Course Schedule).',
    keyInvariant: 'Nodes with in-degree 0 have no unmet prerequisites and can be processed immediately. Removing them reduces in-degrees of neighbors.',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V + E)',
    codeTemplate: `in_degree = [0] * n
for u, v in edges: in_degree[v] += 1
queue = deque([i for i in range(n) if in_degree[i] == 0])
order = []
while queue:
    u = queue.popleft()
    order.append(u)
    for v in graph[u]:
        in_degree[v] -= 1
        if in_degree[v] == 0: queue.append(v)
return order if len(order) == n else [] # cycle check`,
    commonPitfall: 'Forgetting to check len(order) == n to detect cycles in directed graphs.',
  },
  {
    id: 'c9',
    topicId: 'backtracking',
    topicName: 'Backtracking',
    title: 'Combinatorial Backtracking Template',
    triggerCondition: 'Subsets, permutations, combinations, or N-Queens search space exploration.',
    keyInvariant: 'Choose an option, explore recursively, un-choose (restore state) so subsequent branches start from clean state.',
    timeComplexity: 'O(2^N) or O(N!)',
    spaceComplexity: 'O(N) recursion stack',
    codeTemplate: `def backtrack(start, path):
    res.append(path[:])
    for i in range(start, len(nums)):
        # Duplicate skipping if array is sorted:
        if i > start and nums[i] == nums[i-1]: continue
        path.append(nums[i])
        backtrack(i + 1, path)
        path.pop()`,
    commonPitfall: 'Appending mutable reference res.append(path) instead of snapshot copy res.append(path[:]).',
  },
  {
    id: 'c10',
    topicId: 'dp',
    topicName: 'Dynamic Programming',
    title: '0/1 Knapsack Space Optimization',
    triggerCondition: 'Subset sum, partition equal subset, knapsack where each item can only be picked once.',
    keyInvariant: 'To compress 2D DP dp[i][w] to 1D dp[w], iterate weight w BACKWARDS so each item is used at most once.',
    timeComplexity: 'O(N × W)',
    spaceComplexity: 'O(W)',
    codeTemplate: `dp = [0] * (target + 1)
dp[0] = 1 # base case
for num in nums:
    for w in range(target, num - 1, -1):
        dp[w] += dp[w - num]`,
    commonPitfall: 'Iterating forwards instead of backwards, which accidentally models Unbounded Knapsack (picking items infinitely).',
  },
];

