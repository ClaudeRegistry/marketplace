# OperationOutcome Issue Map

Use this map when explaining `OperationOutcome.issue.code` values or Records issue lists. Treat `severity`, `expression`, `location`, `diagnostics`, and validator provenance as more specific than the generic code.

| Code | Meaning | Safe fixability | Domain input needed | Setup/package suspicion |
| --- | --- | --- | --- | --- |
| `required` | A mandatory element is missing or cardinality minimum is not met. | Safe only when the value is mechanically implied by local source data. | Needed for clinical fields such as `Observation.status`, `Observation.code`, identifiers, dates, references, and coded concepts. | Likely if the missing element comes from an unexpected profile or stale generated artifact. |
| `value` | A value has the wrong primitive shape, datatype, cardinality, or format. | Often safe for syntax-only fixes, such as string vs number or invalid date formatting when the intended value is obvious. | Needed when changing the actual clinical or business meaning. | Possible if validator version and FHIR version disagree. |
| `code-invalid` | A code is not allowed by the bound ValueSet, code system, or required FHIR enum. | Safe for typos in required FHIR enums when the intended code is obvious from source. | Usually needed for terminology substitutions or clinical coding. | Very likely when terminology packages, tx server, or IG dependencies are missing. |
| `structure` | The resource shape does not match the base resource or profile structure. | Safe for moving fields to the correct path only when source intent is unambiguous. | Needed if profile design or slice selection is unclear. | Likely with wrong FHIR version, wrong profile, or stale generated StructureDefinitions. |
| `invariant` | A FHIRPath invariant failed. | Sometimes safe for purely structural invariants with clear local evidence. | Often needed because invariants frequently encode clinical or IG policy. | Possible if dependencies or profiles are stale. |
| `processing` | The validator could not process input, terminology, packages, references, or expressions. | Fix setup first; avoid resource edits until processing cause is known. | Needed only after setup is ruled out. | Very likely. Check package cache, validator version, network/tx server, and IG build artifacts. |
| `not-found` | A referenced resource, profile, ValueSet, CodeSystem, package, or endpoint was not found. | Safe for obvious local path/package configuration fixes. | Needed before redirecting references or changing canonical URLs. | Very likely, especially for missing package dependencies or unresolved canonicals. |
| `duplicate` | Duplicate ids, canonicals, slice names, resources, or package entries were detected. | Safe for generated duplicate cleanup only when one copy is clearly stale. | Needed when deciding which clinical/business artifact is authoritative. | Likely after partial rebuilds, copied examples, or duplicate FSH definitions. |
| `forbidden` | An element or operation is not allowed by the base resource, profile, or server policy. | Safe to remove only when it is clearly accidental metadata or generated debris. | Needed for real clinical/business fields or server authorization policy. | Possible wrong profile/server context. |
| `incomplete` | The validator lacks enough information to complete validation or the resource is incomplete for the requested operation. | Safe for setup/configuration fixes. | Needed if missing data must be supplied from a domain source. | Common with missing terminology, package dependencies, or partial Bundles. |
| `business-rule` | A profile, server, or project business rule failed. | Rarely auto-fixable beyond mechanical evidence-backed changes. | Usually required. Business rules are policy, not syntax. | Possible if the wrong profile or server endpoint was selected. |
| `profile-unknown` | A `meta.profile` or requested profile canonical could not be resolved. | Safe to fix package/dependency configuration; do not rewrite profile URLs casually. | Needed before changing canonical URLs. | Very likely. Check `sushi-config.yaml`, `ig.ini`, package dependencies, package cache, and validator flags. |
| `slicing` | A repeating element did not match the expected slice or slice cardinality. | Safe only for mechanical slice-name or discriminator placement fixes backed by FSH/profile evidence. | Often needed for selecting the correct slice or coding. | Likely if generated profiles are stale, dependencies are missing, or the validator cannot resolve slice definitions. |

Explanation pattern:

1. State what failed in plain language.
2. Identify whether the next step is a mechanical fix, domain decision, or setup/package repair.
3. Avoid suggesting placeholder clinical values.
4. For package/setup-looking issues, recommend rebuilding or resolving dependencies before editing resources.
