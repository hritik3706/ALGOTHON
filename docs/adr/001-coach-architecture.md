# ADR 001: Coach Chatbot Architecture & Safety Protocol

## Status
Accepted

## Context
Algothon is a local-first DSA tracker. Users require intelligent guidance ("What should I do today?", "Why is DP locked?", "Am I avoiding any topics?") without compromising their privacy or requiring external cloud infrastructure.

## Decision
1. **Multi-Tier Model Architecture:**
   - **Offline Mode (Default):** Runs 100% on the client. Uses a deterministic, typed intent router and templating engine wrapping `src/api`. Makes zero network requests.
   - **Local Model (Optional):** Connects to a local server (e.g. Ollama on `localhost:11434`) via CORS-compliant standard streaming fetch.
   - **Cloud BYOK (Optional):** Allows users to provide their own API key (stored only in memory or sessionStorage) to call LLM streaming endpoints.
2. **Safety & Confirmation Layer:**
   - Coach is strictly **read-only by default**.
   - Any write action (logging an attempt, adding a problem, scheduling a relearn) generates a structured **Confirmation Card** with summary diff, Confirm button, and Cancel button. No tool call ever executes automatically without an explicit user click.
3. **Data Minimization & Prompt Injection Defense:**
   - Only relevant summary statistics are sent to the context packet. Full database dumps are never transmitted.
   - User notes, reflections, and problem titles are treated strictly as untrusted **DATA**, never as instructions.
   - Hand-written JSON schema validation enforces allowable tool structures.

## Consequences
- Guaranteed zero data leakage in default offline mode.
- Complete auditability and determinism for core practice recommendations.
- Resilient against prompt injection attacks embedded in problem titles or user notes.
