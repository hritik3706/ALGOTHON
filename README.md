# Algothon: DSA Practice Tracker & Spaced Scheduler

> Practice *smarter* than *your streak.* Log every problem. Find weak topics. Revise at the right time, before you forget.

Algothon is a precision algorithmic tracker for technical interview preparation. It eliminates random practice, models topic prerequisites as a Directed Acyclic Graph (DAG), schedules spaced revisions using SuperMemo-2 with automated leech defense, and produces an interleaved daily plan of 3 to 5 high-impact items.

---

## DSA Used and Why

Every data structure and algorithm in Algothon maps directly to a genuine user capability:

| Data Structure / Algorithm | Feature | Time Complexity | Space Complexity | Why It Was Chosen |
|---|---|---|---|---|
| **Min-Heap** (`DueQueue`) | Spaced Revision Queue | $O(\log N)$ push / pop | $O(N)$ | Resurfaces due revisions strictly in ascending order of due date, handling overdue items first with deterministic tie-breaking. |
| **Max-Heap** (`PriorityQueue`) | Topic Priority & Daily Planner | $O(\log K)$ push / pop | $O(K)$ | Prioritizes unlocked topics by combined weakness and staleness scores ($0.6 \times \text{weakness} + 0.4 \times \text{staleness}$). |
| **DAG & Kahn's Algorithm** (`TopicGraph`) | Topological Ordering & Cycle Detection | $O(V + E)$ | $O(V + E)$ | Enforces prerequisite order and detects circular dependency errors with exact cycle path diagnostic reporting. |
| **Priority-Queue Kahn's** | Weighted Topological Sort | $O(V \log V + E)$ | $O(V + E)$ | Front-loads high-importance interview topics while strictly preserving prerequisite dependencies. |
| **Backward BFS** | Shortest Prerequisite Path Query | $O(V + E)$ | $O(V)$ | Computes the shortest chain of locked prerequisites when exploring "What do I need before topic X?". |
| **SM-2 Recurrence** (`RevisionScheduler`) | Spaced Repetition Scheduling | $O(1)$ | $O(1)$ | Adapts ease factors and stretches review intervals based on user recall quality ($q \in [0, 5]$). |
| **Wilson Lower Bound** | Weak-Topic Ranking | $O(1)$ | $O(1)$ | Prevents small-sample bias so that 18/20 solves is mathematically recognized as stronger mastery than 1/1. |
| **Ring Buffer** | Plateau & Velocity Detection | $O(N)$ ($N=5$) | $O(N)$ | Compares success rate of the last 5 attempts against the previous 5 to detect regressions or improvements. |
| **Greedy with Backtracking** | Interleaved Daily Planner | $O(K)$ | $O(K)$ | Guarantees that when $\ge 3$ distinct topics are available, no two items in the plan share a topic. |

---

## Design Decisions

1. **Why SM-2 Spaced Repetition?**
   Fixed interval ladders (e.g., 1, 3, 7, 14 days) fail when a problem is difficult or mastered quickly. SM-2 dynamically adjusts each problem's Ease Factor ($\text{EF} \ge 1.3$), allowing mastered problems to stretch to weeks while struggling problems return tomorrow.
2. **Why Leech Quarantine Defense?**
   When a problem fails $\ge 3$ times or its ease factor drops below 1.5, continued interval stretching is useless. Algothon quarantines it as a "Leech" for scratch relearning before allowing interval advancement.
3. **Why Wilson Lower Bound over Raw Success Rate?**
   Raw percentage rates suffer from severe small-sample bias: a topic with 1 attempt and 1 solve displays "100%", while a topic with 18 solves out of 20 displays "90%". Wilson 95% confidence intervals calculate the lower bound of true capability ($18/20 \approx 0.70$ vs $1/1 \approx 0.21$), prioritizing practice where it is genuinely needed.
4. **Why a Prerequisite DAG?**
   Practicing Dynamic Programming before understanding Recursion or Backtracking causes frustration. Algothon's prerequisite graph locks advanced topics until prerequisites demonstrate $\ge 5$ attempts and $\ge 60\%$ success.
5. **Why Topic Interleaving?**
   Cognitive science demonstrates that blocked practice (solving 5 tree problems in a row) creates an illusion of mastery. Interleaving varied topics in the 3–5 item daily plan forces the brain to retrieve distinct algorithmic paradigms.

---

## Project Structure

```
c:\ALGOTHON\
├── docs/
│   ├── 01_Brief_Frontend_Phase1.md
│   ├── DEMO.md                  # 2-minute step-by-step walkthrough
│   ├── RESUME.md                # 4 stack-neutral resume bullets
│   ├── design-reference.png     # Reference dark UI design
│   └── graph-reference.png      # Reference NeetCode tree visualizer
├── src/
│   ├── core/                    # Pure algorithmic core modules (I/O-free)
│   │   ├── graph/
│   │   │   ├── TopicGraph.ts    # Kahn's sort, cycle naming, weighted order, backward BFS
│   │   │   └── PriorityQueue.ts # Generic Max-Heap
│   │   ├── scheduler/
│   │   │   ├── RevisionScheduler.ts # SM-2 recurrence, fixed intervals, leech quarantine
│   │   │   └── DueQueue.ts      # Min-Heap keyed on (next_due_date, problem_id)
│   │   ├── planner/
│   │   │   └── Planner.ts       # Topic priority max-heap & greedy interleaved planner
│   │   ├── stats/
│   │   │   ├── StatsEngine.ts   # Wilson lower bound, solve rates, top mistakes
│   │   │   └── Insights.ts      # Avoidance bias, plateau ring buffer, streak counter
│   │   ├── storage/
│   │   │   ├── Storage.ts       # CRUD, cascade delete, integrity checks, backup
│   │   │   ├── LocalStorageAdapter.ts # Atomic staging key browser persistence
│   │   │   └── FileStorageAdapter.ts  # Atomic temp file Node/test persistence
│   │   └── storeManager.ts      # Coordinating store manager
│   ├── api/
│   │   └── index.ts             # Clean data layer exporting Promises
│   ├── components/
│   │   ├── brand/LogoMark.tsx   # 28px #C6F432 rounded DAG logo mark
│   │   ├── common/              # Button, Pill, Card, StatBlock, FormField, NumberedSelect, Toast
│   │   └── landing/             # HeroGlow, TodaysPlanCard, TopicStrengthCard, RevisionTimelineCard
│   ├── pages/
│   │   ├── LandingPage.tsx      # High-contrast serif landing experience
│   │   └── app/                 # Today, Log (autocomplete), Topics, Graph (NeetCode tree), Revisions, Insights
│   └── styles/index.css         # Midnight Black, Pure White, Lime Green tokens
└── tests/                       # 38 passing Vitest unit & e2e integration tests
    ├── statsEngine.test.ts
    ├── topicGraph.test.ts
    ├── scheduler.test.ts
    ├── planner.test.ts
    ├── insights.test.ts
    ├── storage.test.ts
    └── e2e.test.ts
```

---

## How to Run & Test

```bash
# 1. Run all 49 unit, architecture, and end-to-end integration tests:
npm test

# 2. Verify production build:
npm run build

# 3. Start development server:
npm run dev
```

---

## What Makes Algothon World-Class

1. **"Paper on Night" Aesthetic:** Physical cream paper flashcards set against deep navy canvases (`#0B1326`, `#14213D`) with Newsreader display serif typography, Geist UI sans, and atmospheric coral glow accents (`#FF6B5B`).
2. **True 3D Flashcard Practice Mode:** Real 600ms CSS 3D perspective flip with disabled rating buttons until the solution is revealed, followed by SM-2 schedule updates.
3. **Coach AI Practice Assistant:** 100% offline-first intelligent study assistant with zero network calls, client-side intent routing, and confirmation cards for database mutations.
4. **Data Ownership & Portability:** Complete JSON backup import/export and human-readable Markdown study notes export with zero vendor lock-in.
5. **Zero-Fluff Algorithmic Integrity:** Min-heap due queues, DAG topological sorts, Wilson 95% confidence intervals, and greedy interleaving. Every number traces directly to mathematical computations on user storage.
