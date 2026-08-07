#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProcess } from "../skills/fhir-validation/scripts/lib/process-runner.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(scriptDir, "../../..");
const plugin = path.join(repo, "plugins/records");
const failures = [];

async function json(file) {
  return JSON.parse(await readFile(path.join(repo, file), "utf8"));
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

const [
  claudeManifest,
  claudeMarketplace,
  codexManifest,
  codexMarketplace,
  pkg,
] = await Promise.all([
  json("plugins/records/.claude-plugin/plugin.json"),
  json(".claude-plugin/marketplace.json"),
  json("plugins/records/.codex-plugin/plugin.json"),
  json(".agents/plugins/marketplace.json"),
  json("package.json"),
]);

const versions = {
  package: pkg.version,
  claudePlugin: claudeManifest.version,
  claudeMarketplace: claudeMarketplace.plugins?.[0]?.version,
  codexPlugin: codexManifest.version,
};
if (new Set(Object.values(versions)).size !== 1) {
  failures.push(`Version mismatch: ${JSON.stringify(versions)}`);
}

const version = pkg.version;
if (!(await exists(path.join(plugin, `eval-results/v${version}.md`)))) {
  failures.push(`Missing eval result file for v${version}.`);
}

const readme = await readFile(path.join(repo, "README.md"), "utf8");
if (!readme.includes(`version-${version}-blue`)) {
  failures.push(`README version badge does not match v${version}.`);
}
if (!readme.includes("medvertical/records-agent-tools")) {
  failures.push("README must use the records-agent-tools repository name.");
}

if (codexMarketplace.plugins?.[0]?.source?.path !== "./plugins/records") {
  failures.push("Codex marketplace source must remain ./plugins/records.");
}
for (const screenshot of codexManifest.interface?.screenshots || []) {
  if (!screenshot.startsWith("./assets/") || !screenshot.endsWith(".png")) {
    failures.push(`Invalid Codex screenshot path: ${screenshot}`);
  } else if (!(await exists(path.join(plugin, screenshot)))) {
    failures.push(`Missing Codex screenshot: ${screenshot}`);
  }
}

for (const dependency of ["@anthropic-ai/claude-code", "@openai/codex"]) {
  const versionValue = pkg.devDependencies?.[dependency];
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(versionValue || "")) {
    failures.push(`${dependency} must be pinned to an exact version.`);
  }
}

const whitespace = runProcess("git", ["diff", "--check"], { cwd: repo, timeout: 10_000 });
if (whitespace.status !== 0) failures.push(whitespace.stderr || whitespace.stdout || "git diff --check failed.");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Release metadata passed for records@medvertical v${version}.`);
