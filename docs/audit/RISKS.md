# Algothon: Top 10 Product & Technical Risks and Mitigations

| # | Risk Description | Severity | Impact | Mitigation Strategy |
| :- | :--- | :---: | :---: | :--- |
| **1** | **Accidental Data Loss on Browser Cache Purge** | Critical | High | Implement automatic JSON Export, readable Markdown Export of notes, and automatic safety backup in `localStorage.getItem('algothon_backup')` before destructive resets. |
| **2** | **Cold-Start Practice Paralysis** | High | High | First-run onboarding banner offering 1-click Demo Data Load, starter curriculum path, or 30-second initial self-assessment. |
| **3** | **Prompt Injection in Coach AI Mode** | High | High | Treat user notes, problem titles, and reflections strictly as DATA (never system instructions). Run dedicated unit tests asserting prompt injection attacks are ignored. |
| **4** | **Unintentional Network Leaks in Offline Mode** | High | High | Offline Coach relies entirely on client-side typed intent parser and deterministic templates. Zero fetch calls. Test suite asserts 0 network calls. |
| **5** | **GPU Redraw Jitter from Heavy Blur Effects** | Medium | Medium | Replace layered backdrop blur filters with precomputed CSS radial gradients and hardware-accelerated transforms. |
| **6** | **DAG Cyclic Deadlock from Invalid Prerequisites** | Medium | High | Add strict cycle detection in `TopicGraph` with explicit named cycle error, verified by unit tests. |
| **7** | **Leech Trap / Premature Resurfacing** | Medium | Medium | Quarantined problems require explicit relearning action and grace interval before re-entering normal SM-2 repetition min-heap. |
| **8** | **Accessibility Failure on Flashcard Interaction** | Medium | Medium | Provide accessible keyboard shortcuts (`Space` to flip, `0-5` to rate, `Esc` to exit), with clear `aria-expanded` and `aria-live` state announcements. |
| **9** | **UI / Core Architectural Coupling** | Medium | High | Enforce strict import boundary via automated architectural test ensuring `src/pages` and `src/components` only import from `src/api`. |
| **10** | **Small-Sample Flukes in Weakness Ranking** | Low | Medium | Utilize Wilson 95% confidence lower-bound score with sample size dampening so $1/1$ is not ranked stronger than $18/20$. |
