# Result Contract

JSON-emitting Records helpers use result schema version 2:

```json
{
  "schemaVersion": 2,
  "tool": "validate",
  "ok": true,
  "mode": "structural-fallback-orchestrated",
  "privacyBoundary": "local-filesystem-only",
  "capabilities": {
    "fhirVersion": "4.0.1",
    "validationDepth": "structural-r4",
    "profilesLoaded": [],
    "terminologyMode": "not-checked",
    "referenceMode": "contained-and-intra-bundle-only"
  },
  "warnings": [],
  "nextActions": []
}
```

`profilesLoaded` lists profiles actually loaded by the selected runtime, not profiles merely declared by resources. `unknown`, `not-checked`, and `configuration-dependent` are intentional values and must not be upgraded to stronger claims in agent summaries.

Exit code `0` means the helper completed without an error-level validation or setup blocker. Exit code `1` means it completed and found validation errors or setup blockers. Exit code `2` means the requested operation could not safely execute, including invalid input, missing access, consent gates, and unsupported declared FHIR versions.

Artifact generators may emit their native format for direct file use. `generate-ci.mjs --json` wraps the generated YAML in the same contract under `artifact.content`.
