# Coach: Algothon AI Practice Assistant

**Coach** is an integrated practice assistant that answers questions about your DSA learning velocity, recommends practice topics, and helps you maintain your spaced revision intervals.

---

## 1. Core Principles

1. **Grounded in Local Data:** Coach never hallucinates problem statistics, recall probabilities, or fake URLs. Every response is drawn directly from your client-side `src/api` metrics.
2. **Offline-First Privacy:** By default, Coach runs completely client-side with **zero network requests**. No tracking, no external telemetry, and no accounts required.
3. **Safety & Confirmation:** Coach is strictly read-only by default. When you ask Coach to log an attempt or perform a write, it returns a visible **Proposed Action Card** with "Confirm" and "Cancel" buttons. No database mutation ever executes without your explicit click.

---

## 2. Operational Modes

- **Offline Mode (Default):** Runs via a client-side typed intent router. Instantaneous, private, and deterministic.
- **Local Model (Optional):** Connects to a local server (e.g. Ollama on `http://localhost:11434`) via standard fetch without cloud exposure.
- **Cloud BYOK (Optional):** Allows you to provide your own API key for open-ended pattern discussions. Keys are stored only in memory or sessionStorage (never written to disk or sent to Algothon).

---

## 3. Supported Queries

- *"What should I do today?"* → Summarizes your interleaved practice plan.
- *"Why is X in my plan?"* → Explains the prerequisite status, interval, or weakness score behind the problem.
- *"What is my weakest topic?"* → Ranks topics by Wilson 95% confidence lower-bound score.
- *"What do I need before X?"* → Traverses the prerequisite DAG to provide the exact unlock sequence.
- *"Am I avoiding any topics?"* → Compares your actual practice share against interview importance weights.
- *"How am I doing this week?"* → Summarizes 7-day solve velocity and active streak.
- *"What is due this week?"* → Queries the SuperMemo-2 min-heap due queue.
- *"Which problems keep slipping?"* → Lists quarantined leeches (problems with $\ge 3$ fails or $EF < 1.5$).
- *"Log: solved Two Sum, 15 min"* → Prepares a draft attempt for confirmation.

---

## 4. Keyboard Shortcuts

- `Ctrl+J` / `Cmd+J`: Toggle Coach drawer from anywhere in the application.
- `Esc`: Close Coach drawer.
