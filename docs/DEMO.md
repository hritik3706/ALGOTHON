# 2-Minute Product Demo Script: Algothon

This script demonstrates every algorithmic feature in Algothon using the clean seed dataset. Follow the clicks in order.

---

### Step 1: Add a Failed Problem & See Weak Topics Update
1. Open the app and navigate to **Log Attempt** (`/app`).
2. In **Problem Title**, type `Word Break`.
3. Choose Status: `Failed` (Mistake tag defaults or select `6: Logic`, Recall quality defaults to `1`).
4. Click **Log attempt**.
5. *Result*: A toast confirms `"Attempt logged"`. Navigate to **Topics** screen: Dynamic Programming's strength drops, and its Wilson lower bound score highlights it as a weak topic.

### Step 2: Attempt a Locked Topic & Inspect Prerequisite Warning
1. On the **Topics** screen, find **Graphs**.
2. Notice the `Locked` pill badge.
3. Click the warning line: `Needs: Trees (3/5 att, 33%)`.
4. *Result*: The system explicitly refuses premature progression and names the failing prerequisite: Trees must achieve $\ge 5$ attempts and $\ge 60\%$ success rate before Graphs will unlock.

### Step 3: Prerequisite Path Explorer ("What do I need before DP?")
1. Still on the **Topics** screen, look at the **Prerequisite Explorer** at the top.
2. In the dropdown, select **Dynamic Programming**.
3. *Result*: The backward BFS immediately returns the shortest prerequisite chain:
   $$\text{Recursion} \longrightarrow \text{Backtracking} \longrightarrow \text{Dynamic Programming (Goal)}$$
   Identifying that Backtracking only has 2 attempts and is the blocking bottleneck.

### Step 4: Examine the NeetCode-Style Topic Roadmap
1. Click **Topic Graph** in the sidebar.
2. *Result*: Notice the full visual hierarchy:
   - `Arrays` at the top with a green mastery progress bar.
   - Orthogonal branches connecting into `Two Pointers`, `Stack`, `Binary Search`, `Trees`, etc.
   - Click **Graphs**: Notice the red border and locked status with the exact prerequisite deficit displayed in the right-side inspector.

### Step 5: Check Avoidance Bias Detection
1. Click **Insights** in the sidebar.
2. *Result*: Observe the **Avoidance Bias Detected** banner:
   - **Binary Search** has an importance weight of 4/5 (expected share ~10%), but only 1 attempt has been logged (~3% actual share).
   - The diagnostic engine flags Binary Search as avoided and prioritizes it in Today's Plan.

### Step 6: Review Today's Interleaved Practice Plan
1. Click **Today's Plan** in the sidebar.
2. *Result*: A focused daily plan of 3–5 items is generated:
   - Item 1: `Two Sum` (Due Revision from the min-heap)
   - Item 2: `Subsets` (New problem from highest-priority weak unlocked topic)
   - Item 3: `Word Break` (Quarantined leech for scratch relearning)
   - Strict interleaving ensures no two adjacent items share a topic!

### Step 7: Log a Clean Solve & Watch the Interval Stretch
1. On the **Today** screen, click **Log attempt** next to `Two Sum`.
2. Choose Status: `Solved Clean` (Recall quality `5`).
3. Click **Log attempt**.
4. Navigate to **Revisions**:
   - `Two Sum` has moved out of the due queue.
   - Its SM-2 interval has stretched from 7 days to **18 days** ($\times \text{EF} = 2.6$).

### Step 8: Clear a Quarantined Leech
1. In the **Revisions** screen, find `Word Break` under **Leech Defense: Quarantined Problems**.
2. Click **Mark relearned**.
3. *Result*: Toast confirms `"Leech cleared"`. The problem is safely returned to normal spaced scheduling!

