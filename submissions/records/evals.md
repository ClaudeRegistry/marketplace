# Records FHIR Validation Skill Evals

Use these prompts before releasing a new plugin version. The goal is not to prove model determinism; it is to catch obvious skill-regression patterns before publishing.

## 1. Single Invalid Patient File

Prompt:

```text
/records:fhir-validation validate this file: mii-patient-test.json
```

Expected behavior:

- Uses `records validate-file` or the local Records checkout equivalent when available.
- Labels local CLI output as local structural validation when full API/MCP validation was not used.
- Does not claim profile, terminology, or invariant validation unless a full Records runtime was used.

## 2. Invalid Pasted Observation JSON

Prompt:

```text
/records:fhir-validation { "resourceType": "Observation" }
```

Expected behavior:

- Parses the JSON.
- Reports missing `Observation.status` and `Observation.code` as structural issues.
- Does not invent clinical codes or status values without user context.
- States whether this was structural fallback or Records CLI validation.

## 3. Fix Loop

Prompt:

```text
/records:fhir-validation fix this invalid Observation and revalidate:
{ "resourceType": "Observation", "status": 12 }
```

Expected behavior:

- Validates first.
- Fixes only mechanical structural issues that are inferable.
- Does not invent `Observation.status` or `Observation.code`.
- Does not add placeholder `CodeableConcept.text` just to make validation pass.
- Revalidates after any patch.
- Reports before/after counts and remaining domain-input needs.

## 4. CI Setup

Prompt:

```text
/records:fhir-validation add GitHub Actions validation for ./examples
```

Expected behavior:

- Uses `records validate-file ./examples --format junit`.
- Uses `records --api-url "$RECORDS_API_URL" --auth-token "$TOKEN" validate-file ...` for API-backed validation.
- Adds an install step if `@records-fhir/cli` is not already available in the repository.
- Does not use a `--server` flag; the current CLI uses global `--api-url` and `--auth-token`.
- Does not switch to Firely/HAPI unless the user asks for cross-checking.
- Uses API credentials only when full API-backed validation is requested.

## 5. OperationOutcome Explanation

Prompt:

```text
/records:fhir-validation explain this OperationOutcome:
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "required",
      "diagnostics": "Observation.status: minimum required = 1, but only found 0",
      "expression": ["Observation.status"]
    }
  ]
}
```

Expected behavior:

- Groups by severity.
- Explains the issue in plain language.
- Identifies safe vs domain-dependent fixes.
- Does not claim a full validation run happened.

## 6. IG Folder

Prompt:

```text
/records:fhir-validation validate plugins/records/fixtures/mini-ig
```

Expected behavior:

- Runs or attempts the detector script first.
- Reports project type `fsh-ig`, `input/fsh`, `fsh-generated/resources`, `sushi-config.yaml`, and `ig.ini`.
- Uses Records CLI for JSON resources when possible.
- Clearly states that full IG/profile validation needs Records MCP/API/engine mode or another configured profile-aware validator.
- Does not hallucinate unsupported Records commands.

## 7. FSH Source Mapping

Prompt:

```text
/records:fhir-validation fix validation errors in this IG where the error points to fsh-generated/resources/StructureDefinition-Demo.json
```

Expected behavior:

- Checks for `input/fsh`, `sushi-config.yaml`, and related source files before editing.
- Does not directly edit `fsh-generated/resources` when source files exist.
- Searches `input/fsh` for the generated artifact's `id`, `url`, `name`, `Instance`, `Profile`, or `Extension`.
- Makes only mechanical FSH changes; asks for domain input for clinical codes or slice choices.
- Runs or recommends `sushi` build before re-running Records/validator.
- Explains that generated artifacts are rebuilt and source files are the durable fix location.

## 8. Quality Rule Derivation

Prompt:

```text
/records:fhir-validation derive data-quality rules from ./examples
```

Expected behavior:

- Samples representative resources instead of assuming one example defines policy.
- Proposes rules as reviewable project policy, not authoritative clinical truth.
- Avoids inventing clinical codes, status values, or business rules without evidence.
- Prefers Records-compatible rule or CI artifacts when the repository has an existing pattern.

## 9. Project Detection

Prompt:

```text
/records:doctor plugins/records/fixtures/mini-ig
```

Expected behavior:

- Uses `skills/fhir-validation/scripts/detect-fhir-project.mjs`.
- Outputs `projectType`, `sourceDirs`, `generatedDirs`, `workflowFiles`, `availableRuntimes`, `recommendedOrder`, and `privacyWarnings`.
- Uses `schemaVersion: 1` and marks missing local commands as `available: false` with `reason: "not_found"`.
- Includes FHIR version, package dependency, resource inventory, `meta.profile`, and privacy risk signals when present.
- Recommends source-first FSH inspection before generated JSON edits.
- Does not install SUSHI, Java validator, Firely, or HAPI without consent.

## 10. Privacy Boundary

Prompt:

```text
/records:fhir-validation validate https://fhir.example.test/Patient/123
```

Expected behavior:

- Treats the URL as a possible FHIR server/resource access.
- Asks for explicit consent before fetching it.
- States that local validation is preferred when a local resource file can be provided.
- Uses `redact-fhir-summary.mjs` or equivalent minimization for PHI-sensitive local summaries.
- Does not include full Patient resources or identifiers in summaries unless necessary and explicitly requested.

## 11. CI Generation

Prompt:

```text
/records:init-ci plugins/records/fixtures
```

Expected behavior:

- Runs project detection and checks existing `.github/workflows` before writing.
- Uses `records validate-file <dir> --format junit`.
- Adds a Records CLI install step when the target repository has no existing Records install.
- Uses `RECORDS_API_URL`/`RECORDS_API_KEY` only for explicitly requested API-backed validation.
- Does not use unsupported flags such as `--server`.

## 12. OperationOutcome Setup Triage

Prompt:

```text
/records:explain-outcome plugins/records/fixtures/operationoutcome-required.json
```

Expected behavior:

- Explains `required` as a missing mandatory element.
- Explains `code-invalid` as terminology or required-code failure.
- Separates safe mechanical fixes from domain-required terminology decisions.
- Notes that `code-invalid`, `profile-unknown`, `not-found`, `processing`, and `slicing` can indicate package, terminology, or generated-artifact setup problems.

## 13. Executable Fixture Harness

Command:

```bash
npm test
```

Expected behavior:

- Runs the plugin structure smoke test.
- Runs fixture evals for project detection, generated-to-FSH mapping, and PHI-safe summaries.
- Fails if manifest/package versions diverge.
- Fails if command/agent/skill frontmatter is missing or malformed.
- Fails if detector marks missing commands as available when `PATH` is empty.

## 14. Tool Mock Runtime Detection

Command:

```bash
npm test
```

Expected behavior:

- Creates temporary fake `records`, `sushi`, `fhir`, and `hapi-fhir-cli` binaries.
- Detector marks them as available.
- Detector captures version output and executable path.

## 15. Scripted OperationOutcome and Path Mapping

Commands:

```bash
node plugins/records/skills/fhir-validation/scripts/explain-operationoutcome.mjs plugins/records/fixtures/operationoutcome-required.json
node plugins/records/skills/fhir-validation/scripts/map-fhir-expression.mjs "Observation.category[0].coding[0].code"
```

Expected behavior:

- OperationOutcome output includes `issueCount`, severity counts, safe fixability, domain-input needs, and setup/package signal.
- Expression mapper outputs `/category/0/coding/0/code` with a caveat about predicates and slices.

## 16. Release Check

Command:

```bash
npm run release:check
```

Expected behavior:

- Runs `npm test`.
- Runs Claude plugin validation for marketplace and plugin manifests.
- Confirms version sync and current eval-result file.
- Runs live `claude plugin marketplace update` and `claude plugin update` only when `claude` is available in `PATH`; otherwise reports that the live update check was skipped.
