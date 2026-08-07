---
description: Run end-to-end local FHIR validation with runtime planning, privacy gates, and structural fallback.
argument-hint: "[file-or-directory]"
---

# Records FHIR Validate

Use `/records:fhir-validation` behavior for this validation task. Prefer a
configured local Records CLI when available. If no executable local Records
runtime is available, use the local **structural fallback** and label it as
such.

Target: `$ARGUMENTS` or the current working directory.

Run the orchestrator, which detects project context, builds a runtime plan,
enforces privacy gates, validates each resource, and enriches every issue with
fixability guidance and a JSON Pointer:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/fhir-validation/scripts/validate.mjs" "$ARGUMENTS"
```

If no argument was provided, use `.`. Summarize:

1. Mode, selected runtime, runtime attempts, and privacy boundary.
2. Totals: resources scanned, errors, warnings, information.
3. Errors first, grouped by file and path, with the JSON Pointer and whether
   the fix is mechanical, domain input, or setup/package repair.
4. Package doctor findings, detector recommended order, and any missing
   package dependencies.

Do not edit files unless the user explicitly asks for fixes, and do not claim
profile conformance unless the selected runtime actually loaded profile,
package, terminology, and invariant context.
