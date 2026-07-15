# Breaking Change Catalog, Per-Ecosystem Signals

For each ecosystem: what constitutes a **break (MAJOR)** vs an **additive/compatible (MINOR/PATCH)** change. Read the diff of the *public surface* against these signals.

## JavaScript / TypeScript

**Public surface**: names reachable from `package.json` `exports`/`main`/`module`/`types`; the `.d.ts` shape.

**Breaking**
- Remove or rename a named/default export reachable from an entry point.
- Add a required parameter, reorder params, or change a param/return type.
- Narrow a TypeScript type (widen input / narrow output are both breaking for the opposite consumer).
- Change a `type`/`interface` field from optional to required, or remove a field from a returned object.
- Change a default export's shape; change an enum's numeric values.
- Raise the minimum Node/engine version in `engines`.

**Additive / compatible**
- Add a new export, a new optional param (with default), or a new optional field to a returned object.
- Widen an accepted input type; add a new overload that doesn't remove existing ones.
- Add a new optional field to an options object.

## Python

**Public surface**: `__all__`; module-level names not prefixed with `_`; class public methods/attributes; entry points/console_scripts.

**Breaking**
- Remove/rename a public function, class, method, or module.
- Add a positional-or-required parameter without a default; remove a parameter; change a default that alters behavior.
- Change a return type or the structure of a returned dict/namedtuple/dataclass.
- Raise a different exception type, or stop raising one callers caught.
- Make a keyword argument positional-only (or vice versa in a breaking direction).
- Drop support for a Python version in `requires-python`.

**Additive / compatible**
- Add a new public function/class; add a keyword parameter with a default.
- Add a new optional key to a returned dict.
- Add a new exception subclass of an existing one callers already catch.

## Go

**Public surface**: Capitalized identifiers in non-`internal/` packages; the module path in `go.mod`.

**Breaking**
- Remove/rename an exported func, type, const, var, method, or struct field.
- Change an exported function signature or an interface's method set (adding a method to an interface breaks implementers).
- Change a struct field type, or add a field that breaks struct literals without field names.
- Change the module path or major version (must bump the `/vN` suffix).

**Additive / compatible**
- Add a new exported identifier; add a method to a concrete type (not an interface).
- Add a struct field (safe if consumers use keyed literals).
- Add a new package.

## Java / Kotlin

**Public surface**: `public`/`protected` members of exported packages; `module-info` exports; Maven/Gradle coordinates.

**Breaking**
- Remove/rename a public class, method, field, or constructor; reduce visibility.
- Change a method signature, return type, or thrown checked exceptions; add an abstract method to an interface/abstract class.
- Change a field's type or make it final; change an enum constant.
- Change the artifact groupId/artifactId.

**Additive / compatible**
- Add a public class/method/overload; add a `default` interface method (Java 8+).
- Add an enum constant at the end (may still break exhaustive switches, treat with care).
- Widen a parameter type in a new overload.

## Rust

**Public surface**: `pub` items reachable from the crate root, including `pub use` re-exports.

**Breaking**
- Remove/rename a `pub` item; add a field to a non-`#[non_exhaustive]` public struct; add a variant to a non-`#[non_exhaustive]` public enum.
- Change a public function signature or trait method set; add a required trait method without a default.
- Tighten trait bounds on a public API.

**Additive / compatible**
- Add a `pub` item; add a variant to a `#[non_exhaustive]` enum; add a defaulted trait method.
- Add a field to a struct already marked `#[non_exhaustive]`.

## HTTP / REST API

**Public surface**: routes, methods, request/response bodies, query/path params, headers, status codes.

**Breaking**
- Remove/rename an endpoint; change its method or path.
- Add a required request field or make an optional one required; remove a response field consumers read.
- Change a field's type, units, or meaning; change pagination defaults; change a success status code.
- Tighten validation to reject formerly-accepted requests; change auth requirements.

**Additive / compatible**
- Add a new endpoint; add an optional request field; add a new response field.
- Add a new optional query parameter with a backward-compatible default.
- Version via URL/media type instead of mutating an existing shape.

## GraphQL

**Public surface**: the schema, types, fields, arguments, nullability, enum values, directives.

**Breaking**
- Remove/rename a type, field, or enum value; change a field's type.
- Make a nullable output field non-null → OK; make a non-null output nullable → **breaking** for clients.
- Add a required (non-null, no-default) argument to a field; remove an argument.
- Change an input field from optional to required.

**Additive / compatible**
- Add a type, a nullable field, an enum value (may break exhaustive client handling, note it), or an optional argument with a default.
- Deprecate a field with `@deprecated` (still present).

## Database schema

**Public surface**: whatever application code and external consumers read/write.

**Breaking**
- Drop or rename a column/table consumers use; change a column type incompatibly; add a `NOT NULL` column without a default to a table with existing writers.
- Remove an enum value in use; tighten a constraint that rejects existing data.

**Additive / compatible**
- Add a nullable column or one with a default; add a table; add an index.
- Follow expand-contract: add new, backfill, migrate readers/writers, then remove old in a later major.

## CLI

**Public surface**: subcommands, flags/options, positional argument order, exit codes, stdout/stderr format.

**Breaking**
- Remove/rename a flag or subcommand; change a flag from taking no value to requiring one; change positional order.
- Change an exit code's meaning; change machine-readable stdout structure that scripts parse.
- Change a default that alters output.

**Additive / compatible**
- Add a new flag (with a backward-compatible default) or subcommand.
- Add fields to `--json` output (additive); keep a stable `--version`/exit-code contract.
