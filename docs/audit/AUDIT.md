# Algothon: Comprehensive Discovery and Audit Report

**Date:** 2026-11-13  
**Auditors:** Product Manager, Senior UX Designer, Front-End Architect, Algorithms Reviewer, QA Lead, Accessibility Specialist, Security & Privacy Reviewer, Technical Writer.  
**Workspace:** `c:\ALGOTHON`  
**Commit Baseline:** `b347265` (`upgrade/world-class`)  
**Test Suite Baseline:** 39 passed, 7 test files, vitest v2.1.9  
**Build Status:** Clean TypeScript compile (`tsc && vite build`), 0 errors  

---

## 1. Product & Practice Flows

### Findings
- **[CRITICAL] First-Run Cold Start UX:** In an empty state, while the first-boot empty database is technically clean, a brand new user arrives with zero problems, zero topics unlocked except roots, and no guided onboarding. Time-to-first-plan is stalled unless the user discovers "Load demo data" or manually fills out the full Log drawer.
- **[HIGH] Flashcard Practice Flow Missing:** The PRD specifies spaced repetition where every problem is experienced as a flashcard with a front (problem title, platform, difficulty, topic dependencies) and a back (pattern notes, solution insight, recall rating 0–5). The existing UI only offered a raw "Log attempt" form rather than an active flashcard review experience.
- **[HIGH] Lack of Direct Search & Problem Library:** There is no dedicated problem search or filterable problem list page. Problems are only listed if they are due or in the today plan.
- **[MEDIUM] Inconsistent Plan Size Controls:** The daily plan size is fixed at 3–5 items in `Planner.ts` without user settings for daily time budget or practice intensity.

**Reviewed by:** Product Manager & UX Lead  

---

## 2. Correctness of Core Algorithms

### Findings
- **[HIGH] Cycle Detection Error Handling in TopicGraph:** While Kahn's topological sort is implemented with an index pointer ($O(V+E)$), cyclic graphs return a truncated ordering rather than throwing a descriptive, typed `GraphCycleError` naming the cycle path.
- **[HIGH] Leech Quarantine Release Boundary:** `markRelearned` resets the leech flag and sets interval to 1 day, but ease factor was previously set to 1.5. If a problem fails again once, it could immediately re-trigger leech status without adequate grace period.
- **[MEDIUM] Wilson Score Parameter Tuning:** Wilson score uses $z=1.96$ (95% confidence). This appropriately penalizes $1/1$ vs $18/20$, but when $n=0$ the lower bound is 0.0, which conflates "untested" with "failed". A distinction between `isUntested` and `weakness` must be maintained.
- **[LOW] SM-2 Ease Factor Floor:** Verified at 1.3 in `RevisionScheduler.ts`, matching SuperMemo-2 specification.

**Reviewed by:** Algorithms Reviewer & QA Lead  

---

## 3. Data Integrity and Persistence

### Findings
- **[HIGH] Missing Export/Import Engine:** Currently there is no export/import mechanism in the UI. If a user clears their browser cache or changes devices, all practice history and notes are permanently lost.
- **[HIGH] Schema Versioning & Migration Mechanism:** `Storage.ts` declares `CURRENT_SCHEMA_VERSION = 1`, but there is no migration dispatch table (`migrations: Record<number, (data: any) => any>`) to migrate data if schema expands (e.g. adding concept cards, settings, custom tags).
- **[MEDIUM] Backup on Reset / Destructive Operations:** Resetting demo data or clearing data does not create an automatic safety backup in `localStorage.getItem('algothon_backup')`.

**Reviewed by:** Systems Architect & Security Reviewer  

---

## 4. Architecture & Code Quality

### Findings
- **[HIGH] Strict Facade Enforcement Test:** Although UI components import from `src/api`, there was no automated test scanning all TSX files in `src/pages` and `src/components` to enforce that no direct internal imports (e.g. `src/core/*`) slip into the UI layer.
- **[MEDIUM] Dead Code & Legacy Types:** Legacy types from earlier iterations should be cleaned and unified. Strict typing (`noImplicitAny`, no `any`) must be verified across all files.

**Reviewed by:** Front-End Architect  

---

## 5. Design & UX Quality ("Paper on Night")

### Findings
- **[HIGH] Visual Palette Realignment:** The current visual style is standard dark mode. The target "paper on night" aesthetic requires deep rich Navy (`#0B1326`, `#14213D`), warm Cream flashcard surfaces (`#F4EDE0`), signal Coral (`#FF6B5B`), Newsreader display serif typography, Geist UI sans, and subtle atmospheric coral radial glow.
- **[HIGH] 3D Flashcard Flip Mechanics:** Missing realistic 3D perspective flashcard flip (600ms duration with reduced motion crossfade fallback).
- **[MEDIUM] Command Palette & Global Shortcuts:** Power users require `Ctrl/Cmd+K` command palette for fast navigation and `?` shortcut cheat-sheet.

**Reviewed by:** Senior UX Designer  

---

## 6. Accessibility (WCAG 2.2 AA)

### Findings
- **[HIGH] Focus Visible Styling:** Some interactive cards lack high-contrast outline focus rings (`focus-visible:outline-accent`).
- **[HIGH] Minimum Font Size Standard:** Verified small captions at 8px/9px in some badges; all text must meet minimum 11px/12px for WCAG compliance.
- **[MEDIUM] Live Regions for Dynamic Updates:** State updates and toasts require `aria-live="polite"` so screen readers announce plan changes.

**Reviewed by:** Accessibility Specialist  

---

## 7. Performance & Security

### Findings
- **[MEDIUM] CSS Filter Performance:** Heavy multi-layer `backdrop-blur` and complex SVG filters can cause GPU frame drops on lower-end laptops. Prefer layered radial gradients and CSS box-shadows.
- **[HIGH] XSS Defense on User Notes:** User notes, problem titles, and reflections must always be rendered as pure text (never `dangerouslySetInnerHTML`) to prevent injection.
- **[HIGH] Local-First Privacy Boundary:** No network requests, zero telemetry, no external scripts. Offline mode must be provable with unit tests asserting zero fetch/network calls.

**Reviewed by:** Security & Privacy Reviewer  

---

## 8. Documentation & Developer Experience

### Findings
- **[MEDIUM] Missing ADRs:** Architectural choices (e.g. Coach chatbot design, migration engine, local storage design) lack formal Architecture Decision Records in `docs/adr/`.
- **[MEDIUM] GitHub Actions CI:** Missing automated `.github/workflows/ci.yml` running lint, typecheck, and vitest suites.

**Reviewed by:** Technical Writer & DevOps Lead  
