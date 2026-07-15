---
description: Derive reviewable FHIR data-quality rules from local project evidence.
argument-hint: "[resource-directory]"
---

# Derive FHIR Quality Rules

Use `/records:fhir-validation` and read `skills/fhir-validation/references/quality-rules.md`.

Target: `$ARGUMENTS` or directories reported by the detector.

When a local directory is available, prefer:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/fhir-validation/scripts/derive-quality-rules.mjs" "$ARGUMENTS"
```

Derive proposed, reviewable quality rules from local evidence:

1. Sample resources by type, profile, and directory.
2. Identify repeated local conventions for `meta.profile`, identifiers, references, extensions, Bundle shape, and completeness.
3. Mark every rule as proposed policy, not authoritative clinical truth.
4. Identify reviewer type: technical, domain, terminology, privacy, or security.
5. Suggest CI fit: Records CLI, Records API, existing script, or manual review.

Do not infer clinical coding policy, status values, or business rules from one example.
