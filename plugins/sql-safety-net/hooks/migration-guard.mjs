#!/usr/bin/env node
/*
 * SQL Safety Net - PostToolUse(Write|Edit) hook (advisory, non-blocking, fail-safe).
 * When an edited file looks like a database migration, injects a reminder to run
 * /migration-safety before deploying. It NEVER blocks the edit or fails the session.
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

  const isMigration =
    /(^|\/)(migrations?|migrate)\//.test(p) ||     // */migrations/*, */migrate/*
    /(^|\/)db\/migrate\//.test(p) ||               // Rails
    /(^|\/)alembic\/versions\//.test(p) ||         // Alembic
    /(^|\/)prisma\/migrations\//.test(p) ||        // Prisma
    /(^|\/)v\d+(_|__)[^/]*\.sql$/.test(p) ||       // Flyway V1__x.sql
    /\.(up|down)\.sql$/.test(p);                   // golang-migrate

  // Generic .sql files whose name hints at DDL/migration work.
  const schemaSql = /\.sql$/.test(p) && /(migrat|schema|ddl|alter|create_table)/.test(p);

  if (!isMigration && !schemaSql) return;

  const context =
    `SQL Safety Net: "${fp}" looks like a database migration. ` +
    `Before deploying, run /migration-safety to check for table-locking or blocking operations ` +
    `(e.g. ADD COLUMN NOT NULL DEFAULT, a non-CONCURRENT index, ALTER TYPE) and get a safe expand-contract rewrite with a paired rollback.`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: context,
    },
  }));
}
