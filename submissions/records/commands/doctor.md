---
description: Diagnose the current repository's FHIR/IG validation setup with the Records fhir-validation skill.
argument-hint: "[path]"
---

# Records FHIR Validation Doctor

Use `/records:fhir-validation` behavior for this diagnostic task.

Target: `$ARGUMENTS` or the current working directory.

Run the deterministic detector script when available:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/fhir-validation/scripts/detect-fhir-project.mjs" "$ARGUMENTS"
```

If no argument was provided, use `.`. Summarize:

1. Project type and source/generated directories.
2. Workflow files and existing CI validation hooks.
3. Available Records, SUSHI, Java validator, Firely, or HAPI runtimes.
4. Recommended validation order.
5. Privacy warnings and any consent gates before network/server/API use.

Do not edit files unless the user explicitly asks for fixes.
