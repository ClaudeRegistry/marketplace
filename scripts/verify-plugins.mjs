#!/usr/bin/env node
/*
 * ClaudeRegistry plugin verification.
 *
 * Runs the public verification methodology (https://clauderegistry.com/verification)
 * against every plugin in marketplace.json and writes the machine-readable result
 * to .claude-plugin/verified.json. That file is the source of truth for the
 * "Verified by ClaudeRegistry" badges served at clauderegistry.com/badge/<id>.svg.
 *
 * Pure Node, no dependencies. Static analysis only: nothing is executed.
 *
 * Usage: node scripts/verify-plugins.mjs
 * Exit code 0 always (the report is the output); CI can gate on the JSON.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const METHODOLOGY_VERSION = '1.0';

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

/** Parse the YAML-ish frontmatter block of a .md file into a flat map (regex, v1). */
function frontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv) out[kv[1].toLowerCase()] = kv[2].trim();
  }
  return out;
}

/** Collect all files under dir (relative paths), or [] if missing. */
function walk(dir, base = dir) {
  if (!exists(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else out.push(path.relative(base, p).replace(/\\/g, '/'));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Checks. Each returns { status: 'pass'|'fail'|'n/a', detail }.
// ---------------------------------------------------------------------------

function checkManifestIntegrity(pluginDir, entry) {
  const problems = [];
  const pj = path.join(pluginDir, '.claude-plugin', 'plugin.json');
  if (!exists(pj)) problems.push('missing .claude-plugin/plugin.json');
  else {
    try {
      const parsed = JSON.parse(read(pj));
      if (entry && parsed.name !== entry.name)
        problems.push(`plugin.json name "${parsed.name}" != marketplace entry "${entry.name}"`);
      if (!parsed.version) problems.push('plugin.json missing version');
      if (!parsed.license) problems.push('plugin.json missing license');
      if (!parsed.description) problems.push('plugin.json missing description');
    } catch {
      problems.push('plugin.json is not valid JSON');
    }
  }
  // Standalone mode (no marketplace entry yet): only plugin.json is checkable.
  if (!entry) {
    return problems.length
      ? { status: 'fail', detail: problems.join('; ') }
      : {
          status: 'pass',
          detail: 'plugin.json valid and complete (marketplace-entry cross-check runs at submission)',
        };
  }
  // Every path the marketplace entry advertises must exist on disk.
  for (const kind of ['commands', 'agents', 'skills']) {
    for (const rel of entry[kind] ?? []) {
      if (!exists(path.join(pluginDir, rel))) problems.push(`${kind} entry not on disk: ${rel}`);
    }
  }
  // Reverse: files on disk the manifest forgot (drift the other way).
  const listed = new Set(
    ['commands', 'agents', 'skills'].flatMap((k) => (entry[k] ?? []).map((r) => r.replace(/^\.\//, '')))
  );
  const onDisk = [
    ...walk(path.join(pluginDir, 'commands')).map((f) => `commands/${f}`),
    ...walk(path.join(pluginDir, 'agents')).map((f) => `agents/${f}`),
    ...walk(path.join(pluginDir, 'skills')).filter((f) => f.endsWith('SKILL.md')).map((f) => `skills/${f}`),
  ];
  for (const f of onDisk) {
    if (f.endsWith('.md') && !listed.has(f)) problems.push(`on disk but not in marketplace entry: ${f}`);
  }
  return problems.length
    ? { status: 'fail', detail: problems.join('; ') }
    : { status: 'pass', detail: 'plugin.json valid; marketplace entry matches disk in both directions' };
}

const HOOK_FORBIDDEN = [
  [/\bfetch\s*\(|\bXMLHttpRequest\b|\bhttps?\.request\b|\bnet\.connect\b|\bWebSocket\b/, 'network call'],
  [/\bwriteFileSync?\s*\(|\bappendFileSync?\s*\(|\bcreateWriteStream\b|\bunlinkSync?\s*\(|\brmSync\s*\(/, 'filesystem write'],
  [/\.env\b|\bid_rsa\b|\.aws\b|credentials/i, 'credential/env access'],
  [/\beval\s*\(|\bFunction\s*\(/, 'dynamic code evaluation'],
];

// Subprocess use in a hook is acceptable ONLY for constant, read-only git
// introspection (the common "gather git context" pattern). Anything dynamic,
// non-git, or write-capable fails.
const SUBPROCESS_ALLOWLIST = [
  'git rev-parse', 'git diff', 'git describe', 'git rev-list', 'git status',
  'git log', 'git branch', 'git ls-files', 'git tag', 'git show', 'git config --get',
];

function analyzeSubprocess(src, rel) {
  const problems = [];
  if (!/\bchild_process\b|\bexecSync?\s*\(|\bspawnSync?\s*\(|\bexecFile\b/.test(src)) {
    return { uses: false, problems };
  }
  // Any command assembled from a template literal with interpolation is dynamic.
  if (/(?:sh|exec\w*|spawn\w*)\s*\(\s*`[^`]*\$\{/.test(src)) {
    problems.push(`${rel}: subprocess command built dynamically from interpolated input`);
  }
  const literals = [...src.matchAll(/\b(?:sh|execSync|execFileSync)\s*\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  for (const cmd of literals) {
    if (!SUBPROCESS_ALLOWLIST.some((a) => cmd.startsWith(a))) {
      problems.push(`${rel}: non-allowlisted subprocess command "${cmd}"`);
    }
  }
  if (literals.length === 0 && problems.length === 0) {
    problems.push(`${rel}: subprocess used but commands not statically resolvable`);
  }
  return { uses: true, problems };
}

function checkHookSafety(pluginDir) {
  const hj = path.join(pluginDir, 'hooks', 'hooks.json');
  if (!exists(hj)) return { status: 'n/a', detail: 'no hooks' };
  const problems = [];
  let config;
  try {
    config = JSON.parse(read(hj));
  } catch {
    return { status: 'fail', detail: 'hooks.json is not valid JSON' };
  }
  // Collect referenced scripts via ${CLAUDE_PLUGIN_ROOT}.
  const cmds = JSON.stringify(config).match(/\$\{CLAUDE_PLUGIN_ROOT\}[^"\\]*/g) ?? [];
  const scripts = cmds.map((c) => c.replace('${CLAUDE_PLUGIN_ROOT}', '').replace(/^[\\/]/, ''));
  if (scripts.length === 0) problems.push('hooks.json references no ${CLAUDE_PLUGIN_ROOT} script');
  for (const rel of scripts) {
    const sp = path.join(pluginDir, rel);
    if (!exists(sp)) {
      problems.push(`referenced script missing: ${rel}`);
      continue;
    }
    const src = read(sp);
    for (const [re, label] of HOOK_FORBIDDEN) {
      if (re.test(src)) problems.push(`${rel}: ${label}`);
    }
    problems.push(...analyzeSubprocess(src, rel).problems);
    if (!/process\.exit\(0\)/.test(src)) problems.push(`${rel}: no unconditional exit(0) fail-safe`);
    if (!/catch/.test(src)) problems.push(`${rel}: no try/catch fail-safe`);
  }
  return problems.length
    ? { status: 'fail', detail: problems.join('; ') }
    : {
        status: 'pass',
        detail: `${scripts.length} hook script(s): advisory-only, no network, no fs writes, no credential access, subprocess (if any) limited to constant read-only git commands, fail-safe exit(0)`,
      };
}

function checkAgentToolScope(pluginDir) {
  const files = walk(path.join(pluginDir, 'agents')).filter((f) => f.endsWith('.md'));
  if (files.length === 0) return { status: 'n/a', detail: 'no agents' };
  const problems = [];
  const scopes = [];
  for (const f of files) {
    const fm = frontmatter(read(path.join(pluginDir, 'agents', f)));
    if (!fm) {
      problems.push(`${f}: no frontmatter`);
      continue;
    }
    const tools = fm.tools ?? '';
    if (!tools) {
      problems.push(`${f}: no explicit tools restriction (inherits everything)`);
      continue;
    }
    scopes.push(`${f.replace('.md', '')}: ${tools.replace(/[[\]"]/g, '')}`);
    // Read-only-by-description agents must not carry write tools.
    const readOnlyByName = /audit|analyz|review|scan|report|read-only|checker/i.test(f + (fm.description ?? ''));
    const hasWrite = /"(Write|Edit)"/.test(tools);
    // Agents whose stated job is producing or changing files (hardener, writer,
    // reconciler, migrator...) legitimately carry Write/Edit; only pure
    // analysis agents are barred from them.
    const isRemediator = /reconcil|migrat|remediat|fix|harden|writer|writ(e|ing)|generat|author|apply/i.test(
      f + (fm.description ?? '')
    );
    if (readOnlyByName && hasWrite && !isRemediator) {
      problems.push(`${f}: analysis-type agent declares Write/Edit`);
    }
  }
  return problems.length
    ? { status: 'fail', detail: problems.join('; ') }
    : { status: 'pass', detail: `all ${files.length} agent(s) declare explicit least-privilege tools. ${scopes.join(' | ')}` };
}

function checkCommandHygiene(pluginDir) {
  const files = walk(path.join(pluginDir, 'commands')).filter((f) => f.endsWith('.md'));
  if (files.length === 0) return { status: 'n/a', detail: 'no commands' };
  const problems = [];
  for (const f of files) {
    const fm = frontmatter(read(path.join(pluginDir, 'commands', f)));
    if (!fm) problems.push(`${f}: no frontmatter`);
    else if (!fm.description) problems.push(`${f}: no description`);
  }
  return problems.length
    ? { status: 'fail', detail: problems.join('; ') }
    : { status: 'pass', detail: `all ${files.length} command(s) carry frontmatter with a description` };
}

function checkSkillStructure(pluginDir) {
  const skillsDir = path.join(pluginDir, 'skills');
  if (!exists(skillsDir)) return { status: 'n/a', detail: 'no skills' };
  const problems = [];
  let count = 0;
  for (const e of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    count++;
    const sk = path.join(skillsDir, e.name, 'SKILL.md');
    if (!exists(sk)) {
      problems.push(`${e.name}: missing SKILL.md`);
      continue;
    }
    const fm = frontmatter(read(sk));
    if (!fm?.name || !fm?.description) problems.push(`${e.name}: SKILL.md missing name/description frontmatter`);
    // Reference files mentioned in the skill must exist.
    const refs = read(sk).match(/references\/[A-Za-z0-9._-]+\.md/g) ?? [];
    for (const r of new Set(refs)) {
      if (!exists(path.join(skillsDir, e.name, r))) problems.push(`${e.name}: referenced ${r} missing`);
    }
  }
  return problems.length
    ? { status: 'fail', detail: problems.join('; ') }
    : { status: 'pass', detail: `all ${count} skill(s) have valid SKILL.md and every referenced reference file exists` };
}

// A "real" private key has a base64 body after the header; a bare header line
// in documentation (teaching detection patterns) is not a leak.
const SECRET_PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, 'AWS access key', 'all'],
  [/\bsk-[A-Za-z0-9]{20,}/, 'API secret key', 'all'],
  [/gh[pousr]_[A-Za-z0-9]{36,}/, 'GitHub token', 'all'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\r\n]+[A-Za-z0-9+/=\s]{40,}/, 'private key', 'all'],
  [/\bpassword\s*=\s*["'][^"']{6,}["']/i, 'hardcoded password', 'code'],
];

function checkNoSecrets(pluginDir) {
  const hits = [];
  for (const f of walk(pluginDir)) {
    if (!/\.(md|json|mjs|js|cjs|ts|py|sh|yaml|yml)$/.test(f)) continue;
    const isDoc = f.endsWith('.md');
    const src = read(path.join(pluginDir, f));
    for (const [re, label, scope] of SECRET_PATTERNS) {
      if (scope === 'code' && isDoc) continue; // docs may teach the anti-pattern
      // Only flag when the match is not in an obvious example context.
      const m = src.match(re);
      if (m && !/example|placeholder|redact|xxxx|your[-_]/i.test(src.slice(Math.max(0, m.index - 80), m.index + 80))) {
        hits.push(`${f}: ${label}`);
      }
    }
  }
  return hits.length
    ? { status: 'fail', detail: hits.join('; ') }
    : { status: 'pass', detail: 'no credentials or secrets in any plugin file' };
}

function checkDocs(pluginDir) {
  const rd = path.join(pluginDir, 'README.md');
  if (!exists(rd)) return { status: 'fail', detail: 'no README.md' };
  const src = read(rd);
  const problems = [];
  if (!/\/plugin install /.test(src)) problems.push('README has no install command');
  if (src.length < 500) problems.push('README too thin to document the plugin');
  return problems.length
    ? { status: 'fail', detail: problems.join('; ') }
    : { status: 'pass', detail: 'README documents purpose, installation, and usage' };
}

// ---------------------------------------------------------------------------

const CHECKS = [
  ['manifest-integrity', 'Manifest integrity', checkManifestIntegrity],
  ['hook-safety', 'Hook safety', checkHookSafety],
  ['agent-tool-scope', 'Agent tool scopes', checkAgentToolScope],
  ['command-hygiene', 'Command hygiene', checkCommandHygiene],
  ['skill-structure', 'Skill structure', checkSkillStructure],
  ['no-secrets', 'No secrets', checkNoSecrets],
  ['docs', 'Documentation', checkDocs],
];

function runChecks(pluginDir, entry) {
  const checks = [];
  let ok = true;
  for (const [id, title, fn] of CHECKS) {
    const r = exists(pluginDir) ? fn(pluginDir, entry) : { status: 'fail', detail: 'plugin dir missing' };
    checks.push({ id, title, ...r });
    if (r.status === 'fail') ok = false;
  }
  return { ok, checks };
}

const args = process.argv.slice(2);
const ciMode = args.includes('--ci');
const target = args.find((a) => !a.startsWith('--'));

// ---------------------------------------------------------------------------
// Standalone mode: verify ANY plugin directory (external authors, pre-submission).
//   node scripts/verify-plugins.mjs /path/to/your-plugin
// Same checks the registry runs; exit code 0 = verification-ready (CI-friendly).
// ---------------------------------------------------------------------------
if (target) {
  const pluginDir = path.resolve(target);
  console.log(`ClaudeRegistry verification (methodology v${METHODOLOGY_VERSION})`);
  console.log(`Plugin: ${pluginDir}\n`);
  const { ok, checks } = runChecks(pluginDir, null);
  for (const c of checks) {
    const tag = c.status === 'pass' ? 'PASS' : c.status === 'n/a' ? ' n/a' : 'FAIL';
    console.log(`${tag}  ${c.title}`);
    console.log(`      ${c.detail}`);
  }
  console.log(
    ok
      ? '\nVerification-ready. Submit via PR (see CONTRIBUTING.md) to get listed and earn the badge.'
      : '\nNot yet verification-ready. Fix the FAIL items above and re-run.'
  );
  process.exit(ok ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Registry mode: verify every marketplace.json plugin.
// Default: write verified.json.  --ci: write nothing; fail on any failure or
// on a committed verified.json that no longer matches reality (stale badge).
// ---------------------------------------------------------------------------
const marketplace = JSON.parse(read(path.join(ROOT, '.claude-plugin', 'marketplace.json')));
const result = {
  $comment: 'Generated by scripts/verify-plugins.mjs. Source of truth for clauderegistry.com/badge/<id>.svg. Do not edit by hand.',
  methodologyVersion: METHODOLOGY_VERSION,
  methodologyUrl: 'https://clauderegistry.com/verification',
  generated: new Date().toISOString(),
  plugins: {},
};

let failures = 0;
for (const entry of marketplace.plugins) {
  // Externally-hosted listings (object source: git URL / github repo) cannot be
  // verified: we do not control that code. They are "listed", never "verified".
  if (typeof entry.source !== 'string') {
    result.plugins[entry.name] = {
      status: 'listed',
      version: entry.version,
      date: result.generated.slice(0, 10),
      checks: [],
      note: 'Hosted externally; listed but not verified. Verification requires the plugin to be vendored into this repository.',
    };
    console.log(`LISTED    ${entry.name} (external source, not verified)`);
    continue;
  }
  const pluginDir = path.join(ROOT, entry.source.replace(/^\.\//, ''));
  const { ok, checks } = runChecks(pluginDir, entry);
  result.plugins[entry.name] = {
    status: ok ? 'verified' : 'failed',
    version: entry.version,
    date: result.generated.slice(0, 10),
    checks,
  };
  if (!ok) failures++;
  const badge = ok ? 'VERIFIED' : 'FAILED  ';
  console.log(`${badge}  ${entry.name}`);
  for (const c of checks.filter((c) => c.status === 'fail')) console.log(`          - ${c.title}: ${c.detail}`);
}

const verifiedPath = path.join(ROOT, '.claude-plugin', 'verified.json');

if (ciMode) {
  const stale = [];
  if (exists(verifiedPath)) {
    const committed = JSON.parse(read(verifiedPath));
    const shape = (p) => JSON.stringify([p.status, p.version, (p.checks ?? []).map((c) => [c.id, c.status])]);
    for (const [name, fresh] of Object.entries(result.plugins)) {
      const old = committed.plugins?.[name];
      if (!old || shape(old) !== shape(fresh)) stale.push(name);
    }
    for (const name of Object.keys(committed.plugins ?? {})) {
      if (!result.plugins[name]) stale.push(`${name} (removed)`);
    }
  } else {
    stale.push('(verified.json missing)');
  }
  if (failures > 0) console.error(`\nCI: ${failures} plugin(s) fail verification.`);
  if (stale.length > 0)
    console.error(
      `CI: committed verified.json is stale for: ${stale.join(', ')}. Run "node scripts/verify-plugins.mjs" and commit the result.`
    );
  if (failures > 0 || stale.length > 0) process.exit(1);
  console.log('\nCI: all plugins verified and verified.json is current.');
  process.exit(0);
}

fs.writeFileSync(verifiedPath, JSON.stringify(result, null, 2) + '\n');
console.log(`\n${marketplace.plugins.length - failures}/${marketplace.plugins.length} plugins verified. Wrote .claude-plugin/verified.json`);
