#!/usr/bin/env node
/*
 * MCP Server Smith - PostToolUse(Write|Edit) hook (advisory, non-blocking, fail-safe).
 * When an edited file looks like MCP server code (imports the MCP SDK, constructs a
 * server/transport, or is the removed HTTP+SSE transport), injects a reminder to run
 * /mcp-audit (and /mcp-migrate if it spots the old transport). It NEVER blocks the edit.
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

  const ti = (data && data.tool_input) || {};
  const fp = ti.file_path || '';
  if (!fp) return;

  const p = fp.replace(/\\/g, '/').toLowerCase();

  // Skip tests and lockfiles to avoid noise.
  if (/(\.test\.|\.spec\.|__tests__\/|_test\.py$|package-lock\.json$|\.lock$)/.test(p)) return;
  if (!/\.(js|mjs|cjs|ts|mts|cts|py|go)$/.test(p)) return;

  // Look at the content the tool just wrote/edited.
  const text = String(
    ti.content || ti.new_string || ti.new_str || ti.replacement || ''
  );
  if (!text) return;

  const isMcp =
    /@modelcontextprotocol\/sdk/.test(text) ||
    /\bMcpServer\b|\bStreamableHTTPServerTransport\b|\bStdioServerTransport\b/.test(text) ||
    /\bfrom\s+['"]mcp[.'"]|\bimport\s+mcp\b|\bFastMCP\b|\bstreamable_http_app\b/.test(text) ||
    /modelcontextprotocol\/go-sdk|mark3labs\/mcp-go/.test(text);

  if (!isMcp) return;

  // Flag the removed HTTP+SSE transport specifically -> suggest migration.
  const looksSSE =
    /\bSSEServerTransport\b/.test(text) ||
    (/\/sse\b/.test(text) && /\/messages\b/.test(text));

  const base =
    `MCP Server Smith: "${fp}" looks like MCP server code. ` +
    `Run /mcp-audit to check it against the MCP 2026-07-28 spec (stateless Streamable HTTP core, ` +
    `lifecycle/capabilities, OAuth 2.1/OIDC token validation) and for tool-design and security issues.`;

  const migrate = looksSSE
    ? ` This file appears to use the removed HTTP+SSE transport (GET /sse + POST /messages) or SSEServerTransport; ` +
      `run /mcp-migrate to move it to the stateless Streamable HTTP transport.`
    : '';

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: base + migrate,
    },
  }));
}
