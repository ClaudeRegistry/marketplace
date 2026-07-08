#!/usr/bin/env node
/*
 * Release Conductor - SessionStart hook (advisory, non-blocking, fail-safe).
 * Injects a one-line git status summary at session start and suggests /ship.
 * No-op (and silent) outside a git repository or if anything goes wrong.
 * Cross-platform: pure Node, no external dependencies.
 */
import { execSync } from 'node:child_process';

const sh = (cmd) => {
  try {
    return execSync(cmd, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      timeout: 3000,
    }).trim();
  } catch {
    return '';
  }
};

try {
  if (sh('git rev-parse --is-inside-work-tree') === 'true') {
    const branch = sh('git rev-parse --abbrev-ref HEAD') || 'a detached HEAD';
    const staged = sh('git diff --cached --name-only').split('\n').filter(Boolean).length;
    const unstaged = sh('git diff --name-only').split('\n').filter(Boolean).length;
    const lastTag = sh('git describe --tags --abbrev=0');
    const ahead = sh('git rev-list --count @{u}..HEAD');
    const behind = sh('git rev-list --count HEAD..@{u}');
    const sync = (ahead || behind) ? ` ${ahead || 0} ahead / ${behind || 0} behind upstream.` : '';

    const context =
      `Release Conductor: on branch "${branch}".${sync} ` +
      `${staged} staged, ${unstaged} unstaged file(s). ` +
      (lastTag ? `Last tag: ${lastTag}. ` : 'No tags yet. ') +
      `Run /ship to prepare a commit + PR with a semver recommendation, or /release-notes to draft a changelog.`;

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: context,
      },
    }));
  }
} catch {
  /* fail-safe: never break a session */
}

process.exit(0);
