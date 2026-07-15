// Single source of truth for OperationOutcome issue-code guidance.
//
// Both scripts/explain-operationoutcome.mjs and references/operationoutcome-map.md
// derive their content from this list. Regenerate the markdown table with:
//   node scripts/generate-issue-map-doc.mjs
// The smoke test fails if the markdown table drifts from this source.

export const issueCodes = [
  {
    code: "required",
    meaning: "A mandatory element is missing or a cardinality minimum is not met.",
    safeFixability: "Safe only when the value is mechanically implied by local source data.",
    domainInput: "Needed for clinical fields such as Observation.status, Observation.code, identifiers, dates, references, and coded concepts.",
    setupSignal: "Likely if the missing element comes from an unexpected profile or stale generated artifact.",
  },
  {
    code: "value",
    meaning: "A value has the wrong primitive shape, datatype, cardinality, or format.",
    safeFixability: "Often safe for syntax-only fixes, such as string vs number or invalid date formatting when the intended value is obvious.",
    domainInput: "Needed when changing the actual clinical or business meaning.",
    setupSignal: "Possible if validator version and FHIR version disagree.",
  },
  {
    code: "code-invalid",
    meaning: "A code is not allowed by the bound ValueSet, code system, or required FHIR enum.",
    safeFixability: "Safe for typos in required FHIR enums when the intended code is obvious from source.",
    domainInput: "Usually needed for terminology substitutions or clinical coding.",
    setupSignal: "Very likely when terminology packages, tx server, or IG dependencies are missing.",
  },
  {
    code: "structure",
    meaning: "The resource shape does not match the base resource or profile structure.",
    safeFixability: "Safe for moving fields to the correct path only when source intent is unambiguous.",
    domainInput: "Needed if profile design or slice selection is unclear.",
    setupSignal: "Likely with wrong FHIR version, wrong profile, or stale generated StructureDefinitions.",
  },
  {
    code: "invariant",
    meaning: "A FHIRPath invariant failed.",
    safeFixability: "Sometimes safe for purely structural invariants with clear local evidence.",
    domainInput: "Often needed because invariants frequently encode clinical or IG policy.",
    setupSignal: "Possible if dependencies or profiles are stale.",
  },
  {
    code: "processing",
    meaning: "The validator could not process input, terminology, packages, references, or expressions.",
    safeFixability: "Fix setup first; avoid resource edits until the processing cause is known.",
    domainInput: "Needed only after setup is ruled out.",
    setupSignal: "Very likely. Check package cache, validator version, network/tx server, and IG build artifacts.",
  },
  {
    code: "not-found",
    meaning: "A referenced resource, profile, ValueSet, CodeSystem, package, or endpoint was not found.",
    safeFixability: "Safe for obvious local path/package configuration fixes.",
    domainInput: "Needed before redirecting references or changing canonical URLs.",
    setupSignal: "Very likely, especially for missing package dependencies or unresolved canonicals.",
  },
  {
    code: "duplicate",
    meaning: "Duplicate ids, canonicals, slice names, resources, or package entries were detected.",
    safeFixability: "Safe for generated duplicate cleanup only when one copy is clearly stale.",
    domainInput: "Needed when deciding which clinical/business artifact is authoritative.",
    setupSignal: "Likely after partial rebuilds, copied examples, or duplicate FSH definitions.",
  },
  {
    code: "forbidden",
    meaning: "An element or operation is not allowed by the base resource, profile, or server policy.",
    safeFixability: "Safe to remove only when it is clearly accidental metadata or generated debris.",
    domainInput: "Needed for real clinical/business fields or server authorization policy.",
    setupSignal: "Possible wrong profile/server context.",
  },
  {
    code: "incomplete",
    meaning: "The validator lacks enough information to complete validation, or the resource is incomplete for the requested operation.",
    safeFixability: "Safe for setup/configuration fixes.",
    domainInput: "Needed if missing data must be supplied from a domain source.",
    setupSignal: "Common with missing terminology, package dependencies, or partial Bundles.",
  },
  {
    code: "business-rule",
    meaning: "A profile, server, or project business rule failed.",
    safeFixability: "Rarely auto-fixable beyond mechanical evidence-backed changes.",
    domainInput: "Usually required. Business rules are policy, not syntax.",
    setupSignal: "Possible if the wrong profile or server endpoint was selected.",
  },
  {
    code: "profile-unknown",
    meaning: "A meta.profile or requested profile canonical could not be resolved.",
    safeFixability: "Safe to fix package/dependency configuration; do not rewrite profile URLs casually.",
    domainInput: "Needed before changing canonical URLs.",
    setupSignal: "Very likely. Check sushi-config.yaml, ig.ini, package dependencies, package cache, and validator flags.",
  },
  {
    code: "slicing",
    meaning: "A repeating element did not match the expected slice or slice cardinality.",
    safeFixability: "Safe only for mechanical slice-name or discriminator placement fixes backed by FSH/profile evidence.",
    domainInput: "Often needed for selecting the correct slice or coding.",
    setupSignal: "Likely if generated profiles are stale, dependencies are missing, or the validator cannot resolve slice definitions.",
  },
];

export const issueByCode = Object.fromEntries(issueCodes.map((entry) => [entry.code, entry]));

export const unknownIssue = {
  code: "unknown",
  meaning: "Unknown or validator-specific issue code.",
  safeFixability: "Review needed.",
  domainInput: "Review needed.",
  setupSignal: "Check validator provenance.",
};
