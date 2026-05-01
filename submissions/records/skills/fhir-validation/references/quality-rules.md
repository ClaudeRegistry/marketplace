# Quality Rules

Use this reference when deriving project-specific FHIR data-quality rules or CI gates.

## Derivation Principles

- Sample representative resources by resource type, profile, and source directory.
- Treat inferred rules as proposed policy, not clinical truth.
- Prefer existing project patterns over new formats.
- Do not infer clinical coding policy, status values, or business rules from one example.
- Separate validation rules from data-completeness and data-quality heuristics.

## Candidate Rule Types

- Required `meta.profile` usage by resource type.
- Allowed identifier systems already used consistently in the project.
- Reference conventions such as relative references vs contained references.
- Expected local extensions and modifier-extension restrictions.
- Bundle entry shape, fullUrl conventions, and resource id consistency.
- Dataset completeness checks, such as resources missing patient linkage.
- Known non-PHI fixture quality checks for CI.

## CI Guidance

Prefer local Records CLI for CI:

```bash
records validate-file <resource-directory> --format junit
```

If full API-backed validation is requested:

```bash
records --api-url "$RECORDS_API_URL" --auth-token "$RECORDS_API_KEY" validate-file <resource-directory> --format junit
```

Add explicit install steps when the repository does not already provide `records`. Do not assume a global CLI in CI. Do not claim CI is profile-aware unless the configured runtime loads profiles, packages, and terminology context.

For concrete GitHub Actions snippets, load [ci-templates.md](ci-templates.md).

## Review Output

For each proposed rule include:

- Evidence: files or resource types sampled.
- Rule: concise machine-checkable statement.
- Confidence: high, medium, or low.
- Reviewer: technical, domain, terminology, privacy, or security owner.
- CI fit: Records CLI, Records API, existing script, or manual review.
