#!/usr/bin/env node
/*
 * CI & Incident Medic - PostToolUse(Bash) hook (advisory, non-blocking, fail-safe).
 * When a CI/build/test/deploy command appears to have failed, injects a short
 * suggestion to run /gha-triage. It NEVER blocks the command or fails the session.
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

  const cmd = (data && data.tool_input && data.tool_input.command) || '';
  if (!cmd) return;

  const out = typeof data.tool_output === 'string'
    ? data.tool_output
    : JSON.stringify((data && data.tool_output) || '');

  // Gate 1: the command must look like a CI / build / test / deploy command.
  const isCiCmd = /(npm|pnpm|yarn|bun)\s+(run\s+)?(test|build|lint|ci\b)|jest|vitest|mocha|playwright|cypress|pytest|\btox\b|\bnox\b|go\s+test|cargo\s+(test|build)|\bmvn\b|gradle|dotnet\s+(test|build)|rspec|phpunit|docker\s+build|docker\s+compose|kubectl\s+apply|helm\s+(install|upgrade|template)|terraform\s+(plan|apply)|gh\s+run|\bact\b|make\b/i.test(cmd);
  if (!isCiCmd) return;

  // Gate 2: the output must show a concrete failure signal (avoids "0 errors" false positives).
  const failed = /Process completed with exit code [1-9]|exit(ed)?\s+(with\s+)?(code\s+)?[1-9]|npm ERR!|Traceback \(most recent call last\)|AssertionError|\b[1-9]\d*\s+(failed|failing|errors?)\b|panic:|BUILD FAILED|(^|\s)error:\s|\bnot ok\s|✗|✘|❌/i.test(out);
  if (!failed) return;

  const short = cmd.length > 120 ? cmd.slice(0, 117) + '...' : cmd;
  const context =
    `CI & Incident Medic: the command \`${short}\` appears to have failed. ` +
    `Run /gha-triage to classify the failure against a taxonomy of CI failure modes and get the exact fix, ` +
    `or dispatch the ci-failure-triager agent.`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: context,
    },
  }));
}
