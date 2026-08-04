# MCP Server Smith

[![Verified by ClaudeRegistry](https://clauderegistry.com/badge/mcp-server-smith.svg)](https://clauderegistry.com/plugin/mcp-server-smith)

Scaffold, audit, and harden Model Context Protocol servers for the **MCP 2026-07-28** specification, statically, from the files you are already editing. It builds a spec-shaped server from scratch, scores an existing one against the stateless Streamable HTTP core, OAuth 2.1 / OIDC authorization, and versioned extensions, migrates servers off the removed HTTP+SSE transport, and runs a security review that catches the risks unique to agent-invoked servers: confused-deputy, token-passthrough, and prompt-injection.

## Purpose

The 2026-07-28 MCP spec is the largest revision since the protocol launched, and it broke assumptions a lot of servers were built on. The transport moved to **stateless Streamable HTTP** (HTTP+SSE was removed), so a server that keeps sessions in memory no longer scales behind a load balancer or runs on serverless/edge. Authorization aligned with **OAuth 2.1 / OIDC**, so "accept any valid JWT" is now a confused-deputy vulnerability rather than a shortcut. And long-running work and interactive UI moved into a **versioned extensions** framework (Tasks, MCP Apps) instead of ad-hoc core methods.

At the same time, an MCP server is a security surface an AI agent calls on the user's behalf: every tool argument is attacker-influenceable, and every byte a tool returns lands in the model's context. MCP Server Smith treats a server as both a protocol artifact and an attack surface. Everything is static and diff-aware: no server is started, no request is sent, no secret is read. Point it at a server directory, an entry file, or a git range, and every finding is grounded in real `file:line` evidence.

## Features

- Scaffolds a minimal, working, 2026-07-28-shaped server (TypeScript or Python) on the **stateless Streamable HTTP** transport, with a real example tool, a `server.json` registry stub, and honest auth wiring, never the removed HTTP+SSE transport or a silent authless template.
- Audits an existing server against the spec: stateless core, lifecycle, capability negotiation, versioned extensions, and transport, plus tool design and security, separating a **spec gap** (works today, not 2026-07-28-shaped) from a **security bug** (exploitable now).
- Migrates servers off HTTP+SSE to Streamable HTTP and reduces per-session state to stateless, preserving every tool, resource, and prompt.
- Validates authorization the way the spec means it: the server is an OAuth 2.1 **resource server** that checks the access token's **audience** against itself, publishes Protected Resource Metadata, and never passes the incoming token to a downstream API.
- Reviews tool design (few powerful tools, complete `inputSchema`, honest `readOnlyHint`/`destructiveHint`, safe structured errors, bounded output) and MCP-specific security (command/SQL/path/SSRF injection from arguments, prompt-injection containment, DoS caps, secret handling).
- Ships an advisory `PostToolUse` hook that notices when you are editing MCP server code and reminds you to `/mcp-audit` (and `/mcp-migrate` if it spots the old transport). Non-blocking and fail-safe.
- Fully static: no running server, no live traffic, no credentials read, and every finding cites `file:line`.

## Installation

```bash
/plugin marketplace add clauderegistry/marketplace
```

```bash
/plugin install mcp-server-smith@clauderegistry
```

## Commands

### /mcp-audit

```
/mcp-audit ./server
```

**What it does:**
- Detects the SDK, language, transport (stdio / Streamable HTTP / the removed HTTP+SSE), and declared `protocolVersion`.
- Scores the server against the 2026-07-28 axes (stateless core, lifecycle, capabilities, versioned extensions, transport) and, for remote servers, authorization.
- Runs a tool-design and security pass, then reports a compliance table, ranked security findings, and the recommended next commands, each with `file:line` evidence.

### /mcp-scaffold

```
/mcp-scaffold orders-server ts http
```

**What it does:**
- Generates a small, working server on the stateless Streamable HTTP transport (or stdio) with one real example tool, complete schema, and a `server.json` stub.
- For remote servers, wires (or clearly stubs) token validation, a Protected Resource Metadata route, and input caps, and states plainly whether the scaffold is authless-for-dev or auth-required.
- Emits the exact run + `claude mcp add` commands and the next steps.

### /mcp-migrate

```
/mcp-migrate ./server
```

**What it does:**
- Swaps the removed HTTP+SSE dual-endpoint for a single Streamable HTTP endpoint and notes the SDK version bump.
- Moves per-session in-process state out of process (or to the Tasks extension) so any replica can serve any request.
- Brings lifecycle, capabilities, and OAuth/OIDC authorization up to spec, removing any token passthrough, and reports the plan, applied diffs, manual follow-ups, and how to verify.

## Agents

- **spec-compliance-auditor** (read-only: `Read`, `Grep`, `Glob`, `Bash`) - profiles the server and produces the compliance table and ranked security findings. Never edits, never starts the server.
- **mcp-migrator** (`Read`, `Grep`, `Glob`, `Edit`) - applies the transport swap, statelessness reduction, and auth fixes with the smallest correct diffs, preserving the tool surface.

## Skills

- **mcp-2026-07-28** - the stateless core, Streamable HTTP transport, lifecycle, and versioned extensions (MCP Apps, Tasks).
- **mcp-authorization** - OAuth 2.1 / OIDC for MCP as a resource server: audience-bound token validation, Protected Resource Metadata, and avoiding token passthrough / confused deputy.
- **mcp-tool-design** - few powerful tools, complete input schemas, honest annotations, safe structured errors, bounded output; tools vs resources vs prompts.
- **mcp-server-security** - the MCP threat model and mitigations: injection from arguments, prompt-injection containment, DoS caps, secret handling, transport hardening.

## Hook

- **PostToolUse (Write|Edit)** - advisory, non-blocking, fail-safe. When you edit a file that imports the MCP SDK or constructs a server/transport, it reminds you to run `/mcp-audit`, and flags the removed HTTP+SSE transport with a nudge to `/mcp-migrate`.

## What it does not do

- It does not start your server, open a socket, send an MCP request, or read the values of secrets. It reasons from source.
- It does not invent SDK APIs; if a pinned SDK cannot speak 2026-07-28, the fix it reports is the version bump.
- It does not add OAuth to a local stdio server, which does not use it.

## License

MIT
