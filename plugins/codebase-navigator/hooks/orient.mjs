#!/usr/bin/env node
/*
 * Codebase Navigator - SessionStart hook (advisory, non-blocking, fail-safe).
 * On session start inside a git repo, injects a one-line orientation and suggests the
 * navigator commands. No-op (and silent) outside a git repository or on any error.
 * Cross-platform: pure Node, no external dependencies.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

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

const has = (f) => { try { return existsSync(f); } catch { return false; } };

try {
  if (sh('git rev-parse --is-inside-work-tree') === 'true') {
    // Lightweight signals for what kind of repo this is.
    const stacks = [];
    if (has('package.json')) stacks.push('Node');
    if (has('pyproject.toml') || has('requirements.txt') || has('setup.py')) stacks.push('Python');
    if (has('go.mod')) stacks.push('Go');
    if (has('Cargo.toml')) stacks.push('Rust');
    if (has('pom.xml') || has('build.gradle') || has('build.gradle.kts')) stacks.push('JVM');
    if (has('Gemfile')) stacks.push('Ruby');
    const builders = [];
    if (has('Makefile') || has('makefile')) builders.push('Make');
    if (has('WORKSPACE') || has('WORKSPACE.bazel') || has('MODULE.bazel')) builders.push('Bazel');
    if (has('nx.json')) builders.push('Nx');
    if (has('turbo.json')) builders.push('Turborepo');
    if (has('docker-compose.yml') || has('docker-compose.yaml') || has('compose.yaml')) builders.push('Compose');

    const stackStr = stacks.length ? `Detected: ${stacks.join(', ')}${builders.length ? ` (build: ${builders.join(', ')})` : ''}. ` : '';

    const context =
      `Codebase Navigator: new session in a git repo. ${stackStr}` +
      `To get productive fast: /dev-env-bootstrap gets it running locally and writes a verified SETUP.md, ` +
      `/build-explain decodes the build system and its targets, ` +
      `/locate-change <task> finds exactly where a change goes, and /trace-flow <action> traces a request end-to-end.`;

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
