# Algothon constraints

Project: Algothon, a local-first DSA progress tracker (React + Vite + TypeScript + Tailwind).

## Architecture
- Dependency direction is one way: pages and components -> src/api -> src/core.
- UI code imports only from src/api. Never from src/core or any storage module.
- src/core must never import from src/api, src/pages or src/components.
- Core logic is pure: plain data in, plain data out. "today" is passed in, never read inside core.

## Data
- No fake data, no hard-coded fallback numbers, no placeholder rows.
- Loading: use a Tailwind animate-pulse skeleton. Empty: show 0 or the EmptyState component.
- A first boot has exactly zero problems, attempts and revisions.

## Scope
- Do not add third-party dependencies. Removing dependencies is allowed.
- No accounts, no cloud sync, no LeetCode scraping. The app is local-first.
- Do not add features that the current phase does not list.

## Verification
- npm run build and npm run test must both pass before a phase counts as done.
- Show the real command output in the Walkthrough. Do not claim a pass without running the command.
- If something in the prompt conflicts with the code you find, stop and ask.

