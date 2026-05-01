# Compatibility Matrix

This plugin is a Claude Code plugin/skill package. It does not ship the Records Engine, Records API, Records MCP server, SUSHI, IG Publisher, Firely Terminal, HAPI, Java validator, or terminology services.

| Runtime | Detection | Local by default | Profile-aware | Terminology-aware | Network risk | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Records MCP | Claude tool availability | Depends on user config | Yes when backend supports it | Yes when backend supports it | Depends on MCP server | Preferred when configured. |
| Records API | `RECORDS_API_URL` | No | Yes when backend supports it | Yes when backend supports it | High for PHI | Requires explicit consent for patient data. |
| Records CLI | `records` in `PATH` | Yes | Only if full engine/profile context is configured | Only if configured | Low | Local structural mode must be labeled honestly. |
| Local Records checkout | `cli/package.json` | Yes | Depends on checkout/runtime | Depends on checkout/runtime | Low | Used only in Records main repo, not this plugin repo. |
| SUSHI | `sushi` in `PATH` or package script | Yes | Builds profiles/artifacts | No | Low unless installing packages | Source of truth is usually `input/fsh`. |
| IG Publisher / Java validator | `ig.ini`, Java, validator jar/scripts | Yes | Yes | Often, when tx/package setup is available | Medium if tx server/package download | Use for full IG validation when configured. |
| Firely Terminal | `fhir` in `PATH` | Yes | Yes with project scope/packages | Can be | Medium if external terminology/packages | Good cross-check when already installed. |
| HAPI validator | `hapi-fhir-cli` or project scripts | Yes | Yes with packages | Can be | Medium if external terminology/packages | Good cross-check when already installed. |
| Structural fallback | none | Yes | No | No | Low | JSON shape only; not conformance validation. |

## Rules

- Ask before installing tools, fetching FHIR URLs, using hosted APIs, or contacting terminology servers.
- Do not edit `fsh-generated/resources` when `input/fsh` exists unless the user explicitly asks for a generated-artifact patch.
- Do not claim profile, terminology, invariant, or reference validation unless the selected runtime actually loaded that context.
- Prefer redacted summaries for Patient-like resources and Bundles.
