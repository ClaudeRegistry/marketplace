#!/usr/bin/env node
/*
 * API Contract Keeper - PostToolUse(Write|Edit) hook (advisory, non-blocking, fail-safe).
 * When an edited file looks like an API handler/route/controller, injects a reminder
 * to run /spec-sync to check for spec-vs-code drift. It NEVER blocks the edit.
 * Cross-platform: pure Node, no external dependencies.
 */
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('error', () => process.exit(0));
process.stdin.on('end', () => {
  try { run(raw); } catch { /* fail-safe */ }
  process.exit(0);
});

function run(input) {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return; }

  const fp = (data && data.tool_input && data.tool_input.file_path) || '';
  if (!fp) return;

  const p = fp.replace(/\\/g, '/').toLowerCase();

  // Skip tests to avoid noise.
  if (/(\.test\.|\.spec\.|__tests__\/|_test\.py$|_test\.go$)/.test(p)) return;

  const byDir = /(^|\/)(routes?|controllers?|handlers?|endpoints?|api|resolvers?|views)\//.test(p);
  const byName =
    /\.(controller|routes?|handler|resource|resolver)\.(js|ts|mjs|cjs)$/.test(p) ||
    /(^|\/)urls\.py$/.test(p) ||               // Django
    /_views\.py$/.test(p) || /\/views\.py$/.test(p) ||
    /(^|\/)serializers\.py$/.test(p) ||
    /Controller\.(java|kt|cs)$/.test(fp);      // Spring / .NET (case-sensitive)

  if (!byDir && !byName) return;

  const context =
    `API Contract Keeper: "${fp}" looks like an API handler/route. ` +
    `Run /spec-sync to detect drift between your OpenAPI/GraphQL spec and this code (paths, methods, params, request/response schemas, status codes), ` +
    `or /harden-endpoint to add request validation, an RFC 9457 problem+json error envelope, and idempotency-key handling.`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: context,
    },
  }));
}
