# Semantic Versioning 2.0.0, Rules & Communication

## The version triplet

`MAJOR.MINOR.PATCH`: given a version, increment the:

- **MAJOR** when you make incompatible API changes.
- **MINOR** when you add functionality in a backward-compatible manner.
- **PATCH** when you make backward-compatible bug fixes.

Additional labels for pre-release and build metadata are appended:
- Pre-release: `1.0.0-alpha`, `1.0.0-alpha.1`, `1.0.0-rc.1`: lower precedence than the normal version.
- Build metadata: `1.0.0+20130313144700`: ignored for precedence.

## Precedence rules

- Compare MAJOR, then MINOR, then PATCH numerically.
- A pre-release version has **lower** precedence than the associated normal version: `1.0.0-alpha < 1.0.0`.
- Pre-release identifiers compare field by field: numeric identifiers numerically, alphanumeric lexically; more fields > fewer when all preceding are equal (`1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0-rc.1 < 1.0.0`).

## Core commitments

- Once a versioned package is released, its contents MUST NOT be modified, any change MUST be a new version.
- A public API MUST be declared (docs and/or code). SemVer's guarantees only apply to that declared surface.
- MAJOR version zero (`0.y.z`) is for initial development, **anything MAY change at any time; the public API is not stable**.
- Version `1.0.0` defines the public API. How you increment after that is driven by what changed.

## Pre-1.0.0 rules (`0.y.z`)

While the major is `0`:

- There are **no compatibility guarantees**. A minor bump may break.
- Common convention: treat `0.MINOR` like a major and `0.MINOR.PATCH`'s patch like a minor:
  - Breaking change → bump the **minor** (`0.4.2` → `0.5.0`).
  - Additive/fix → bump the **patch** (`0.4.2` → `0.4.3`).
- Even though it's allowed, still **document breaks loudly**: 0.x consumers pin exact or `~` ranges precisely because minors can break.
- Reaching stability? Cut `1.0.0` deliberately once the public API is something you're willing to support.

## Deprecation policy (deprecate before you remove)

Removing something is MAJOR. Give consumers a migration path:

1. **Announce** in a MINOR release: mark the item deprecated (`@deprecated`, `Deprecated:` in Go doc, `DeprecationWarning`, `@Deprecated`, `@deprecated` GraphQL directive, docs note).
2. **Keep it working** for at least one MINOR cycle (longer for widely-used APIs), do not change its behavior while deprecated.
3. **Point to the replacement** in the deprecation message.
4. **Remove** only in the next MAJOR, and list it under Removed with a migration note.

Emitting a runtime deprecation warning is itself backward-compatible (MINOR).

## Communicating breaks to users

- **Mark it at the source**: `feat(x)!:` + a `BREAKING CHANGE:` footer on the commit.
- **Elevate it in the changelog**: a top-of-entry callout plus the Changed/Removed line (see keep-a-changelog reference).
- **Provide a migration**: before/after snippet or a numbered upgrade step for anything requiring consumer action.
- **In the PR**: fill the "Breaking Changes" section with the exact incompatibility and who it affects.
- **Version ranges**: remind consumers that a MAJOR bump means their `^`/`~` ranges will not auto-adopt it, that's the point.

## Quick classification recap

| Highest-severity change in the range | Bump (>=1.0.0) | Bump (0.y.z) |
|--------------------------------------|----------------|--------------|
| Any incompatible/behavioral break | MAJOR | MINOR |
| Any backward-compatible addition | MINOR | PATCH |
| Only backward-compatible fixes | PATCH | PATCH |
| Only internal/docs/tests | none / PATCH | none / PATCH |

When confidence is low (public surface unclear, generated code, reflection/dynamic dispatch), state the uncertainty and choose the more conservative (higher) bump rather than risk shipping an unannounced break.
