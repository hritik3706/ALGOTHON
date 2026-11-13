# Changelog

All notable changes to the Algothon DSA Progress Tracker are documented in this file.

## [1.0.0] - 2026-11-13

### Added
- **"Paper on Night" Design System**: Deep Navy canvas (`#0B1326`, `#14213D`), Cream flashcards (`#F4EDE0`), signal Coral (`#FF6B5B`), Newsreader display serif typography, and Geist UI sans.
- **3D Flashcard Component & Review Mode**: Real 600ms CSS 3D perspective flip with cream front and navy back, SuperMemo-2 recall rating buttons (0 to 5) that unlock upon flip, and a dedicated focus review session with schedule distribution summary.
- **Coach AI Practice Assistant**: Offline-first chatbot with client-side intent routing, tool wrapping, confirmation action cards, and optional local Ollama & cloud BYOK support.
- **System Settings & Data Portability**: 1-click JSON backup export/import, formatted Markdown study notes export, configurable unlock thresholds, interval schemes (SM-2 vs fixed), and daily plan sizing.
- **Mistake Journal**: Dedicated review page grouping recurring failure modes across 6 standard mistake tags (`logic`, `off_by_one`, `edge_case`, `tle`, `complexity`, `syntax`).
- **Problem Library & Fuzzy Search**: Full database search and filter by difficulty/topic with duplicate detection by normalized URL.
- **Practice Stopwatch / Timer**: Integrated live timer in attempt logging and flashcard review.
- **Command Palette & Global Shortcuts**: `Ctrl/Cmd+K` global command palette and `Ctrl/Cmd+J` Coach shortcut.
- **Architectural Boundary Scanner**: Unit test enforcing that UI components only import from `src/api` facade.
- **GitHub Actions CI**: Automated lint, test, and production build workflow.

### Fixed
- Replaced all fake/mocked data and static arrays with authentic live metrics calculated from user storage.
- Fixed topological sort to true $O(V+E)$ complexity with typed cycle diagnostics.
- Fixed topic interleaving to apply greedy selection across all plan items.
- Added automatic safety backups before destructive clear or demo reload actions.
