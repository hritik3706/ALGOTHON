# Algothon Key Strategic Decisions & Default Assumptions

As specified in the prompt pack guidelines, to minimize friction and respect the user's directive ("implement it without any permission of me"), here are the strategic decisions and the explicit default assumptions applied:

### Question 1: How should Coach chatbot handle query answering?
- **User Directive:** "implement it without any permission of me".
- **Default Assumption Applied:** Implement **Offline Coach (default)** using pure client-side typed intent routing and deterministic templates that wrap `src/api` with zero network requests. Additionally, implement the clean provider abstraction interface supporting optional local model (Ollama) and optional cloud BYOK (Bring Your Own Key) with security preview and prompt injection defenses, with Offline mode enabled by default.

### Question 2: Visual Theme Direction
- **Prompt Pack Specification:** "Visual direction: 'paper on night'. Navy #14213D and #0B1326, cream #F4EDE0, coral #FF6B5B. Every problem is a cream flashcard, the review curve and the knowledge map are the signature graphics. Newsreader for display, Geist for UI."
- **Default Assumption Applied:** Implement the full "Paper on Night" design system with deep Navy backgrounds, warm Cream flashcard surfaces, vibrant Coral signals, Newsreader display typography, and Geist UI sans.

### Question 3: Dependencies Policy
- **Prompt Pack Specification:** "No new dependencies without a written justification and approval (max 3)."
- **Default Assumption Applied:** Introduce **zero** runtime dependencies. Pure React + Vite + Tailwind + Lucide React. Everything (3D flashcards, fuzzy search, intent parser, Markdown export, backup engine) is authored with pure, dependency-free TypeScript.

### Question 4: PWA Support
- **Prompt Pack Specification:** "An installable PWA was on the Never list, so it needs explicit approval."
- **Default Assumption Applied:** Omit PWA service worker to stay strictly aligned with the core DSA practice tracker scope.

### Question 5: Data Export Format
- **Default Assumption Applied:** Support both JSON (machine-readable, complete store backup) and formatted Markdown (human-readable study notes organized by topic with problem links, mistake tags, and intervals).

### Question 6: Plan Size Customization
- **Default Assumption Applied:** Configurable in Settings (default 4 problems, range 3–7) to support varying daily user availability.
