#!/usr/bin/env node
/*
 * Drift watchdog for externally-hosted verified plugins.
 *
 * For every plugin in verified.json with hosting "external" and status
 * "verified", compares the repo's current HEAD (git ls-remote) against the
 * pinned, verified commit. If the repo has moved past the pin, flips the
 * status to "stale" (the pinned commit remains verified; what users would
 * install now is not) and records the new HEAD. Never flips stale back to
 * verified: that requires a real re-verification run against a new pin.
 *
 * Run daily by .github/workflows/verify-drift.yml, which commits the change.
 * Exit 0 always; the file diff is the signal.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verifiedPath = path.join(ROOT, '.claude-plugin', 'verified.json');

const data = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));
let changed = 0;

for (const [name, info] of Object.entries(data.plugins)) {
  if (info.hosting !== 'external' || info.status !== 'verified') continue;
  if (!/^[\w.-]+\/[\w.-]+$/.test(info.repo ?? '')) continue;
  let head = null;
  try {
    head = execSync(`git ls-remote https://github.com/${info.repo}.git HEAD`, {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      timeout: 60000,
    })
      .trim()
      .split(/\s+/)[0];
  } catch {
    console.log(`SKIP   ${name}: could not reach ${info.repo} (leaving status as-is)`);
    continue;
  }
  if (head && head !== info.commit) {
    info.status = 'stale';
    info.headCommit = head;
    changed++;
    console.log(`STALE  ${name}: verified @${info.commit.slice(0, 7)} but ${info.repo} HEAD is now ${head.slice(0, 7)}`);
  } else {
    console.log(`OK     ${name}: ${info.repo} HEAD still at verified commit ${info.commit.slice(0, 7)}`);
  }
}

if (changed > 0) {
  fs.writeFileSync(verifiedPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`\n${changed} plugin(s) marked stale; verified.json updated.`);
} else {
  console.log('\nNo drift detected.');
}
