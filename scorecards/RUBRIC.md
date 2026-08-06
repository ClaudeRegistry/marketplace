# MCP Server Scorecard Rubric v1.0

ClaudeRegistry grades public Model Context Protocol servers against the MCP
2026-07-28 specification and baseline security practice. This rubric is
versioned and published before any grading; every scorecard names the rubric
version and the exact commit it graded.

## Method

- **Static analysis only.** We read the server's public source at a pinned
  commit. We never probe live endpoints without the operator's permission, and
  nothing from the graded repository is ever executed.
- **Evidence-cited.** Every axis result names the file and behavior it rests
  on. "We could not determine X statically" is reported as such, never guessed.
- **Right to respond.** Except for our own servers, a draft scorecard goes to
  the maintainers before publication, with a reasonable window to respond or
  fix. Exploitable findings follow responsible disclosure and are never
  published as unpatched vulnerabilities.
- **Re-grading.** Anyone can request a re-grade at a new commit by opening an
  issue on this repository.

## Axes

Each axis scores **pass**, **partial**, **fail**, or **n/a**, with evidence.

1. **Transport.** Streamable HTTP (or stdio for local-only servers). The
   removed HTTP+SSE dual-endpoint transport is a fail.
2. **Stateless core.** No per-session in-process state a second replica would
   not share; long-running work modeled as Tasks, not sticky sessions.
   Advisory caches over shared immutable data are acceptable.
3. **Lifecycle and protocol version.** Correct initialize handshake; the
   declared protocol version matches what is implemented; declared
   capabilities all have working handlers.
4. **Authorization.** Appropriate to data sensitivity: OAuth 2.1 / OIDC with
   audience-bound token validation for servers exposing private or
   write-capable surfaces; authless is acceptable only for read-only public
   data with abuse controls. Token passthrough to downstream APIs is an
   automatic fail.
5. **Tool design.** Complete input schemas with descriptions, honest
   annotations (readOnlyHint / destructiveHint), structured non-leaky errors,
   bounded outputs.
6. **Security hygiene.** Input validation on tool arguments; no shell/SQL/path
   injection from arguments; no secrets in the repository; request size,
   timeout, and rate controls proportionate to what the server can be made to
   do; CORS appropriate to the auth model.

## Grades

| Grade | Meaning |
|---|---|
| **A** | All axes pass. Notes may list minor hardening suggestions. |
| **B** | No fails; one or two partials. |
| **C** | One non-security fail, or three or more partials. |
| **D** | A security-axis fail that is not directly exploitable. |
| **F** | An exploitable finding (disclosed responsibly first; the public scorecard shows F only after a fix window). |

## Scope notes

- A scorecard describes **the graded commit**, nothing later. Drift is the
  operator's story to update via re-grade.
- Local stdio servers are not graded on Authorization (n/a) and their
  Transport axis accepts stdio.
- The registry's own servers are graded with this same rubric, published
  first, and get no courtesy window: findings against ourselves ship
  immediately.
