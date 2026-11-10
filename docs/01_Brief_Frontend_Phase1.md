# 01: Full project brief, frontend design and Phase 1 prompt

**Project:** Algothon, a DSA progress tracker.
**This file contains:** (A) the complete project brief, (B) the frontend design spec based on the reference screenshot, (C) the Phase 1 execution prompt.
**The series:** 01 Brief + Frontend (this file) → 02 Storage, stats, graph → 03 Revision scheduler → 04 Planner and insights → 05 Polish and presentation.

## How to use

1. Save this file in your repo as `docs/01_Brief_Frontend_Phase1.md`. Save the reference screenshot in `docs/design-reference.png`.
2. Open a fresh AI coding session. Paste **Part C** (the Phase 1 prompt) and attach the screenshot. Point the assistant at Parts A and B for context, or paste them too.
3. Do not move to file 02 until the acceptance criteria at the end of this file pass.
4. Files 02 to 05 are self-contained, but this file stays the source of truth. If a later prompt conflicts with it, the assistant should stop and ask.

---

# PART A: Full project brief

Tags: **[ORIGINAL]** from the blueprint, **[ADDED]** new, **[CUT]** dropped or deferred. The tech stack is intentionally unspecified: the implementer chooses per task and states the choice before coding.

## A1. Summary

A tracker for DSA practice that logs problems, detects weak topics, models topic prerequisites as a DAG, schedules spaced revisions, and produces a short daily plan.

- **Target effort:** 20 to 30 focused hours for the core (logging, DAG, scheduler, planner).
- **Primary goal:** a resume/demo project with real algorithmic substance. Every data structure must map to a genuine feature, not be bolted on.

## A2. Problem and solution [ORIGINAL]

- **Problem:** people practise DSA randomly, forget problems within a week and never revisit weak topics. LeetCode shows stats but doesn't say what to do today.
- **Solution:** log problems, find weak topics, know which topics depend on others, resurface failed problems at spaced intervals, and emit a short "Today's plan".
- **Users:** students preparing for placements and coding interviews.

## A3. Differentiation

Spaced-revision trackers already exist. The unique angles are:
1. **Topic dependency graph.** Harder topics stay locked until prerequisites are solid.
2. **Today's plan.** Mixes due revisions and weak topics, interleaved.
3. **Mistake pattern detection.** A fixed enum of 7 tags chosen by number, plus a "most common mistake per topic" stat. No free-text parsing.

## A4. Final scope

**Core (must ship):** logging, notes, stats, weak-topic list; DAG, topological sort and unlock check; spaced revision (min-heap); priority (max-heap) and Today's plan; streak counter.

**High-value adds [ADDED]:** weighted topo sort, prerequisite-path query, SM-2 adaptive intervals, leech detection, Wilson lower bound, interleaved plan, avoidance and plateau detection, minimal mistake tags.

**Nice-to-have [ADDED], pick by time:** critical path, learning frontier, bang-for-buck ranking, topic × difficulty matrix, deadline-aware targets, mock mode, split-day plan, duplicate detection, fuzzy search, markdown export.

**Deferred [CUT]:** heatmap, weekly report, goals UI, timed mock set, external-platform imports, PDF export, public profile.

**Never [TRAP]:** scraping LeetCode or Codeforces; ML prediction of solve time; leaderboards or social features; mobile app or PWA; forced exotic structures (Bloom filter, segment tree); elaborate gamification (XP, badges, levels).

## A5. Data model

**Topic**: `id`, `name`, `prerequisites[]` (topic ids), `importance_weight` (1 to 5). Prerequisite edges are hand-authored content work; budget a few hours.

**Problem**: `id`, `title`, `platform`, `link`, `difficulty` (easy / medium / hard), `topic_ids[]`, `created_date`, `url_hash`.

**Attempt**: `id`, `problem_id`, `date`, `status` (solved / hint / failed), `time_taken`, `mistake_tag`, `recall_quality` (0 to 5), `notes`.
`mistake_tag` enum: `off_by_one | edge_case | complexity | tle | logic | syntax | none`.

**Revision**: `problem_id`, `next_due_date`, `interval_index`, `interval_days`, `ease_factor` (init 2.5, floor 1.3), `repetitions`, `failed_count`, `leech_flag`.

**Goal** (only if deadline targets are built): `topic_id`, `target_count`, `deadline`.
**Event log** (only if event sourcing is chosen): `event_type`, `payload`, `timestamp`.

**Integrity rules:** every topic id on a problem must exist; the prerequisite graph is acyclic; one Revision per problem; `recall_quality` is 0 to 5; deleting a problem cascades to its attempts and revision.

## A6. Algorithms

### Spaced revision
- **Fixed intervals [ORIGINAL]:** 1, 3, 7, 14, 30 days. Failed resets to the first interval, hint repeats the current one, clean advances. Min-heap keyed by `next_due_date`.
- **SM-2 [ADDED, recommended]:**
  ```
  EF' = max(1.3, EF + 0.1 - (5-q)*(0.08 + (5-q)*0.02))   // q = recall quality 0-5
  interval_1 = 1 day, interval_2 = 6 days, interval_n = round(interval_{n-1} * EF')
  if q < 3: reset interval to 1 day, keep EF
  ```
- **Leech detection [ADDED]:** flag when `failed_count >= 3` or `EF < 1.5`. Leeches skip advancement and are surfaced as "relearn from scratch".

### Topic unlocking [ORIGINAL]
A topic is unlocked when every prerequisite has `attempts >= 5` and `success_rate >= 0.60`. Trying a locked topic gives a warning and names the weakest prerequisite. Thresholds are tunable.

### Topic priority
Start with `priority = 0.6 * weakness + 0.4 * staleness` and add importance only after a week of real use. Max-heap on the score.
Wilson lower bound replaces the raw success rate (z = 1.96):
```
LB = (p + z²/2n - z*sqrt(p(1-p)/n + z²/4n²)) / (1 + z²/n)     weakness = 1 - LB
```
So "1/1 solved" no longer outranks "18/20".

### Today's plan
1. Take 2 to 3 due revisions from the min-heap.
2. Pop the top unlocked topics from the max-heap.
3. Pick 1 to 2 new problems from them.
4. Total 3 to 5 items.
5. **Interleaving:** no two items from the same topic when 3 or more topics are available (greedy with backtracking).
6. Optional split-day: morning is a new problem, evening is revisions.

### Graph algorithms
- DAG, Kahn's topological sort, and cycle detection (tested explicitly).
- Weighted topo sort: Kahn's with a priority queue on `importance_weight`.
- Prerequisite path query: backward BFS to get the shortest chain of locked topics.
- Critical path (longest chain, DP on DAG), learning frontier (downstream reachability) and bang-for-buck `(reach × importance) / max(1, attempts)` are optional.

### Stats engine
- Per-topic attempts, success rate, last attempt date, top mistake.
- **Avoidance:** topics with attempt share well below their importance share.
- **Plateau/velocity:** last N attempts vs previous N, labelled improving / flat / regressing.
- Topic × difficulty matrix (optional).
- **Streak** and last-7-days summary.

## A7. Modules and structure

Six modules: Storage, Stats engine, Topic graph, Revision scheduler, Planner, Interface. Dependencies are one-directional (Storage ← Stats ← Graph; Storage ← Scheduler; Planner uses Stats, Graph and Scheduler; Interface uses all). Event sourcing, if built, is a storage-layer concern only.

```
dsa-tracker/
  src/       main, storage, stats, topic_graph, scheduler, planner
  data/      topics, problems, attempts, revisions
  tests/
  docs/      this brief, prompts, design reference
  README.md
```

## A8. Functional and non-functional requirements (summary)

- Log a problem and an attempt in 20 seconds or less; enums chosen by number.
- Edit and delete problems and attempts; derived state recomputes.
- Persistent, atomic storage; corrupt storage never crashes or silently overwrites.
- Responses under 200 ms with about 1,000 problems and 5,000 attempts.
- Deterministic plan: same data and same "today" give the same plan. Inject the clock.
- Core logic is pure, with 85% or more coverage on scheduler, graph, stats and planner.
- All data stays local; no network calls.

---

# PART B: Frontend design spec

**Reference:** the attached screenshot of a dark landing page ("Northline") with a lime glow behind a serif italic headline, flanking stat blocks, and three tilted dashboard cards. The three swatches shown are **Midnight Black `#0B0B0C`**, **Pure White `#FFFFFF`** and **Lime Green `#C6F432`**. Follow the reference closely. Where this spec says "tune by eye," compare against the screenshot.

## B1. Design principles

1. **Dark canvas, one loud color.** Lime is the only saturated color. Use it for primary actions, key numbers, chart lines, "unlocked" states and the "now" marker.
2. **Type carries the personality.** A high-contrast serif for headlines and big numbers (upright and italic mixed for emphasis), mono for body copy and small labels, a clean sans for UI controls.
3. **Depth from light, not shadow.** A lime-to-transparent vertical glow behind the hero and a soft radial glow under the cards. Cards are near-black with hairline borders.
4. **Pill shapes** for buttons, toggles and status badges.
5. **Spend boldness once.** The hero is the memorable moment. The app screens stay quiet and legible.
6. **Motion only where it helps.** One orchestrated page-load reveal on the hero. Everything else answers user actions. Respect reduced motion.

## B2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B0B0C` | Page background (Midnight Black) |
| `--fg` | `#FFFFFF` | Primary text (Pure White) |
| `--accent` | `#C6F432` | Primary actions, highlights (Lime Green) |
| `--surface` | `#121214` | Cards (derived) |
| `--surface-2` | `#17171A` | Raised or hovered surfaces (derived) |
| `--border` | `rgba(255,255,255,0.08)` | Hairline borders (derived) |
| `--fg-muted` | `rgba(255,255,255,0.60)` | Secondary text (derived) |
| `--fg-faint` | `rgba(255,255,255,0.38)` | Captions, axes (derived) |
| `--accent-ink` | `#0B0B0C` | Text on lime buttons |
| `--accent-glow` | `rgba(198,244,50,0.35)` | Glow layers |
| `--danger` | `#E5604D` | Failed and leech states, used sparingly |

**Status pills:** *Due / In progress* = lime outline; *Solved / Done* = lime filled with dark text; *Draft / Neutral* = grey; *Failed / Leech* = muted red.

## B3. Typography

| Role | Font | Used for |
|---|---|---|
| Display | **Instrument Serif** (regular + italic) | Headlines, big numbers, page titles |
| UI | **Geist** or **Inter** | Nav, buttons, forms, tables |
| Mono | **JetBrains Mono** or **Geist Mono** | Hero subline, small labels, stat captions, pill text |

## B4. Shape and effects

- Buttons and pills: radius 999px. Cards: radius 16px. Borders: 1px hairline.
- Hero glow: vertical gradient from `--accent-glow` to transparent behind the headline (peaks near the center), plus a soft radial glow below the cards.
- Landing cards are tilted slightly (left card rotated about −4°, right card about +4°, centre card flat and a little larger). They flatten at mobile widths.

