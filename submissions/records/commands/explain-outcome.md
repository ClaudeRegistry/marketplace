---
description: Explain a FHIR OperationOutcome and separate safe fixes from domain/setup issues.
argument-hint: "[operationoutcome-json-or-file]"
---

# Explain FHIR OperationOutcome

Use `/records:fhir-validation` and read `skills/fhir-validation/references/operationoutcome-map.md`.

Input: `$ARGUMENTS`, pasted JSON, or a file path.

When a file path is available, prefer:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/fhir-validation/scripts/explain-operationoutcome.mjs" "$ARGUMENTS"
```

Explain issues by severity and expression/path. For each issue:

1. Translate the validator message into plain language.
2. Classify the likely next step as safe mechanical fix, domain input, or setup/package repair.
3. Note whether the issue may come from missing IG packages, profiles, terminology, or stale generated artifacts.
4. Avoid printing complete Patient resources or unnecessary identifiers.

Do not claim a validation run happened unless one was actually executed.
