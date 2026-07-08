# Keep a Changelog — Reference

A changelog is a curated, chronologically ordered list of notable changes for each version, written **for humans**. It is not a `git log` dump. Based on the Keep a Changelog 1.1.0 conventions.

## Guiding principles

- Changelogs are for humans, not machines.
- Every version gets an entry.
- Group changes by type (the six categories below).
- Newest version first (reverse chronological).
- Each version shows a release date in ISO format (`YYYY-MM-DD`).
- Note whether the project follows Semantic Versioning.
- Keep an `Unreleased` section at the top so unshipped work is always captured.

## The six categories (use in this order)

| Category | Contains |
|----------|----------|
| **Added** | New features and capabilities |
| **Changed** | Changes to existing functionality |
| **Deprecated** | Soon-to-be-removed features (still present) |
| **Removed** | Features removed in this release |
| **Fixed** | Bug fixes |
| **Security** | Vulnerability fixes — always call these out |

Omit any category with no entries for a given version. Never invent entries to fill a category.

## File skeleton

```markdown
# Changelog

All notable changes to this project are documented here.
The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

### Added
- New `--json` flag on the export command.

## [1.4.0] - 2025-06-30

### Added
- Dark mode that persists across sessions (#210).

### Changed
- Default request timeout raised from 5s to 30s (#221).

### Fixed
- Pagination no longer skips the last item on exact-page-size results (#233).

## [1.3.1] - 2025-05-12

### Security
- Bump `libfoo` to 2.1.4 to address CVE-2025-1234.

[Unreleased]: https://example.com/compare/v1.4.0...HEAD
[1.4.0]: https://example.com/compare/v1.3.1...v1.4.0
[1.3.1]: https://example.com/compare/v1.3.0...v1.3.1
```

## Version headers

- Format: `## [X.Y.Z] - YYYY-MM-DD`.
- The version is a link (defined at the bottom) to the compare view between the prior tag and this one.
- `Unreleased` links to `compare/<latest-tag>...HEAD`.
- On release: rename `Unreleased` to the new version + date, then add a fresh empty `Unreleased`.

## Surfacing breaking changes

Keep a Changelog has no "Breaking" category — breaks live under **Changed** or **Removed**. Make them impossible to miss:

- Put a short breaking-changes callout at the very top of the version entry, before the categories:
  ```markdown
  ## [2.0.0] - 2025-07-01

  > **Breaking:** `createdAt` is now an ISO-8601 string (was epoch seconds). See migration below.

  ### Changed
  - ...
  ```
- Add a migration note (nested bullet or a short "Migration" subsection) for anything requiring consumer action.

## Good vs bad entries

| Bad | Why | Better |
|-----|-----|--------|
| `- fixed stuff` | Vague, no surface | `- Fix crash when opening an empty project (#98)` |
| `- Refactored the auth module` | Internal, not user-facing | omit, unless behavior changed |
| `- Merge pull request #42 from feature/x` | Raw git noise | describe the actual change |
| `- Updated dependencies` | Hides a security fix | `### Security\n- Bump libfoo to 2.1.4 (CVE-2025-1234)` |
| `- Added new stuff and fixed bugs` | Two categories in one line | split into Added and Fixed |

## Linking

- Reference PRs/issues inline as `(#123)`; readers jump to the discussion.
- Define compare links at the bottom so version headers stay clickable.
- Keep entries concise — one line each; detail belongs in the linked PR, not the changelog.

## De-duplication before writing

- Fold `wip`, `fixup`, and follow-up commits into the feature/fix they complete.
- Collapse a "add X" + "revert X" + "re-add X" churn into the single net change.
- One changelog line can represent many commits — summarize the outcome, cite the primary PR.
