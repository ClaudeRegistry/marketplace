# Security Policy

ClaudeRegistry's whole value is trust: every vendored plugin passes a
seven-check static verification ([methodology](https://clauderegistry.com/verification))
plus human review before it ships. If you find a way that trust can be broken,
we want to know about it.

## Scope

Reports are welcome for any of these:

- **A listed plugin behaving maliciously or unsafely** — hooks that phone home,
  agents with excessive tool scopes, credential harvesting, prompt-injection
  payloads in skills or READMEs, or any difference between what a plugin says
  it does and what it does.
- **The verification pipeline** — a plugin construction that passes
  `scripts/verify-plugins.mjs` or CI (`.github/workflows/verify.yml`,
  `verify-drift.yml`) while violating what the checks are supposed to
  guarantee.
- **This repository's scripts and workflows** — anything exploitable in the
  validation or badge-generation tooling.
- **clauderegistry.com and its MCP server** (`https://clauderegistry.com/mcp`) —
  XSS via rendered plugin READMEs, badge or verification-state spoofing, or
  MCP server issues.

## How to Report

**For vulnerabilities, do not open a public issue.**

Use GitHub's private vulnerability reporting:
[Report a vulnerability](https://github.com/ClaudeRegistry/marketplace/security/advisories/new).
This keeps the report private between you and the maintainers while it is
triaged and fixed.

For non-sensitive concerns about a listed plugin (broken metadata, misleading
description, stale verification badge), a public issue is fine — use the
"Report a listed plugin" issue template.

## What to Include

- Which plugin, file, or endpoint is affected
- Steps to reproduce, or the specific code path
- What an attacker gains
- For plugin reports: the plugin version or commit you inspected

## What to Expect

- Acknowledgment within a few days
- For confirmed plugin issues: the plugin's verified status is revoked
  immediately (its badge flips to not-verified) while it is investigated, and
  the plugin is delisted if the issue is confirmed malicious
- Credit in the advisory if you want it

## Supported Versions

The registry is a rolling catalog — only the current state of `main` (and the
pinned commits recorded in `.claude-plugin/external-pins.json`) is supported.
