---
name: breaking-change
description: Apply when a task changes a public API, endpoint signature or response shape, database schema, serialized or persisted format, event/message contract, or any interface other code or systems consume. Enforces closing the transition safely — consumer inventory, compatibility decision (compatible extension / expand–contract / explicit versioning), migration and backfill plan, deprecation path, and a test strategy covering old and new behavior while both live.
---

# Breaking-change playbook: contracts, schemas, and formats

This playbook is NOT general-purpose. It applies only to the trigger cases in the description. When it applies, "it compiles and the new tests pass" is not done: you must close the transition. If you are unsure whether it applies, apply it.

## 1. Always close these 4 pieces

### 1.1 Consumer inventory
Before changing anything, enumerate who consumes the contract: internal callers, other services, generated clients, stored data in the old shape, queued or in-flight messages, external integrators. Searching the codebase is not optional. Consumers you cannot enumerate (public APIs) must be assumed to exist.

### 1.2 Compatibility decision
Choose explicitly, in this order of preference, and justify why anything safer was rejected:

1. **Compatible extension** — additive change (new optional field, new endpoint); no break at all.
2. **Expand–contract** — expand (serve old + new), migrate consumers and data, then contract (remove old) as a SEPARATE later change.
3. **Explicit versioning** — v2 endpoint, schema version field — when expand–contract cannot work.

A hard break shipped in one step is the last resort and requires the human's explicit sign-off at a gate.

### 1.3 Data migration and backfill
If persisted data or in-flight messages exist in the old shape: state the forward migration, whether a backfill is needed, whether it is reversible, and what happens to writes during the transition (dual-write? tolerant reads of both shapes?).

### 1.4 Deprecation path
For the old surface: how consumers learn it is deprecated (docs, headers, warnings, changelog), the removal criterion (a date or an adoption signal), and where that decision is recorded. "Removed silently" is not a deprecation path.

## 2. Forbidden anti-patterns

- Renaming or removing a field and "adapting the tests" in the same change — the tester's cardinal sin, invoked by the developer.
- Migrating schema and code in one atomic deploy while instances serving the old shape still run.
- Hand-patching generated clients to absorb a contract break (see the developer's codegen rules).
- Treating "we control all consumers" as license to hard-break without an inventory proving it.
- Regenerating clients by inertia when the contract did not actually change.

## 3. Mandatory matrix to resolve

State explicitly in the delivery — if any cell is ambiguous, the change is NOT ready:

- **Consumers**: who consumes the old shape, and how each one migrates.
- **Transition window**: what coexists (old + new), for how long, and what guards the coexistence.
- **Data**: what is migrated or backfilled, and what happens to writes meanwhile.
- **Rollback**: what happens if the new shape must be reverted after it has seen real traffic.

## 4. Test strategy for the transition

- The old behavior keeps its tests while it lives. They are deleted at CONTRACT time, not at expand time, with the recorded deprecation as the explicit contract change that authorizes the tester to remove them.
- The new behavior gets its own tests.
- At least one test exercises coexistence: an old-shape consumer against the expanded surface.

## 5. Minimum acceptance criteria

- Consumer inventory present in the delivery.
- Compatibility decision stated, with the safer rejected options justified.
- Migration/backfill plan present (or an explicit "no persisted data affected").
- Deprecation path recorded.
- Tests cover old, new, and coexistence.

## 6. Required extra section in the developer's delivery

- **Contract transition** — consumer inventory summary; compatibility decision; migration/backfill; deprecation path; coexistence tests.

## 7. Escalation rule

If the task as defined forces a hard break — no expand–contract possible, unknown external consumers — do NOT improvise. Escalate with the options and the blast radius of each, and wait for the human's decision before implementing.
