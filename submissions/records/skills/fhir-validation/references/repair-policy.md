# Repair Policy

Use this policy before editing FHIR resources, FSH, CI, or validation configuration.

## Safe Mechanical Fixes

These are usually safe when local evidence is clear:

- JSON syntax and formatting.
- Primitive type shape errors, such as number vs string, when FHIR requires the shape and the intended lexical value is unchanged.
- Moving fields to the correct FHIR path when there is only one valid location and no meaning changes.
- Removing duplicate generated files when one copy is clearly stale and source files remain intact.
- Updating CI commands to call existing local validators correctly.
- Rebuilding generated artifacts with existing project tooling.

## Requires Domain Input

Ask for user or domain authority before:

- Adding or changing clinical codes, displays, systems, or ValueSets.
- Selecting a required status such as `final`, `active`, `unknown`, or `entered-in-error`.
- Creating identifiers, references, dates, encounter links, patient links, performer links, or organization links.
- Resolving `business-rule`, complex `invariant`, terminology, authorization, or server-policy failures.
- Changing profile canonical URLs unless local project source proves the typo.
- Choosing a slice when the discriminator depends on clinical or business meaning.

## Stop Conditions

Stop patching and report the blocker when:

- Remaining issues require clinical values not present in local source data.
- The validator cannot resolve packages, profiles, terminology, or FHIR version.
- Multiple local artifacts could be the source of truth.
- Revalidation changes failures in a way that suggests the setup is unstable.

## Privacy and Security

- Prefer local Records CLI, SUSHI, IG Publisher, Firely Terminal, HAPI, or Java validator if already installed.
- Ask before installing any validator, downloading packages from private feeds, contacting terminology servers, or calling hosted Records/API/FHIR endpoints.
- Do not paste full Patient resources, identifiers, addresses, telecoms, notes, or complete Bundles into summaries unless the user explicitly asks and it is necessary.
- If a URL points to a FHIR server or resource, ask before fetching it because access logs and response bodies may expose PHI.
- Use `scripts/redact-fhir-summary.mjs` for concise local summaries when the resource may contain PHI.
