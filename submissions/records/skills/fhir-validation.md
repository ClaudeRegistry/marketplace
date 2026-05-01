---
name: fhir-validation
description: This skill should be used when the user asks to validate FHIR resources, check FHIR JSON, review Implementation Guide examples, validate AI-created FHIR output, explain validation issues, generate CI validation steps, derive FHIR data-quality rules, or run a validate-patch-revalidate loop with Records.
version: 0.3.0
argument-hint: "[file-or-directory-or-json]"
allowed-tools: [Read, Glob, Grep, Bash, Edit, Write, MultiEdit]
---

# Records FHIR Validation

Validate FHIR resources with Records and local project tooling. Prefer local or already configured execution. Do not send clinical data, patient data, FHIR server URLs, or full patient resources to external services unless the user explicitly consents for this task.

## Arguments

The user invoked this with: $ARGUMENTS

Treat arguments as a file, directory, JSON resource, OperationOutcome, FHIR URL, or validation goal. If no target is inferable, ask one concise question.

## Fast Start

For file or directory validation, first run the deterministic detector when available:

```bash
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/detect-fhir-project.mjs" <target-or-repo>
```

Use the detector output to pick source directories, generated directories, available runtimes, privacy warnings, and validation order. If `CLAUDE_PLUGIN_ROOT` is not set during local development, resolve the script relative to this skill directory.

Then choose the first suitable mode:

1. Records MCP tools, when available.
2. Records API, only when `RECORDS_API_URL` is configured and the privacy boundary is acceptable.
3. Records CLI, using `records validate-file <target>`.
4. Existing local profile-aware validators such as SUSHI, IG Publisher, Firely Terminal, Java validator, or HAPI when already configured and relevant.
5. Structural fallback, clearly labeled as not profile-, terminology-, invariant-, or reference-aware.

## Privacy Gates

Ask for explicit consent before fetching FHIR URLs, contacting FHIR servers, sending resources to external APIs, installing validators, or using hosted/non-local validation on data that may contain PHI. Prefer local CLI validation. In summaries, include paths, issue codes, and minimal snippets; do not reproduce complete Patient resources or unnecessary identifiers.

## Repair Rules

Run validate-patch-revalidate for fixes. Patch only mechanical or clearly inferable issues. Do not invent clinical codes, identifiers, dates, references, status values, or business policy. Stop and ask for domain input when the validator is correct but the right clinical value is not present in local source data.

Generated artifacts are usually not the durable source. If an issue points at `fsh-generated/resources/*.json`, read [references/ig-workflows.md](fhir-validation/references/ig-workflows.md) before editing.

For safe/unsafe fix classification, read [references/repair-policy.md](fhir-validation/references/repair-policy.md).

For generated FSH artifacts, prefer:

```bash
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/map-generated-to-fsh.mjs" <generated-json> <project-root>
```

For PHI-sensitive summaries, prefer:

```bash
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/redact-fhir-summary.mjs" <resource-json>
```

For OperationOutcome JSON, quality-rule derivation, CI YAML, or FHIR expression mapping, use the matching local helper script before free-form reasoning:

```bash
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/explain-operationoutcome.mjs" <operationoutcome-json>
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/derive-quality-rules.mjs" <resource-directory>
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/generate-ci.mjs" --dir <resource-directory>
node "${CLAUDE_PLUGIN_ROOT:-.}/skills/fhir-validation/scripts/map-fhir-expression.mjs" "Observation.category[0].coding[0].code"
```

## Task References

Load detail files only when the task needs them:

- IG, SUSHI, FSH, IG Publisher, Firely, HAPI, or generated-resource workflows: [references/ig-workflows.md](fhir-validation/references/ig-workflows.md)
- OperationOutcome explanation or issue-code triage: [references/operationoutcome-map.md](fhir-validation/references/operationoutcome-map.md)
- Safe repair boundaries and domain-input rules: [references/repair-policy.md](fhir-validation/references/repair-policy.md)
- Data-quality rule derivation and CI quality gates: [references/quality-rules.md](fhir-validation/references/quality-rules.md)
- CI workflow generation templates: [references/ci-templates.md](fhir-validation/references/ci-templates.md)

## Output

Report:

1. Mode and privacy boundary used.
2. Summary counts: errors, warnings, info, and score when available.
3. Errors first, grouped by aspect/path.
4. Safe fixes applied or recommended.
5. Remaining domain, package, terminology, or setup questions.

Always label structural fallback and Records local structural validation honestly. Do not claim full IG conformance unless a profile-aware runtime actually loaded the IG/package context.
