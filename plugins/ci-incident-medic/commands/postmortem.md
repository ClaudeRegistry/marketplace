---
description: Draft a blameless postmortem from incident evidence
argument-hint: [incident notes]
model: inherit
---

Draft a blameless postmortem from raw incident evidence — pasted timeline, logs, alerts, and chat. Use this after an incident is resolved, while memory is fresh. `$ARGUMENTS` holds the incident notes (or a path to a notes file); gather whatever timeline, alert, and chat material the user has.

## Process

### Step 1: Assemble the evidence
- Read the notes in `$ARGUMENTS` (inline text or a file path). Collect timestamps, alert names, deploy/rollback events, log excerpts, and who-did-what — but for attribution use roles ("the on-call engineer"), never names for blame.
- Normalize every timestamp to **UTC**. If a source timezone is ambiguous, note the assumption rather than guessing silently.

### Step 2: Draft the document
- **Launch the postmortem-writer agent** to stitch the UTC timeline, identify contributing factors, and write owner-assigned action items. The agent writes the finished document to `postmortems/YYYY-MM-DD-<slug>.md`.
- Apply the **incident-response** skill for the template structure and the severity model (`severity-levels.md`).

### Step 3: Structure (exact headings)
The postmortem must contain, in order:

1. **Summary** — 2-3 sentences: what broke, blast radius, how long.
2. **Impact** — users affected, duration, severity (SEV1-SEV4), SLO/error-budget burn if known.
3. **Timeline (UTC)** — detection → mitigation → resolution, one row per event with a source citation.
4. **Root Cause** — contributing factors as a system-level analysis; multiple factors, never a single scapegoat.
5. **What went well / What went poorly** — honest, specific.
6. **Action items** — table of `Owner | Due date | Item | Type (preventive / detective)`.
7. **Lessons learned** — durable takeaways.

## Important Notes
- **Blameless, always.** Analyze systems, processes, and missing guardrails — never assign fault to an individual. Replace "X deployed the bad change" with "the change passed CI because there was no integration test for Y."
- Ground every timeline entry in a real piece of evidence (a log line, an alert, a chat timestamp) and cite it. Never invent times, metrics, or events.
- If the evidence is thin, mark gaps explicitly as `[unknown — needs follow-up]` rather than filling them in.
- Every action item needs an owner (role or named team) and a due date; classify each as preventive (stops recurrence) or detective (catches it faster next time).
