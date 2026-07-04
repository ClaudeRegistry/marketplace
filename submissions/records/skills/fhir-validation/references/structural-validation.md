# Structural Fallback Validation

Use these helpers only when no Records runtime and no profile-aware validator
(Records CLI/API/MCP, SUSHI, IG Publisher, Firely Terminal, HAPI, Java
validator) is available. Always label the result as structural fallback.

## Orchestrated end-to-end run

`validate.mjs` is the single entry point. For a directory it runs the project
detector first (mode, privacy, missing packages), then validates each resource
and enriches every issue with fixability guidance and a JSON Pointer.

```bash
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/validate.mjs" <file-or-directory>
```

Exit code `0` means no error-severity issues across all resources, `1` means at
least one error, `2` means the target could not be accessed.

## Single-resource validator

```bash
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/validate-structural.mjs" <resource.json>
# or pipe JSON on stdin:
cat resource.json | node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/validate-structural.mjs"
```

Output is a FHIR `OperationOutcome` plus a summary (exit `0`/`1`/`2` as above,
where `2` means unparseable JSON). Pipe issues into
`scripts/explain-operationoutcome.mjs` for fixability guidance, and resolve
`issue.expression` to a JSON Pointer with `scripts/map-fhir-expression.mjs`.

## What it checks

- Base resource shape: JSON object, string `resourceType`, `id` format.
- No JSON `null` values or empty arrays (both invalid in FHIR JSON).
- For covered resource types (Patient, Observation, Bundle, Condition,
  Encounter, Procedure, MedicationRequest, DiagnosticReport): required
  (min-cardinality) elements, required `choice[x]` elements, unknown top-level
  elements, `choice[x]` exclusivity, required-binding code enums (such as
  `Observation.status`), and primitive datatype formats for selected elements
  (`date`, `dateTime`, `instant`, `time`, `boolean`, `integer`, `uri`).
- Reference integrity: contained (`#id`) references must resolve, and inside a
  Bundle relative (`Type/id`) and `urn:` references are resolved against entry
  `fullUrl`s and resource ids (unresolved internal references are warnings;
  missing contained targets are errors).
- Bundle entries are checked with the same base- and schema-level rules.

## Slice matching

When a `slicing` issue appears, pair the profile with the instance to find which
array entry matches which named slice (value/pattern discriminators):

```bash
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/match-slices.mjs" <profile-structuredefinition.json> <instance.json>
```

## What it does NOT check

It does not load StructureDefinitions, packages, or terminology, so it cannot
validate profiles, ValueSet/CodeSystem bindings, FHIRPath invariants,
cross-document references, or canonicals. Resource types without an embedded
schema receive only the base-resource checks and an `incomplete` informational
issue. For full conformance, run a profile-aware runtime with the relevant
FHIR/IG packages.

The embedded schema lives in `scripts/lib/r4-structural-schema.mjs` and the
primitive validators in `scripts/lib/r4-primitives.mjs`; extend them there to
cover more resource types, code bindings, or primitive elements.
