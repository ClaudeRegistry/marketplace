---
description: Assemble release notes / a changelog entry for a commit range, even from non-conventional history
argument-hint: [from-ref..to-ref]
model: inherit
---

Turn a range of git history into human-readable release notes grouped by Keep a Changelog categories, with breaking changes called out at the top and a suggested next version. Works even when the history does NOT use Conventional Commits — it infers change types from diffs and messages. `$ARGUMENTS` is an optional `from-ref..to-ref` range.

## Process

### Step 1: Resolve the range
- If `$ARGUMENTS` contains a `..` range, use it verbatim.
- Otherwise find the last release tag: `git describe --tags --abbrev=0` and use `<last-tag>..HEAD`.
- If there are no tags at all, use the full history `--root..HEAD` (the first release) and say so.

Print the resolved range and the tag it starts from.

### Step 2: Gather the history
- `git log --no-merges --pretty=format:'%H%x09%s%x09%an%x09%ad' --date=short <range>` — the commit list.
- `git log --no-merges --pretty=format:'%H%n%B%n==END==' <range>` — full bodies, to mine footers and rationale.
- For commits whose message is uninformative ("wip", "fix", "update"), read `git show --stat <sha>` and, if needed, `git show <sha>` to infer the real change type from the diff.

### Step 3: Classify each commit
Map every commit to a Keep a Changelog category AND note its conventional type where inferable, per the **changelog-assembly** skill:

| Category | Signals |
|----------|---------|
| Added | new files/exports/endpoints/flags; `feat` |
| Changed | modified behavior/defaults/signatures; `refactor`, `perf` that alters behavior |
| Deprecated | `@deprecated`, deprecation notices |
| Removed | deleted exports/endpoints/flags/files |
| Fixed | bug fixes; `fix` |
| Security | vuln fixes, dependency CVE bumps, auth hardening |

De-duplicate: collapse "fix typo in fix" churn, fold follow-up commits into the feature they complete. Reword terse messages into user-facing language (describe the effect, not the code).

### Step 4: Detect breaking changes
Flag any `BREAKING CHANGE:` footer, any `!` marker, and any behavioral break inferable from the diff (removed/renamed public export, changed signature/default, removed flag/env var). Consult the **breaking-change-detection** skill. Collect these into a prominent top section.

### Step 5: Suggest the next version
Based on the highest-severity change in the range (breaking → major, any Added → minor, else patch) and the current version (from the latest tag or the manifest), suggest the next semver number. Note the pre-1.0.0 caveat if the current major is `0`.

### Step 6: Emit the changelog entry
Output in Keep a Changelog format:

```
## [X.Y.Z] - YYYY-MM-DD

> Breaking changes: <one-line list, or omit the callout if none>

### Added
- <human-readable entry> (#PR)

### Changed
### Deprecated
### Removed
### Fixed
### Security
```

Omit empty categories. Link `#NN` references found in messages. End with a suggested compare link line: `[X.Y.Z]: https://.../compare/<last-tag>...vX.Y.Z`.

## Important Notes
- Base every entry on real commits — cite the SHA(s) behind each notable line.
- Never fabricate a change, a PR number, or a category — if a commit's intent is unclear, read its diff before classifying, and mark genuinely ambiguous ones for human review.
- Write for humans reading the release, not for machines — describe user-visible effects.
- Uses the **changelog-assembly** skill for phrasing and grouping conventions.
