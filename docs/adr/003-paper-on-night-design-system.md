# ADR 003: "Paper on Night" Visual Design System

## Status
Accepted

## Context
Algothon's visual identity must evoke an elite, tactile, physical notebook experience set against a quiet nighttime environment ("Paper on Night"). It distinguishes Algothon from sterile corporate dashboards or gamified apps with badges and cartoon avatars.

## Decision
1. **Palette Tokens:**
   - `--bg`: `#0B1326` (Deep Midnight Obsidian) — main page canvas.
   - `--canvas-2`: `#14213D` (Deep Navy) — secondary containers and card backs.
   - `--surface`: `#171F33` (Slate Navy) — interactive card containers and sidebars.
   - `--surface-2`: `#222A3E` (Raised Navy) — hover states and input fields.
   - `--card-paper`: `#F4EDE0` (Warm Cream Paper) — front face of cream flashcards.
   - `--card-paper-ink`: `#14213D` (Navy ink on cream paper).
   - `--fg`: `#F4EDE0` (Cream text on dark surfaces).
   - `--fg-muted`: `rgba(244, 237, 224, 0.65)` (Secondary text).
   - `--fg-faint`: `rgba(244, 237, 224, 0.35)` (Hairlines and captions).
   - `--accent`: `#FF6B5B` (Vibrant Coral) — primary CTAs, active graph nodes, signal badges.
   - `--accent-hover`: `#E55A4A` (Deep Coral).
   - `--accent-ink`: `#0B1326` (Text inside coral buttons).
   - `--border`: `rgba(244, 237, 224, 0.12)` (Subtle paper hairlines).
   - `--danger`: `#FF6B5B` (Coral warning and leech alerts).
2. **Typography:**
   - **Display / Display Numbers:** `Newsreader` (or `Instrument Serif` serif display) for headline numbers, hero phrases, and flashcard titles.
   - **UI Sans:** `Geist` (or clean `Inter`) for buttons, form labels, and table cells.
   - **Code & Tabular:** `JetBrains Mono` for code snippets, difficulty tags, intervals, and keyboard shortcuts.
3. **Atmospheric Effects:**
   - Subtle 35–45% opacity coral radial glow beam placed behind hero focal points.
   - Micro-texture CSS grain overlay and ruled notebook baseline styling for study notes.
   - Physical 3D CSS perspective card flip with 600ms transition and `prefers-reduced-motion` crossfade fallback.

## Consequences
- High-contrast, WCAG 2.2 AA compliant palette.
- Memorable, tactile study environment specifically optimized for nocturnal DSA prep sessions.
