---
name: semantic-architecture
description: Apply when a task involves active/inactive states, archiving, visibility or lifecycle; lists reused between management and operational contexts; shared selectors (comboboxes, pickers, multi-selects); different rules for "can be viewed" vs "can be used"; write-path validations that depend on state; or operational filters reused across screens. Enforces closing the semantic architecture — shared base function, semantic wrappers, backend write guard, history handling — and forbids duplicated filtering logic.
---

# Semantic architecture for changes with state, operational filters, or reuse

This skill is NOT general-purpose. It applies only to the trigger cases in the description. When it applies, implementing the minimum functional behavior is not enough: you must close the semantic architecture and avoid duplication. If you are unsure whether it applies, apply it — better to discard irrelevant sections than to deliver without it.

## 1. Always close these 4 pieces

### 1.1 Shared base function
A single shared base for query/list/pagination/common filters (e.g. `query_*` or `list_*`) concentrating: search, common filters, pagination, ordering, permission scope, and state filters if applicable.

### 1.2 Semantic wrappers
On top of the shared base, separate semantic entry points per business intent — typically `list_management_*` and `list_operational_*`. The management vs operational difference must NOT be scattered across screens or components.

### 1.3 Backend write guard
Even if the UI or selector already filters, the backend must also validate writes. Mandatory rule: **read access ≠ permission for operational use**. If a state or condition prevents operational use, reject it in the service/backend with a stable functional error.

### 1.4 History
Operational state must not break historical reads. An inactive/archived resource may remain readable in detail and history unless Product decided otherwise. Do not turn "inactive" into "globally hidden" or aggressive soft deletion without explicit specification.

## 2. Forbidden anti-patterns

Do not deliver solutions where: each screen filters on its own; each combobox manually remembers to pass `is_active=true`; two almost identical queries duplicate SQL or pagination; the only protection lives in the frontend; history breaks because an operational filter was reused; or the management/operational difference is implicit in loose flags without semantic wrappers.

## 3. Expected minimum pattern

Use this pattern, or the exact equivalent if the tree already has a better convention (the literal naming is not required; the separation of responsibilities is):

- Shared base: `query_entities(..., activity_filter="active|inactive|all", ...)`
- Management wrapper: `list_management_entities(...)`
- Operational wrapper: `list_operational_entities(...)`
- Backend guard: `ensure_entity_operationally_usable(...)`

## 4. Mandatory matrix to resolve

State explicitly in the delivery how this matrix is resolved — if any cell is ambiguous, the task is NOT closed:

- **Management**: what it sees; whether it can see archived/inactive records.
- **Operational**: what it can select or use.
- **Writes**: what the backend blocks.
- **History**: what remains readable even if inactive/archived.

## 5. Mandatory reuse

Before implementing: search for existing functions, hooks, services, comboboxes, and queries; reuse the closest shared piece; if refactoring is needed, extract toward a shared base instead of copying logic. In the delivery, state which base piece you reused, which refactor made it semantically correct, and which consumers now attach to that shared base.

## 6. Contract and OpenAPI

If the contract changes, regenerate clients/types; if not, do not regenerate by inertia. Do not add ambiguous parameters when separate semantic entry points are needed. A generic API filter still requires management/operational semantics closed in service/consumption code — not left to caller discretion.

## 7. Minimum acceptance criteria

- One shared base for query/list/pagination exists.
- Semantic wrappers/entry points exist per relevant business intent.
- Reused operational consumers use the operational entry point, not ad hoc filters.
- The backend blocks invalid writes even if the frontend fails.
- History remains readable where that is the expected behavior.
- No duplicated filtering/state logic across screens.
- Final validation used the smallest sufficient set of targets (see the final-validation skill).

## 8. Required extra sections in the developer's delivery

- **Applied semantic architecture** — shared base function; semantic wrappers; backend guard; history handling.
- **Anti-duplication** — what logic was removed or avoided; which consumers now reuse the same base.

## 9. Escalation rule

If the functional task definition does not properly close the architecture, do NOT improvise the minimum structure. Escalate explicitly with a concrete pattern proposal (base + wrappers + backend guard) and wait for alignment before continuing.
