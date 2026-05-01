#!/usr/bin/env node
import { mkdtemp, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const repo = path.resolve(new URL("../../..", import.meta.url).pathname);
const failures = [];
const npxCache = await mkdtemp(path.join(os.tmpdir(), "claude-records-npx-"));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: "utf8",
    shell: false,
    ...options,
  });
  if (result.status !== 0) {
    failures.push(`${command} ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`);
  }
  return result;
}

async function json(file) {
  return JSON.parse(await readFile(path.join(repo, file), "utf8"));
}

const manifest = await json("plugins/records/.claude-plugin/plugin.json");
const marketplace = await json(".claude-plugin/marketplace.json");
const pkg = await json("package.json");
if (manifest.version !== marketplace.plugins?.[0]?.version || manifest.version !== pkg.version) {
  failures.push("Version mismatch between plugin manifest, marketplace, and package.json.");
}

try {
  await readFile(path.join(repo, `plugins/records/eval-results/v${manifest.version}.md`), "utf8");
} catch {
  failures.push(`Missing eval result file for v${manifest.version}.`);
}

run("npm", ["test"]);
run("npx", ["--yes", "@anthropic-ai/claude-code", "plugin", "validate", "."], {
  env: { ...process.env, npm_config_cache: npxCache },
});
run("npx", ["--yes", "@anthropic-ai/claude-code", "plugin", "validate", "plugins/records"], {
  env: { ...process.env, npm_config_cache: npxCache },
});

const status = spawnSync("git", ["status", "--porcelain"], { cwd: repo, encoding: "utf8" });
const unexpected = status.stdout.split(/\r?\n/).filter(Boolean).filter((line) => {
  const file = line.slice(3);
  return file.startsWith("plugins/records/") || file.startsWith(".claude-plugin/") || file === "package.json";
});
if (unexpected.length) {
  failures.push(`Unexpected plugin release changes remain:\n${unexpected.join("\n")}`);
}

const claude = spawnSync("claude", ["--version"], { encoding: "utf8" });
if (claude.status === 0) {
  run("claude", ["plugin", "marketplace", "update", "medvertical"]);
  run("claude", ["plugin", "update", "records@medvertical"]);
} else {
  console.log("Claude CLI not found; skipping live plugin update check.");
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Release check passed for records@medvertical v${manifest.version}.`);
