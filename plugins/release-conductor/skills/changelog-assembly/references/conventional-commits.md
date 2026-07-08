# Conventional Commits 1.0.0 — Reference

A specification for adding human- and machine-readable meaning to commit messages. A conforming message lets tooling derive changelogs and semver bumps automatically.

## Structure

```
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

- **type** — the category of change (closed set below).
- **scope** — a noun in parentheses naming the affected area: `feat(parser):`. Optional.
- **!** — placed before the colon to mark a breaking change: `feat(api)!:`.
- **description** — imperative, present tense, ≤50 chars, lowercase, no trailing period.
- **body** — free-form, wrapped ~72 cols, explains the *why* and non-obvious *how*. Separated from the subject by one blank line.
- **footers** — `Token: value` lines. Reserved: `BREAKING CHANGE:` and issue references.

## The type taxonomy

| Type | Meaning | Semver effect |
|------|---------|---------------|
| `feat` | A new feature for the user | MINOR |
| `fix` | A bug fix for the user | PATCH |
| `docs` | Documentation only | none |
| `style` | Formatting/whitespace, no code meaning change | none |
| `refactor` | Neither fixes a bug nor adds a feature | none |
| `perf` | Improves performance | PATCH (or MINOR if it changes behavior) |
| `test` | Adding or correcting tests | none |
| `build` | Build system or external dependencies | none (PATCH if it ships) |
| `ci` | CI configuration and scripts | none |
| `chore` | Other changes not touching src/test | none |
| `revert` | Reverts a previous commit | matches the reverted change |

Any type may become MAJOR when marked breaking. Types outside this set are allowed by the spec but reduce tooling value — prefer the standard set.

## Breaking changes — two equivalent forms

1. **`!` marker** in the header:
   ```
   feat(api)!: return ISO-8601 timestamps instead of epoch seconds
   ```
2. **`BREAKING CHANGE:` footer** (may be combined with `!`):
   ```
   feat(api): return ISO-8601 timestamps

   BREAKING CHANGE: the `createdAt` field is now an ISO-8601 string.
   Clients parsing it as a number must update.
   ```

Either form forces a MAJOR bump (or a MINOR pre-1.0.0). The footer is preferred when the incompatibility needs explanation; `BREAKING-CHANGE:` (hyphenated) is also accepted.

## Issue-reference footers

- `Closes #123` / `Fixes #123` — closes the issue on merge (GitHub/GitLab).
- `Refs #123` — references without closing.
- `Reviewed-by:`, `Co-authored-by: Name <email>` — attribution footers.

## Good vs bad examples

**Good**
```
fix(auth): reject tokens whose exp is in the past

Previously an expired JWT still authenticated because the clock
comparison used > instead of >=. Tighten the check and add a
5s leeway for clock skew.

Closes #431
```
```
feat(cli): add --json output flag
```
```
refactor(store): extract pagination into a reusable hook
```

**Bad → why → fix**

| Bad | Problem | Better |
|-----|---------|--------|
| `update code` | No type, no information | `refactor(api): simplify error mapping` |
| `Fixed the bug.` | Past tense, capitalized, trailing period, vague | `fix(parser): handle empty input` |
| `feat: added a new endpoint and fixed login and updated docs` | Multiple concerns in one commit | Split into `feat`, `fix`, `docs` commits |
| `feat(api): change response format` | Breaking but not marked | `feat(api)!: change response format` + `BREAKING CHANGE:` footer |
| `fix: WIP` | Not a real message | Squash into the real fix before merging |

## Message ↔ semver quick rule

- Any `BREAKING CHANGE:`/`!` in the range ⇒ **MAJOR**.
- Otherwise any `feat` ⇒ **MINOR**.
- Otherwise any `fix`/`perf` ⇒ **PATCH**.
- Otherwise (docs/style/test/ci/chore only) ⇒ no release needed.

Pre-1.0.0: a break is conventionally released as a MINOR (`0.Y+1.0`) since 0.x promises nothing — but still document it as breaking.

## Commit hygiene tips

- One logical change per commit; if the subject needs "and", split it.
- Write the body when the *why* is not obvious from the subject — future archaeology depends on it.
- Reference the issue so the changelog and the tracker stay linked.
- Reword or squash `wip`/`fixup` commits before merge (see the rebase-plan command).
