# Claude Plugin Directory Submission

Use this content for the official Claude Code Plugin Directory submission form.

## Plugin

Records

## Repository

https://github.com/medvertical/claude-records

## Install

```bash
claude plugin marketplace add medvertical/claude-records
claude plugin install records@medvertical
```

## Invocation

```text
/records:validate ./examples
```

## Short Description

Local-first FHIR validation and data-quality workflow skill for Claude Code.

## Long Description

Records helps FHIR developers, IG authors, and AI agents validate FHIR JSON, explain validation issues, add CI checks, and run validate-patch-revalidate workflows with Claude Code.

The `fhir-validation` skill is local-first and privacy-oriented. It uses Records MCP tools when available, a user-configured Records API when explicitly configured, the local `records validate-file` CLI when available, configured IG/SUSHI/Firely/HAPI validators for profile-aware workflows, or a clearly labeled structural fallback when no Records runtime is available.

Version 0.6.0 adds executable runtime planning, script-level privacy gates for URL/server/API/terminology/package actions, FHIR package-cache diagnostics, and a local Records CLI adapter before structural fallback. It also includes deterministic FHIR project detection, expanded R4 structural fallback validation, primitive datatype checks, required `choice[x]` checks, contained and intra-Bundle reference integrity checks, StructureDefinition snapshot/slicing analysis, generated FSH source mapping, executable OperationOutcome explanation, PHI-minimizing summaries, CI template generation, project quality-rule derivation, fixture evals, release checks, compatibility documentation, and a read-only FHIR validation reviewer agent.

Unlike validator-specific runbooks, Records positions Claude around a data-quality workflow: validate, explain, patch safe mechanical issues, revalidate, and escalate domain-dependent clinical values instead of inventing placeholders.

## Category

development

## Keywords

FHIR, HL7, Claude Code, healthcare interoperability, validation, Records, MCP, data quality, Implementation Guide, IG authoring

## Privacy

The plugin is local-first. It instructs Claude not to send clinical or patient data to external services unless the user explicitly configured that service or clearly consented. See `PRIVACY.md`.

It includes operational privacy helpers for redacted summaries and explicit consent gates for FHIR URLs, hosted APIs, terminology servers, and validator installation.

## Commands and Agent

- `/records:doctor`
- `/records:validate`
- `/records:init-ci`
- `/records:explain-outcome`
- `/records:derive-quality-rules`
- `records:fhir-validation-reviewer` read-only agent

## Release Quality

Release checks include Claude plugin validation, component smoke tests, fixture evals, detector snapshots, runtime-planning and privacy-gate checks, package-doctor checks, generated-to-FSH mapping snapshots, structural validation snapshots, slicing evals, and PHI redaction snapshots.

## License

MIT

## Release

https://github.com/medvertical/claude-records/releases/latest
