---
description: Run end-to-end local structural FHIR validation (detect, validate, explain, map) with the Records fhir-validation skill.
argument-hint: "[file-or-directory]"
---

# Records FHIR Validate

Use `/records:fhir-validation` behavior for this validation task. Prefer a
profile-aware runtime (Records CLI/MCP/API, IG Publisher, HAPI, Firely) when
one is configured; this command runs the local **structural fallback** and must
be labeled as such.

Target: `$ARGUMENTS` or the current working directory.

Run the orchestrator, which detects project context for directories, validates
each resource, and enriches every issue with fixability guidance and a JSON
Pointer:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/fhir-validation/scripts/validate.mjs" "$ARGUMENTS"
```

If no argument was provided, use `.`. Summarize:

1. Mode and privacy boundary (structural fallback; not profile/terminology/
   invariant/cross-document-reference aware).
2. Totals: resources scanned, errors, warnings, information.
3. Errors first, grouped by file and path, with the JSON Pointer and whether
   the fix is mechanical, domain input, or setup/package repair.
4. For directories, surface the detector's recommended order and any missing
   package dependencies.

Do not edit files unless the user explicitly asks for fixes, and do not claim
profile conformance from this structural run.
