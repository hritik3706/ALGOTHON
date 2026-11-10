# 01b: Phase 1 smooth-execution addendum (Algothon)

Use this **alongside** `01_Brief_Frontend_Phase1.md`. File 01 says *what* to build. This file says *how to get it built without drift*: brand details, a plan-first kickoff prompt, eight small build steps with checkpoints, ready-made CSS starting points, seed data you can paste, and fixes for common problems.

The site is called **Algothon**.

## 1. Pre-flight checklist

- [ ] Repo created, `docs/` folder contains `01_Brief_Frontend_Phase1.md`, this file, and `design-reference.png`.
- [ ] Stack chosen. Default if undecided: **TypeScript + React + Vite + Tailwind CSS** (or plain CSS variables if you prefer to avoid Tailwind), with **Vitest** for tests later.
- [ ] Node and a package manager installed.
- [ ] You know how to run the dev server and open it at 375px and 1440px widths (browser dev tools).
- [ ] You are on a new git branch: `phase-1-frontend`.

## 2. Algothon brand sheet

| Item | Value |
|---|---|
| Name | **Algothon** (capital A, rest lowercase in the wordmark) |
| Wordmark | Instrument Serif, regular, about 20px in the nav, lime dot or mark to its left |
| Logo mark | A 28px rounded square in `#C6F432` containing three dark nodes joined by two lines (a tiny DAG: one parent, two children). Draw it as inline SVG so it scales and needs no asset |
| Favicon | The same mark as an SVG favicon |
| Page title | `Algothon: know what to practise today` |
| Meta description | `Log DSA problems, find weak topics, and get a short daily plan with spaced revision.` |
| Hero headline | `Practice *smarter* than *your streak.*` (italic on the emphasised parts) |
| Hero subline | `Log every problem. Find weak topics. Revise at the right time, before you forget.` |
| Primary CTA | `Start tracking` |
| Secondary CTA | `See today's plan` |
| Nav links | Features, Topics, Planner, Docs |
| Nav toggle | `Sign in` / `Start tracking` (Sign in can be a disabled placeholder: there is no auth in v1) |
| Footer line | `Algothon. Built for interview prep.` |

## 3. Seed data

**Topics** (id, prerequisites, importance)
- `arrays`: Arrays (prereqs: none, imp: 5)
- `hashing`: Hashing (prereqs: arrays, imp: 5)
- `two_pointers`: Two pointers and sliding window (prereqs: arrays, imp: 4)
- `binary_search`: Binary search (prereqs: arrays, imp: 4)
- `stacks_queues`: Stacks and queues (prereqs: arrays, imp: 3)
- `recursion`: Recursion (prereqs: arrays, imp: 4)
- `backtracking`: Backtracking (prereqs: recursion, imp: 3)
- `trees`: Trees (prereqs: recursion, stacks_queues, imp: 5)
- `graphs`: Graphs (prereqs: trees, hashing, imp: 5)
- `dp`: Dynamic programming (prereqs: backtracking, imp: 5)

