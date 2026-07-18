# Design principles

claude-squad started as a question: if you run several AI terminals side by side, each with a different role prompt — a developer, a tester, an auditor — the quality jump from role separation is real, but a human ends up working as the message bus between them. Automating that bus naively (one agent that "does everything") throws away exactly what made the separation work. These are the principles that kept it.

## 1. Agents are for delegated work; skills are for interaction modes

A subagent is the right primitive for work you hand off and get back: it has its own context, its own tools, and returns a structured report. It is the wrong primitive for a conversation: every round would relay through the orchestrator — slow, token-doubled, and lossy — and subagents never see the images you paste.

That is why product definition is deliberately NOT a subagent. It is a conversation, so `/squad:define` runs it in your own session: the session interviews you directly, challenges vague answers, and closes a spec. The same applies to informal bug intake: `/squad:fix` clarifies with you in the main session when the report is loose or a screenshot, before any agent runs. Delivery, verification, and documentation are delegated work — those are the five subagents.

## 2. Artifacts couple the modes

Conversations produce files; pipelines consume them. `/squad:define` ends in `specs/<slug>.md`; `/squad:build` starts from it. The file is resumable across sessions, diffable, versioned in git — and it doubles as the verification contract: the acceptance criteria negotiated in the chat are exactly what the tester verifies at the end, criterion by criterion. Coupling through artifacts instead of conversation state is what lets you define today and build next week.

## 3. Boundaries are enforced by tooling, not prose

A rule the model cannot break beats a rule it promises to follow. The auditor cannot modify anything — it has no write tools, not a "please don't" paragraph. The documentator cannot run builds or tests — it has no shell. Dangerous operations (`kubectl`, `.env` access, and work-destroying git commands — `git reset --hard`, `git clean -f`, `git checkout -- .`, `git restore .`, `git push --force`) are blocked by a `PreToolUse` hook that exits before the tool runs. Prose rules remain for what tooling can't express (prompt-injection handling, secret redaction), but every boundary that can be mechanical is mechanical.

The hook is honest about its scope: a guardrail for a cooperative agent, not a sandbox against an adversary. It covers the same-intent *siblings* of each banned command (so the guarantee matches the prose — banning `git reset --hard` while `git clean -f` sailed through would be a lie) and matches invocations wherever they run — inside `$(…)`, behind `sudo`, via full paths — but it does not try to defeat deliberate obfuscation. `hooks/test_guard.py` pins exactly what is allowed and denied, so widening the policy means adding a denied case, never quietly changing behavior. One deliberate non-abstraction: the shared core of the "Security and conduct" block is duplicated verbatim in every role (a few roles add one role-specific line) rather than factored into a shared skill. A security rule must be *guaranteed* in the agent's context, and an inlined block is guaranteed where a lazily-loaded skill is not — the small duplication buys certainty, and `scripts/validate_plugin.py` asserts the core is present in every role so the copies cannot silently drift.

## 4. One tester, three disciplines

Each pipeline redefines the tester's relationship to tests, because "what tests mean" depends on what you are doing:

| Pipeline | The tests are… |
|---|---|
| `build` | written for the spec's new acceptance criteria |
| `fix` | the gate: a failing test must exist BEFORE the fix — or, when up-front reproduction is genuinely impossible, the receipt written right after |
| `refactor` | the frozen invariant: identical results before and after — wanting to change one IS the finding |

The role stays constant (protect the contract, never touch production code); the discipline rotates. The tester's core principle holds everywhere: a failing test is a risk signal, never something to "adapt" to the implementation.

The tester also owns the **testability verdict**. Testability is a design property, so the developer designs for it up front (seams, injected dependencies); when the tester still has to mock internal logic to protect a contract, that is first-hand proof of a design defect — it reports the missing seam back to the developer rather than absorbing it as an implementation-mirroring test. This is deliberately the tester's finding, not the auditor's: the tester hits the wall empirically where the auditor could only infer it from reading, so the auditor keeps the structural root cause (coupling, hidden dependencies) and the tester keeps the proof.

## 5. Conservative defaults, explicit escape hatches

Test commands run sequentially unless the project documents its suites as parallel-safe. Contract changes prefer compatible extension over expand–contract over versioning, and a hard break requires explicit human sign-off. Scope is frozen mid-build: if implementation proves the spec wrong, the pipeline stops rather than improvising. Defaults protect the worst case; escape hatches respect projects that know better — but the escape is always explicit, never assumed.

## 6. Encoded judgment over ad-hoc cleverness

The playbooks (`semantic-architecture`, `breaking-change`, `final-validation`) are senior judgment written down: trigger conditions, mandatory pieces, forbidden anti-patterns, and a matrix that must be resolved before the work counts as done. They are preloaded into the developer and fire on task shape, not on being remembered. When a failure teaches something new, the fix is a diff to a playbook or a role prompt — the system's knowledge lives in reviewable files, not in anyone's head.

## Anatomy

| Piece | What it is | Where |
|---|---|---|
| Roles | Subagent definitions with tool restrictions and preloaded skills | `agents/*.md` |
| Pipelines | Choreographies the orchestrator (your session) follows | `skills/{define,build,fix,refactor,review}` |
| Playbooks | Auto-triggered judgment, preloaded into roles | `skills/{semantic-architecture,breaking-change,final-validation}` |
| Guard | Mechanical security policy (PreToolUse hook), with its allow/deny contract | `hooks/guard.py`, `hooks/test_guard.py` |
