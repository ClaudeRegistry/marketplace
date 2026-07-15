---
description: Add or update repository CI for Records FHIR validation.
argument-hint: "[resource-directory]"
---

# Initialize Records FHIR Validation CI

Use `/records:fhir-validation` and read `skills/fhir-validation/references/quality-rules.md` plus `skills/fhir-validation/references/ci-templates.md` when needed.

Target resource directory: `$ARGUMENTS` or infer from detector output.

Use this helper for a first draft when the target repository does not already have a better workflow pattern:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/fhir-validation/scripts/generate-ci.mjs" --dir "$ARGUMENTS"
```

Steps:

1. Run the detector script to find source directories, generated directories, package scripts, and existing `.github/workflows`.
2. Prefer an existing repository package manager and validation script if present.
3. Add a GitHub Actions workflow only when the repository has no suitable validation workflow.
4. Use `records validate-file <resource-directory> --format junit` for local CLI validation.
5. Use `records --api-url "$RECORDS_API_URL" --auth-token "$RECORDS_API_KEY" ...` only when the user asks for API-backed validation.
6. Add an explicit CLI install step if the repository does not already install Records.

Do not add Firely, HAPI, Java validator, SUSHI, or external terminology services unless the user asks for that validator and consents to the installation/network boundary.
