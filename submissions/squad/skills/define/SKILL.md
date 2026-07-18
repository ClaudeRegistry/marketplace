---
name: define
description: Conversational spec mode — the main session interviews the user, round by round, until the product definition closes; then writes a spec file with verifiable acceptance criteria, ready for /squad:build. Use when the user wants to define, spec, or shape a feature or product, or when a request is too vague to build directly. Also resumes/revises an existing spec file.
---

# Squad define

Input: $ARGUMENTS — an idea to define, or the path to an existing spec file to resume or revise.

Product definition is a conversation, and the user talks to YOU: run the interview directly in this session — by design, no subagent is involved here. Your single deliverable is a closed spec file — you write no code and change nothing else.

## The definition doctrine

Turn the idea into a clear, bounded, executable definition, minimizing implicit decisions. A definition is closed only when all of these exist:

1. Problem to solve — what hurts, for whom, in what context
2. Affected user(s) and their expectations
3. Objective and success signal (even qualitative)
4. INCLUDED scope — exactly what is covered
5. EXCLUDED scope — explicit, mandatory
6. Priority with justification
7. Acceptance criteria — numbered, individually verifiable, functional language
8. Known risks (technical, user, data, performance)

Hard rules: no ambiguous definitions; if the idea is really several requests, split it into separate specs and ask which goes first; if you cannot write verifiable acceptance criteria, the spec is NOT ready; question anything that adds no clear user or business value.

## How to interview

- **Read before asking.** Check the project's context sources first (`CLAUDE.md`, `README.md`, existing specs, overview command if documented) — never ask what the code or docs already answer, and never propose what already exists.
- **Small rounds.** 2–4 questions per round, the most scope-blocking first. Do not dump the whole checklist at once.
- **Propose, don't just ask.** For each question, offer the answer you would pick so the user can simply confirm or correct. Fast convergence beats exhaustive surveying.
- **Show convergence.** After each round, reflect a compact running summary of the spec so far, marking what is still open.
- **Challenge.** Vague answers get pushed back ("how would the tester verify that?"). Contradictions with earlier answers get flagged, not silently resolved.
- **Respect the pace.** If the user pauses or the session ends before closing, save the spec with `status: draft` so nothing is lost — it can be resumed later by passing its path to this skill.

## The spec file

When the checklist passes (and only then), render the full spec for a final look, then write it:

- Location: `specs/<slug>.md` by default; follow the project's existing convention if one exists (`docs/specs/`, etc.).
- Frontmatter: `title`, `status: ready` (`draft` if unfinished), `date` (use the `date` command).
- Body: the 8 sections above, plus **Notes for UX / Developer / Tester** (only what each needs) and **Resolved questions** (decisions made during the chat, with their rationale — this is the audit trail).
- The spec is written in English regardless of the conversation language.

Close by telling the user: the spec path, its status, and that `/squad:build <path>` runs the delivery pipeline whenever they are ready.

## Rules

- Never start implementing, and never spawn the delivery agents from here — this skill ends at the artifact.
- Only the spec file (and its directory) is written; nothing else is touched.
- If the user says "just build it" before the spec closes, close early ONLY if the checklist genuinely passes; otherwise say exactly which pieces are missing.
