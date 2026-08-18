<p align="center">
  <picture>
    <img src="./assets/records-app-icon.svg" alt="Records" width="96" height="96">
  </picture>
</p>

# Records Agent Tools

[![Plugin CI](https://github.com/medvertical/records-agent-tools/actions/workflows/plugin-ci.yml/badge.svg)](https://github.com/medvertical/records-agent-tools/actions/workflows/plugin-ci.yml)
![Version](https://img.shields.io/badge/version-0.8.3-blue)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Verified by ClaudeRegistry](https://clauderegistry.com/badge/records.svg)](https://clauderegistry.com/plugin/records)

FHIR validation and data-quality workflow skills for Claude Code and Codex.

Records helps FHIR developers, IG authors, and AI agents validate FHIR JSON, explain validation issues, add CI checks, and run validate-patch-revalidate workflows without sending patient data to an external service by default.

Use Records as a local-first FHIR validator for HL7 FHIR R4 resources, `OperationOutcome` triage, `StructureDefinition` and profile workflows, FSH/SUSHI Implementation Guides, IG Publisher setup, and GitHub Actions quality gates.

Learn more at [medvertical.com](https://medvertical.com) and [medvertical.com/records](https://medvertical.com/records).

## Preview

<table>
  <tr>
    <td><img src="./assets/screenshot-validation.png" alt="Records FHIR validation result" width="460"></td>
    <td><img src="./assets/screenshot-doctor.png" alt="Records FHIR project diagnostics" width="460"></td>
    <td><img src="./assets/screenshot-ci.png" alt="Records FHIR CI quality gate" width="460"></td>
  </tr>
  <tr>
    <td align="center">FHIR validation</td>
    <td align="center">Project diagnostics</td>
    <td align="center">CI quality gates</td>
  </tr>
</table>

## Install

### Claude Code

From your shell:

```bash
claude plugin marketplace add medvertical/records-agent-tools
claude plugin install records@medvertical
```

Or from inside a Claude Code session:

```text
/plugin marketplace add medvertical/records-agent-tools
/plugin install records@medvertical
```

Records is also listed as a Verified plugin in the [ClaudeRegistry](https://clauderegistry.com/plugin/records) community marketplace:

```text
/plugin marketplace add clauderegistry/marketplace
/plugin install records@clauderegistry
```

Both install the same plugin. `medvertical/records-agent-tools` remains the canonical source.

Run local FHIR validation with:

```text
/records:validate ./examples
```

### Codex

```bash
codex plugin marketplace add medvertical/records-agent-tools
codex plugin add records@medvertical
```

Then ask Codex to use Records, for example:

```text
Use the Records FHIR validation skill to validate ./examples.
```

## Platform Support

| Capability | Claude Code | Codex |
| --- | --- | --- |
| `fhir-validation`, `fhir-project-doctor`, and `fhir-ci-quality` skills | Yes | Yes |
| Marketplace installation | Yes | Yes |
| Slash commands | Yes | No; use natural-language prompts |
| Read-only validation reviewer agent | Yes | No; ask for a read-only review |

## Quickstart

After installation, try the bundled non-PHI fixtures. In Claude Code:

```text
/records:validate fixtures/invalid-observation.json
/records:doctor fixtures/mini-ig
/records:explain-outcome fixtures/operationoutcome-required.json
```

The first command runs the end-to-end local validation orchestrator. The second detects a mini SUSHI/FSH IG project. The third explains a sample `OperationOutcome` without claiming that a new validation run happened.

In Codex, ask for the same workflows in natural language and reference the fixture path.

## Skills

### `fhir-validation`

Validate FHIR resources, explain issues, map generated artifacts to FSH, and guide safe repair loops.

### `fhir-project-doctor`

Diagnose FHIR versions, local runtimes, package-cache state, privacy gates, and setup blockers.

### `fhir-ci-quality`

Generate pinned CI validation and derive candidate quality rules that remain reviewable proposals.

Claude Code exposes `/records:fhir-validation` and the focused commands below. Codex exposes the shared skill through the Records plugin.

Example Claude Code prompts:

```text
/records:validate patient.json
/records:fhir-validation { "resourceType": "Observation" }
/records:explain-outcome operationoutcome.json
/records:init-ci ./examples
/records:doctor this IG folder
```

## Claude Code Commands

The Claude Code plugin includes focused commands that route into the `fhir-validation` workflow:

- `/records:doctor` - diagnose FHIR/IG project structure, runtimes, and privacy boundaries.
- `/records:validate` - run local validation with runtime planning, privacy gates, package diagnostics, and structural fallback.
- `/records:init-ci` - generate or update Records FHIR validation CI.
- `/records:explain-outcome` - explain FHIR `OperationOutcome` issues and safe fixability.
- `/records:derive-quality-rules` - derive reviewable project quality rules from local evidence.

Claude Code also includes the read-only `fhir-validation-reviewer` agent for diagnosis without edits.

## Feature Matrix

| Feature | What it does |
| --- | --- |
| Project detection | Detects FHIR resources, SUSHI/FSH, IG Publisher files, CI workflows, runtimes, and privacy warnings. |
| Runtime planning | Selects local Records CLI when executable, blocks URL/server/API/terminology/package actions without consent, and falls back deterministically. |
| Package doctor | Checks FHIR package cache, declared dependencies, profile canonicals, mixed FHIR versions, and setup-looking failures. |
| Local structural validation | Validates common R4 resources and refuses declared non-R4 projects instead of overstating coverage. |
| OperationOutcome explanation | Maps issue codes such as `required`, `code-invalid`, `profile-unknown`, and `slicing` to fixability and setup guidance. |
| Slicing analysis | Analyzes StructureDefinition snapshots and matches instances to named slices using value and pattern discriminators. |
| FSH source mapping | Traces `fsh-generated/resources/*.json` issues back to likely `input/fsh` declarations. |
| CI generation | Drafts least-privilege workflows with pinned Records/SUSHI versions and shell-safe resource paths. |
| Privacy redaction | Summarizes Patient-like resources, Bundles, identifiers, and references without printing full PHI. |
| Quality rules | Derives reviewable project data-quality rules from local evidence. |

## What It Does

The FHIR validation skill guides the coding agent through five validation paths:

1. **Records MCP tools**, when available.
2. **Records API**, when `RECORDS_API_URL` is configured.
3. **Records CLI**, using `records validate-file`.
4. **Configured profile-aware validators**, such as SUSHI, IG Publisher, Firely Terminal, Java validator, or HAPI when already available.
5. **Structural fallback**, clearly labeled when no Records runtime is available.

The local CLI fallback uses Records' packaged FHIR R4 structural schema for resource types, required fields, unknown fields, cardinality, primitive types, choice fields, and simple backbone children. It does not replace profile, terminology, invariant, reference, metadata, advisor-rule, anomaly, or evidence-report validation.

Executable helper scripts support deterministic project detection (including FHIR package-cache and dependency resolution), runtime planning with privacy gates, package-cache diagnostics, local structural fallback validation (multi-resource schema, primitive datatype formats, required choices, and contained/intra-Bundle reference integrity), an end-to-end validation orchestrator, StructureDefinition snapshot/slicing analysis and instance-based slice matching, generated FSH source mapping, OperationOutcome explanation, PHI-minimizing summaries, quality-rule derivation, CI YAML generation, and FHIR expression to JSON Pointer mapping.

## Repository Scope

This repository is plugin/skill-only. It contains marketplace metadata for Claude Code and Codex, three focused Records skills, Claude Code commands and agent metadata, published-IG fixtures, and local/Codex installation tests.

The Records Engine, CLI, API, and MCP server live in the Records main repository. This plugin can use those runtimes when they are already installed or configured, but this repository does not contain their implementation.

## Requirements

- Claude Code or Codex is required to install and run the plugin.
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

Machine-readable helper output follows the [result contract](./docs/result-contract.md).

## Troubleshooting

- Claude Code commands are missing: restart Claude Code and check `/plugin`.
- Codex cannot see the skill after installation: start a new thread so it loads the updated plugin.
- `records` not found: the Records CLI is optional; the skill will use another configured runtime or structural fallback.
- Toolchain validation fails: run `npm ci` to install the pinned Claude Code and Codex CLI versions.
- Generated JSON has validation errors: edit `input/fsh` when FSH sources exist, then rebuild with SUSHI.
- Full profile validation is not running: confirm the validator has access to the required profiles, packages, terminology, and FHIR version.

## Distribution

The canonical Claude Code and Codex marketplace source is `medvertical/records-agent-tools`. Claude community marketplace submission material lives in [submission.md](./submission.md); the repository remains directly installable before and during directory review.

Records is additionally listed in the ClaudeRegistry community marketplace as a Verified-tier plugin, audited against the [published verification methodology](https://clauderegistry.com/verification). That listing carries a vendored copy, so it follows this repository one release behind until each re-sync lands.

## Release Notes

See [eval-results/v0.8.3.md](./eval-results/v0.8.3.md) for the current release checks and scope.

## Development

Run plugin checks from this `records-agent-tools` repository root:

```bash
npm ci
npm run check
```

`npm run check` runs smoke tests, synthetic and published-IG evals, a staged Codex install/invocation test, pinned Claude validators, and release metadata checks. CI additionally performs a live Codex marketplace install in its disposable runner. Prompt-level release checks live in [evals.md](./evals.md).
