# Claude Community Marketplace Submission

Use this content for the Claude community marketplace submission form:

- Claude Console: https://platform.claude.com/plugins/submit
- Claude Team or Enterprise: https://claude.ai/admin-settings/directory/submissions/plugins/new

## Plugin

Records

## Repository

https://github.com/medvertical/records-agent-tools

## Install

```bash
claude plugin marketplace add medvertical/records-agent-tools
claude plugin install records@medvertical
```

## Invocation

```text
/records:validate ./examples
```

## Short Description

Local-first FHIR R4 validation, Implementation Guide diagnostics, and CI quality workflows for Claude Code.

## Long Description

Records helps FHIR developers, Implementation Guide authors, and AI agents validate HL7 FHIR R4 JSON, explain `OperationOutcome` and profile issues, diagnose FSH/SUSHI and IG Publisher projects, add CI quality gates, and run validate-patch-revalidate workflows with Claude Code.

The `fhir-validation` skill is local-first and privacy-oriented. It uses Records MCP tools when available, a user-configured Records API when explicitly configured, the local `records validate-file` CLI when available, configured IG/SUSHI/Firely/HAPI validators for profile-aware workflows, or a clearly labeled structural fallback when no Records runtime is available.

Version 0.8.2 narrows the read-only `fhir-validation-reviewer` agent to an explicit least-privilege tool allow-list and documents the in-session `/plugin install` commands. Version 0.8.1 improved marketplace discovery for high-intent FHIR validator, conformance, Implementation Guide, SUSHI, and CI searches; aligned icons and screenshots with the MedVertical brand system; and moved generated GitHub Actions workflows to Node 24 and `actions/*@v5`.

Unlike validator-specific runbooks, Records positions Claude around a data-quality workflow: validate, explain, patch safe mechanical issues, revalidate, and escalate domain-dependent clinical values instead of inventing placeholders.

## Category

development

## Keywords

FHIR, FHIR validation, FHIR validator, HL7 FHIR, FHIR R4, healthcare interoperability, health data, data quality, FHIR conformance, FHIR profiles, StructureDefinition, OperationOutcome, Implementation Guide, IG authoring, IG Publisher, SUSHI, terminology, GitHub Actions, CI/CD, Records

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

Release checks include pinned Claude plugin validation, a clean Codex marketplace install/discovery check, component smoke tests, synthetic and published-IG fixtures, result-contract checks, runtime/privacy/package checks, bounded-input checks, structural validation, slicing, and PHI redaction snapshots.

## License

MIT

## Release

https://github.com/medvertical/records-agent-tools/releases/latest

## Screenshots

- `plugins/records/assets/screenshot-validation.png`
- `plugins/records/assets/screenshot-doctor.png`
- `plugins/records/assets/screenshot-ci.png`
