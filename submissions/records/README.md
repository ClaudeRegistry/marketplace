<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/records-signet-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/records-signet.svg">
    <img src="./assets/records-signet.svg" alt="Records" width="96" height="96">
  </picture>
</p>

# Records for Claude Code

[![Plugin CI](https://github.com/medvertical/claude-records/actions/workflows/plugin-ci.yml/badge.svg)](https://github.com/medvertical/claude-records/actions/workflows/plugin-ci.yml)
![Version](https://img.shields.io/badge/version-0.3.0-blue)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

FHIR validation and data-quality workflow skills for Claude Code.

Records helps FHIR developers, IG authors, and AI agents validate FHIR JSON, explain validation issues, add CI checks, and run validate-patch-revalidate workflows without sending patient data to an external service by default.

Learn more at [medvertical.com](https://medvertical.com) and [medvertical.com/records](https://medvertical.com/records).

## Install

```bash
claude plugin marketplace add medvertical/claude-records
claude plugin install records@medvertical
```

Invoke the FHIR validation skill:

```text
/records:fhir-validation validate ./examples
```

## Quickstart

After installation, try the bundled non-PHI fixtures:

```text
/records:doctor fixtures/mini-ig
/records:explain-outcome fixtures/operationoutcome-required.json
```

The first command detects a mini SUSHI/FSH IG project. The second explains a sample `OperationOutcome` without claiming that a new validation run happened.

## Skills

### `/records:fhir-validation`

Validate FHIR resources, explain issues, add CI checks, and guide safe repair loops.

Example prompts:

```text
/records:fhir-validation validate patient.json
/records:fhir-validation { "resourceType": "Observation" }
/records:fhir-validation explain this OperationOutcome: ...
/records:fhir-validation add GitHub Actions validation for ./examples
/records:fhir-validation validate this IG folder
```

## Commands

The plugin includes focused commands that route into the `fhir-validation` workflow:

- `/records:doctor` - diagnose FHIR/IG project structure, runtimes, and privacy boundaries.
- `/records:init-ci` - generate or update Records FHIR validation CI.
- `/records:explain-outcome` - explain FHIR `OperationOutcome` issues and safe fixability.
- `/records:derive-quality-rules` - derive reviewable project quality rules from local evidence.

It also includes the read-only `fhir-validation-reviewer` agent for diagnosis without edits.

## Feature Matrix

| Feature | What it does |
| --- | --- |
| Project detection | Detects FHIR resources, SUSHI/FSH, IG Publisher files, CI workflows, runtimes, and privacy warnings. |
| OperationOutcome explanation | Maps issue codes such as `required`, `code-invalid`, `profile-unknown`, and `slicing` to fixability and setup guidance. |
| FSH source mapping | Traces `fsh-generated/resources/*.json` issues back to likely `input/fsh` declarations. |
| CI generation | Drafts Records validation GitHub Actions workflows for local or API-backed validation. |
| Privacy redaction | Summarizes Patient-like resources, Bundles, identifiers, and references without printing full PHI. |
| Quality rules | Derives reviewable project data-quality rules from local evidence. |

## What It Does

The FHIR validation skill guides Claude through five validation paths:

1. **Records MCP tools**, when available.
2. **Records API**, when `RECORDS_API_URL` is configured.
3. **Records CLI**, using `records validate-file`.
4. **Configured profile-aware validators**, such as SUSHI, IG Publisher, Firely Terminal, Java validator, or HAPI when already available.
5. **Structural fallback**, clearly labeled when no Records runtime is available.

The local CLI fallback uses Records' packaged FHIR R4 structural schema for resource types, required fields, unknown fields, cardinality, primitive types, choice fields, and simple backbone children. It does not replace profile, terminology, invariant, reference, metadata, advisor-rule, anomaly, or evidence-report validation.

Executable helper scripts support deterministic project detection, generated FSH source mapping, OperationOutcome explanation, PHI-minimizing summaries, quality-rule derivation, CI YAML generation, and FHIR expression to JSON Pointer mapping.

## Repository Scope

This repository is plugin/skill-only. It contains the Claude Code marketplace entry, the `records` plugin, the `fhir-validation` skill, plugin commands, fixtures, and local plugin tests.

The Records Engine, CLI, API, and MCP server live in the Records main repository. This plugin can use those runtimes when they are already installed or configured, but this repository does not contain their implementation.

## Requirements

- Claude Code is required to install and run the plugin.
- Node.js is required for local helper scripts and repository tests.
- Records CLI, Records MCP, Records API, SUSHI, IG Publisher, Firely Terminal, Java validator, and HAPI are optional. The plugin detects and uses them only when available or explicitly configured.
- Full profile, terminology, invariant, and reference validation requires a configured profile-aware runtime and the relevant FHIR/IG packages.

## Why Records

- **Local-first** Node/TypeScript workflow, with no JVM required for local structural checks.
- **Privacy-first** instructions: do not send clinical or patient data externally unless explicitly configured or consented.
- **Agent repair loop**: validate, group issues, patch safe mechanical problems, revalidate.
- **MCP-ready**: direct agent tool calls when Records MCP is configured.
- **Data-quality scope** beyond base conformance: advisor rules, anomaly detection, evidence reports, run comparison, and dataset quality workflows through full Records runtimes.

## Privacy

See [PRIVACY.md](./PRIVACY.md) for the data-handling policy.

## Compatibility

See [docs/compatibility.md](./docs/compatibility.md) for how Records CLI/API/MCP, SUSHI, IG Publisher, Firely Terminal, HAPI, and fallback validation are detected and bounded.

## Troubleshooting

- Installed plugin but commands are missing: restart Claude Code and check `/plugin`.
- `records` not found: the Records CLI is optional; the skill will use another configured runtime or structural fallback.
- `claude` not found during `npm run release:check`: only the live plugin update check is skipped.
- Generated JSON has validation errors: edit `input/fsh` when FSH sources exist, then rebuild with SUSHI.
- Full profile validation is not running: confirm the validator has access to the required profiles, packages, terminology, and FHIR version.

## Registry

Canonical installation is via `medvertical/claude-records`. The ClaudeRegistry submission is for discovery and review.

## Release Notes

See [eval-results/v0.3.0.md](./eval-results/v0.3.0.md) for the current release checks and scope.

## Development

Run plugin checks from this `claude-records` repository root:

```bash
npx --yes @anthropic-ai/claude-code plugin validate .
npm test
npm run release:check
```

`npm test` runs the plugin smoke test and fixture eval harness. Prompt-level release checks live in [evals.md](./evals.md). Results are in [eval-results/](./eval-results/).
