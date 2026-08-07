#!/usr/bin/env node
import { access, cp, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runJsonProcess, runProcess } from "../skills/fhir-validation/scripts/lib/process-runner.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const plugin = path.resolve(scriptDir, "..");
const repo = path.resolve(plugin, "../..");
const failures = [];
const expectedSkills = ["fhir-ci-quality", "fhir-project-doctor", "fhir-validation"];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function containsName(value, name) {
  return JSON.stringify(value).toLowerCase().includes(name.toLowerCase());
}

const stageRoot = await mkdtemp(path.join(os.tmpdir(), "records-codex-e2e-"));
const stagedPlugin = path.join(stageRoot, "records");

try {
  await cp(plugin, stagedPlugin, { recursive: true, dereference: false });

  const discoveredSkills = (await readdir(path.join(stagedPlugin, "skills"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(discoveredSkills) !== JSON.stringify(expectedSkills)) {
    failures.push(`Expected Codex skills ${expectedSkills.join(", ")}, found ${discoveredSkills.join(", ")}.`);
  }

  for (const skill of expectedSkills) {
    const root = path.join(stagedPlugin, "skills", skill);
    for (const relative of ["SKILL.md", "agents/openai.yaml", "assets/records-app-icon.svg"]) {
      if (!(await exists(path.join(root, relative)))) failures.push(`Installed skill is missing ${skill}/${relative}.`);
    }
    const metadata = await readFile(path.join(root, "agents/openai.yaml"), "utf8");
    if (!metadata.includes(`$${skill}`)) failures.push(`${skill} default prompt must explicitly name $${skill}.`);
  }

  for (const reference of [
    "skills/fhir-validation/references/ig-workflows.md",
    "skills/fhir-validation/references/structural-validation.md",
  ]) {
    const text = await readFile(path.join(stagedPlugin, reference), "utf8");
    if (text.includes("CLAUDE_PLUGIN_ROOT")) failures.push(`Codex-loaded reference remains Claude-specific: ${reference}.`);
  }

  const fixtureRun = runJsonProcess(process.execPath, [
    path.join(stagedPlugin, "skills/fhir-validation/scripts/validate-structural.mjs"),
    path.join(stagedPlugin, "fixtures/invalid-observation.json"),
  ]);
  if (fixtureRun.status !== 1 || fixtureRun.parsed?.tool !== "validate-structural" || fixtureRun.parsed?.schemaVersion !== 2) {
    failures.push("Staged Codex plugin could not execute the validation fixture with the v2 result contract.");
  }

  if (process.env.RECORDS_CODEX_E2E_LIVE === "1") {
    const addMarketplace = runJsonProcess("codex", ["plugin", "marketplace", "add", repo, "--json"], { timeout: 60_000 });
    if (addMarketplace.status !== 0) {
      failures.push(`Codex marketplace install failed: ${addMarketplace.stderr || addMarketplace.stdout}`);
    }

    const available = runJsonProcess("codex", ["plugin", "list", "--available", "--json"], { timeout: 30_000 });
    if (available.status !== 0 || !containsName(available.parsed, "records")) {
      failures.push(`Codex did not discover records in the installed marketplace: ${available.stderr || available.stdout}`);
    }

    const install = runJsonProcess("codex", ["plugin", "add", "records@medvertical", "--json"], { timeout: 60_000 });
    if (install.status !== 0) failures.push(`Codex plugin install failed: ${install.stderr || install.stdout}`);

    const installed = runJsonProcess("codex", ["plugin", "list", "--json"], { timeout: 30_000 });
    if (installed.status !== 0 || !containsName(installed.parsed, "records")) {
      failures.push(`Codex did not list records after installation: ${installed.stderr || installed.stdout}`);
    }
  } else {
    const codexVersion = runProcess("codex", ["--version"], { timeout: 10_000 });
    if (codexVersion.status !== 0) {
      failures.push("Codex CLI is unavailable; install pinned dev dependencies before running the E2E check.");
    }
  }
} finally {
  await rm(stageRoot, { recursive: true, force: true });
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(process.env.RECORDS_CODEX_E2E_LIVE === "1"
  ? "Codex marketplace install, discovery, and staged invocation passed."
  : "Codex staged install and invocation passed; live marketplace install is CI-only.");
