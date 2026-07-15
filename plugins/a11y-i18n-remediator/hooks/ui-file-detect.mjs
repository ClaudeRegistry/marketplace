#!/usr/bin/env node
/*
 * A11y & i18n Remediator - PostToolUse(Write|Edit) hook (advisory, non-blocking, fail-safe).
 * When an edited file is a UI component (.jsx/.tsx/.vue/.svelte/.html), injects a reminder
 * to run /a11y-audit on it. It NEVER blocks the edit or fails the session.
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

  // UI component files where accessibility issues live.
  const isUi = /\.(jsx|tsx|vue|svelte|html|htm|astro)$/.test(p);
  if (!isUi) return;

  // Skip test files and stories to avoid noise.
  if (/(\.test\.|\.spec\.|\.stories\.|__tests__\/|\.cy\.)/.test(p)) return;

  const context =
    `A11y & i18n Remediator: "${fp}" is a UI component. ` +
    `Automated linters catch only ~57% of WCAG issues and can't reason across elements. ` +
    `Run /a11y-audit on it to check color contrast, ARIA correctness, labels/alt text, keyboard focus order, and landmarks ` +
    `(or /i18n-extract if it contains hardcoded user-facing strings).`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: context,
    },
  }));
}
