# Algothon Comprehensive Upgrade Roadmap

All items are categorized by lens and prioritized for immediate automated execution per the master prompt instructions.

| ID | Title | Lens | Problem Solved | Impact (1-5) | Effort (S/M/L) | Risk | Tests Required | Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| **FIX-01** | Cycle Detection & Graph Error | Core | Cyclic prereqs cause silent failures | 5 | S | Low | `topicGraph.test.ts` cyclic detection | Approved |
| **FIX-02** | Schema Versioning & Migrations | Storage | Future schema changes corrupt old stores | 5 | M | Medium | `storage.test.ts` migration round-trip | Approved |
| **FIX-03** | JSON & Markdown Export / Import | Storage | Data loss on cache clear; zero backup | 5 | M | Low | Round-trip serialization & import | Approved |
| **FIX-04** | Architectural Import Boundary Scanner | Arch | UI directly importing core domain classes | 4 | S | Low | Architectural scanner test | Approved |
| **FIX-05** | Accessibility & Focus Visible Overhaul | A11y | Keyboard users cannot navigate cards | 5 | M | Low | Focus visible and contrast verification | Approved |
| **FIX-06** | User Notes Sanitization & XSS Defense | Security | Potential HTML injection via notes | 5 | S | Low | XSS text injection unit test | Approved |
| **FIX-07** | GitHub Actions CI Workflow | DX | Regression prevention on commits | 4 | S | Low | GitHub actions lint + build + test | Approved |
| **EXP-01** | "Paper on Night" Design System | Design | Visual identity alignment with mockups | 5 | L | Low | Visual regression & theme tests | Approved |
| **EXP-02** | 3D Flashcard Component & Review Mode | UX | Missing core spaced repetition review loop | 5 | L | Medium | State machine unit tests | Approved |
| **EXP-03** | Up Next Card & Today Screen Upgrade | UX | Daily plan lacked priority focus hierarchy | 5 | M | Low | Plan render verification | Approved |
| **EXP-04** | Command Palette (Ctrl+K) & Shortcuts | UX | High friction screen switching | 4 | M | Low | Keyboard navigation test | Approved |
| **FEAT-01** | Settings Screen & Preferences | Features | Inflexible thresholds, intervals, plan sizes | 4 | M | Low | Settings persistence test | Approved |
| **FEAT-02** | Mistake Journal Screen | Features | Users cannot review repeated mistake patterns| 4 | M | Low | Grouping and tag query tests | Approved |
| **FEAT-03** | Practice Stopwatch / Timer | Features | Users manually estimate problem time | 4 | S | Low | Timer state test | Approved |
| **FEAT-04** | Fuzzy Problem Search & Duplicate Check | Features | No way to search library or avoid duplicates | 4 | M | Low | Search & URL normalizer tests | Approved |
| **FEAT-05** | Problem Link Prefill Parser | Features | Repetitive manual title/platform entry | 3 | S | Low | URL slug parsing test | Approved |
| **COACH-01**| Offline Coach Intent Router (F1) | Coach | Inability to ask queries about progress | 5 | L | Low | Intent golden test (25+ queries) | Approved |
| **COACH-02**| Coach Slide-Over UI & Actions (F2) | Coach | Missing conversational UI and confirm cards | 5 | M | Low | Action confirmation tests | Approved |
| **COACH-03**| Coach Provider Abstraction (F3) | Coach | Extensibility for local Ollama / cloud BYOK | 4 | M | Medium | Provider mock streaming tests | Approved |
| **COACH-04**| Coach Prompt Injection Defense (F4) | Security | Malicious note text manipulating Coach | 5 | S | Low | Adversarial injection attack tests | Approved |
