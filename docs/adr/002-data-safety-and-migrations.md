# ADR 002: Data Safety, Schema Migrations, and Backup Protocol

## Status
Accepted

## Context
Algothon is a local-first application where all user problem records, mistake reflections, SM-2 intervals, and attempts reside on the user's machine (Browser LocalStorage and Node FileStorage for tests). A clear protocol is required to protect against data corruption, support format evolution, and enable seamless cross-device portability.

## Decision
1. **Schema Versioning:**
   - Every persisted payload includes `schema_version: number` (initially version 1).
   - `Storage.ts` maintains an ordered migration pipeline: `migrations: Record<number, (oldData: any) => any>`.
   - On boot, stored data is validated against the schema version and migrated step-by-step to the current schema before loading into memory.
2. **Atomic Writes & Corrupt-Store Recovery:**
   - Writes to storage are wrapped in try-catch blocks with atomic state validation.
   - If corrupted or unparseable JSON is detected, the store creates a backup timestamped key (`algothon_corrupted_<timestamp>`), initializes a clean storage state, and surfaces a visible user recovery notice.
3. **Safety Backup on Destructive Operations:**
   - Before resetting demo data or clearing store data, the previous state is copied into `localStorage.getItem('algothon_backup')` with an instant undo capability.
4. **Universal Export & Import:**
   - **JSON Export:** Full cryptographic dump of problems, attempts, revisions, and user settings for complete backup and cross-device migration.
   - **Markdown Export:** Formatted human-readable study notes document organized by topic, listing problem titles, links, mistake tags, recall quality, and dates.
   - **JSON Import:** Validates schema structure, checks for duplicate problem IDs and title conflicts, and performs atomic insertion.

## Consequences
- Guaranteed zero user data loss across browser refreshes or application version updates.
- Clear user ownership with human-readable Markdown exports for offline revision.
