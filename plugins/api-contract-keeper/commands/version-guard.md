---
description: Classify API-surface changes as breaking or non-breaking and recommend a semver bump
argument-hint: [from-ref..to-ref | spec-file]
model: inherit
---

Classify changes to the API surface as **breaking** or **non-breaking** using oasdiff-style semantics, then recommend a semver bump. `$ARGUMENTS` is either a git range (`from-ref..to-ref`, e.g. `v1.4.0..HEAD`) to diff two versions of the spec, or a single spec file to compare against its previous committed version. This is a **static** analysis of the contract, no server or live traffic. Load the `openapi-drift` skill for the breaking-change rules.

## Process

### Step 1: Resolve the two versions of the surface
- **Git range**: check out (or `git show`) the spec file at each ref; if the spec is code-first, diff the extracted surface (routes, DTOs, GraphQL SDL) at each ref.
- **Single file**: diff the working copy against `HEAD` (or the last tag) via git.
Handle both OpenAPI/Swagger and GraphQL SDL. For GraphQL, GraphQL's own rules apply (adding a nullable field is safe; making an output field non-null is safe; making an input field required or non-null is breaking).

### Step 2: Classify every change
Walk the diff and label each change using `references/breaking-change-rules.md`. Summary of the rules:

| Change | Verdict | Why |
|---|---|---|
| Remove or rename an endpoint/field/enum value | Breaking | Existing clients call/read it |
| Add a new **required** request field/param | Breaking | Old clients omit it → rejected |
| Narrow a type / tighten validation (smaller max, new pattern, `int`→`enum`) | Breaking | Previously-valid requests now fail |
| Make a response field nullable / remove a response field | Breaking | Clients depend on presence/non-null |
| Change a status code or the error shape | Breaking | Client branching/handling breaks |
| Make an optional request field required | Breaking | Same as adding a required field |
| Add a new **optional** request field/param | Non-breaking | Old clients omit it safely |
| Add a new endpoint / new enum value in a response | Non-breaking* | *response enum growth can surprise strict clients, flag |
| Add a response field / widen a type / loosen validation | Non-breaking | Superset accepts old inputs/outputs |
| Make a required response field... it stays required | Non-breaking | No client impact |

Direction matters: **request** schemas are contravariant (widening is safe, narrowing breaks), **response** schemas are covariant (adding is safe, removing breaks). Apply the direction, not a blanket rule.

### Step 3: Recommend a semver bump
- Any **breaking** change → **major**.
- Only additive/backward-compatible changes → **minor**.
- Docs/description/example-only changes → **patch**.
Call out every change you could **not** classify (dynamic schema, `$ref` to an external doc that moved, an `anyOf`/`oneOf` reshuffle) as **risky/unclassified** and default it to breaking until a human confirms.

### Step 4: Report
Emit exactly these sections:
- `## Change Table`: columns: `Change | Location | Verdict | Rationale`.
- `## Verdict`: the highest-severity verdict and the recommended semver bump, in one line.
- `## Risky / Unclassified`: changes that need human judgement, defaulted to breaking.
- `## Migration Notes`: for breaking changes, what clients must do and whether a deprecation window / new version path (`/v2`, `Sunset` header) is warranted.

## Important Notes
- Ground every verdict in the actual diff, cite the JSON/YAML path (or SDL location) of each change.
- Respect request/response direction; do not label a widened request type as breaking or a removed response field as safe.
- Never fabricate a change that is not in the diff; when a change is ambiguous, put it under Risky/Unclassified rather than guessing.
- A "compatible" change that alters observable behavior for strict clients (new response enum value, new default) must still be flagged even if the verdict is non-breaking.
