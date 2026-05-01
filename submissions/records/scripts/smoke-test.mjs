#!/usr/bin/env node
import { access, chmod, mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const repo = path.resolve(new URL("../../..", import.meta.url).pathname);
const plugin = path.join(repo, "plugins/records");
const errors = [];

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    errors.push(`${path.relative(repo, file)} is not valid JSON: ${error.message}`);
    return null;
  }
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(repo, file);
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const scalar = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (scalar) data[scalar[1]] = scalar[2].trim();
  }
  return data;
}

function runJson(script, args, env = process.env) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: repo,
    encoding: "utf8",
    env,
  });
  if (result.status !== 0) {
    errors.push(`${rel(script)} failed: ${result.stderr || result.stdout}`);
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    errors.push(`${rel(script)} did not output JSON: ${error.message}`);
    return null;
  }
}

const marketplace = await readJson(path.join(repo, ".claude-plugin/marketplace.json"));
const manifest = await readJson(path.join(plugin, ".claude-plugin/plugin.json"));
const packageJson = await readJson(path.join(repo, "package.json"));
if (marketplace?.name !== "medvertical") errors.push("Marketplace name must remain medvertical.");
if (manifest?.name !== "records") errors.push("Plugin name must remain records.");
if (marketplace?.plugins?.[0]?.name !== "records") errors.push("Marketplace plugin entry must remain records.");
if (marketplace?.plugins?.[0]?.version !== manifest?.version) errors.push("Marketplace and plugin versions differ.");
if (packageJson?.version !== manifest?.version) errors.push("Root package version must match plugin version.");

const required = [
  "README.md",
  "plugins/records/README.md",
  "plugins/records/skills/fhir-validation/SKILL.md",
  "plugins/records/skills/fhir-validation/references/ig-workflows.md",
  "plugins/records/skills/fhir-validation/references/repair-policy.md",
  "plugins/records/skills/fhir-validation/references/operationoutcome-map.md",
  "plugins/records/skills/fhir-validation/references/quality-rules.md",
  "plugins/records/skills/fhir-validation/references/ci-templates.md",
  "plugins/records/skills/fhir-validation/scripts/detect-fhir-project.mjs",
  "plugins/records/skills/fhir-validation/scripts/map-generated-to-fsh.mjs",
  "plugins/records/skills/fhir-validation/scripts/redact-fhir-summary.mjs",
  "plugins/records/skills/fhir-validation/scripts/explain-operationoutcome.mjs",
  "plugins/records/skills/fhir-validation/scripts/derive-quality-rules.mjs",
  "plugins/records/skills/fhir-validation/scripts/generate-ci.mjs",
  "plugins/records/skills/fhir-validation/scripts/map-fhir-expression.mjs",
  "plugins/records/commands/doctor.md",
  "plugins/records/commands/init-ci.md",
  "plugins/records/commands/explain-outcome.md",
  "plugins/records/commands/derive-quality-rules.md",
  "plugins/records/agents/fhir-validation-reviewer.md",
  "plugins/records/fixtures/invalid-observation.json",
  "plugins/records/fixtures/operationoutcome-required.json",
  "plugins/records/fixtures/mini-ig/input/fsh/profiles.fsh",
  "plugins/records/fixtures/mini-ig/sushi-config.yaml",
];
for (const file of required) {
  if (!(await exists(path.join(repo, file)))) errors.push(`Missing required file: ${file}`);
}

const markdownFiles = (await walk(plugin)).filter((file) => file.endsWith(".md"));
for (const file of markdownFiles) {
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const clean = target.split("#")[0];
    if (!clean) continue;
    const resolved = path.resolve(path.dirname(file), clean);
    if (!(await exists(resolved))) errors.push(`Broken markdown link in ${rel(file)}: ${target}`);
  }
}

for (const file of [
  ...await walk(path.join(plugin, "commands")),
  ...await walk(path.join(plugin, "agents")),
  path.join(plugin, "skills/fhir-validation/SKILL.md"),
]) {
  if (!file.endsWith(".md")) continue;
  const text = await readFile(file, "utf8");
  const frontmatter = parseFrontmatter(text);
  if (!frontmatter) errors.push(`Missing frontmatter: ${rel(file)}`);
  if (file.includes("/commands/") && !frontmatter?.description) errors.push(`Command missing description: ${rel(file)}`);
  if (file.includes("/agents/")) {
    const allowed = new Set(["name", "description", "model", "effort", "maxTurns", "disallowedTools", "tools", "skills"]);
    for (const key of Object.keys(frontmatter || {})) {
      if (!allowed.has(key)) errors.push(`Unexpected agent frontmatter key ${key}: ${rel(file)}`);
    }
    if (!frontmatter?.name || !frontmatter?.description) errors.push(`Agent missing name or description: ${rel(file)}`);
  }
  if (file.endsWith("SKILL.md") && (!frontmatter?.name || !frontmatter?.description || !frontmatter?.version)) {
    errors.push(`Skill missing required frontmatter: ${rel(file)}`);
  }
}

for (const jsonFile of (await walk(path.join(plugin, "fixtures"))).filter((file) => file.endsWith(".json"))) {
  await readJson(jsonFile);
}

const skillText = await readFile(path.join(plugin, "skills/fhir-validation/SKILL.md"), "utf8");
const skillLines = skillText.trim().split(/\r?\n/).length;
if (skillLines > 90) errors.push(`SKILL.md should stay concise; found ${skillLines} lines.`);

for (const script of [
  "plugins/records/skills/fhir-validation/scripts/detect-fhir-project.mjs",
  "plugins/records/skills/fhir-validation/scripts/map-generated-to-fsh.mjs",
  "plugins/records/skills/fhir-validation/scripts/redact-fhir-summary.mjs",
  "plugins/records/skills/fhir-validation/scripts/explain-operationoutcome.mjs",
  "plugins/records/skills/fhir-validation/scripts/derive-quality-rules.mjs",
  "plugins/records/skills/fhir-validation/scripts/generate-ci.mjs",
  "plugins/records/skills/fhir-validation/scripts/map-fhir-expression.mjs",
]) {
  const scriptStat = await stat(path.join(repo, script));
  if (!scriptStat.isFile()) errors.push(`Script is not a file: ${script}`);
}

const detector = path.join(plugin, "skills/fhir-validation/scripts/detect-fhir-project.mjs");
const miniIg = path.join(plugin, "fixtures/mini-ig");
const detection = runJson(detector, [miniIg]);
if (detection) {
  if (detection.schemaVersion !== 1) errors.push("Detector schemaVersion must be 1.");
  if (detection.projectType !== "fsh-ig") errors.push("mini-ig should detect as fsh-ig.");
  if (!detection.sourceDirs.includes("input/fsh")) errors.push("Detector missed input/fsh.");
  if (!detection.generatedDirs.includes("fsh-generated/resources")) errors.push("Detector missed fsh-generated/resources.");
  if (!detection.workflowFiles.includes("sushi-config.yaml")) errors.push("Detector missed sushi-config.yaml.");
  if (!detection.fhirVersions.includes("4.0.1")) errors.push("Detector missed FHIR version 4.0.1.");
  if (detection.resourceInventory.byResourceType.Observation !== 2) errors.push("Detector should count two Observation fixtures.");
}

const noPathDetection = runJson(detector, [miniIg], { ...process.env, PATH: "" });
if (noPathDetection) {
  for (const key of ["recordsCli", "sushi", "java", "firelyTerminal", "hapi"]) {
    if (noPathDetection.availableRuntimes[key].available) errors.push(`${key} should be unavailable with empty PATH.`);
  }
}

const fakeBin = await mkdtemp(path.join(os.tmpdir(), "records-plugin-tools-"));
for (const [name, version] of Object.entries({
  records: "records 9.9.9",
  sushi: "SUSHI v9.9.9",
  fhir: "Firely Terminal 9.9.9",
  "hapi-fhir-cli": "HAPI FHIR CLI 9.9.9",
})) {
  const file = path.join(fakeBin, name);
  await writeFile(file, `#!/bin/sh\necho "${version}"\n`, "utf8");
  await chmod(file, 0o755);
}
const mockedDetection = runJson(detector, [miniIg], { ...process.env, PATH: `${fakeBin}${path.delimiter}${process.env.PATH || ""}` });
if (mockedDetection) {
  if (!mockedDetection.availableRuntimes.recordsCli.available) errors.push("Mock records CLI should be available.");
  if (!mockedDetection.availableRuntimes.sushi.available) errors.push("Mock SUSHI should be available.");
  if (!mockedDetection.availableRuntimes.firelyTerminal.available) errors.push("Mock Firely Terminal should be available.");
  if (!mockedDetection.availableRuntimes.hapi.available) errors.push("Mock HAPI should be available.");
  if (!mockedDetection.availableRuntimes.recordsCli.version.includes("9.9.9")) errors.push("Mock records version not captured.");
}

const mapper = path.join(plugin, "skills/fhir-validation/scripts/map-generated-to-fsh.mjs");
const mapping = runJson(mapper, [
  path.join(miniIg, "fsh-generated/resources/Observation-MiniObservationMissingCode.json"),
  miniIg,
]);
if (mapping) {
  if (!mapping.candidates.some((candidate) => candidate.file === "input/fsh/profiles.fsh")) {
    errors.push("FSH mapper should find input/fsh/profiles.fsh.");
  }
}

const explainer = path.join(plugin, "skills/fhir-validation/scripts/explain-operationoutcome.mjs");
const explanation = runJson(explainer, [path.join(plugin, "fixtures/operationoutcome-required.json")]);
if (explanation) {
  if (explanation.issueCount !== 2) errors.push("OperationOutcome explainer should report two issues.");
  if (!explanation.issues.some((issue) => issue.code === "required")) errors.push("OperationOutcome explainer missed required issue.");
}

const expressionMapper = path.join(plugin, "skills/fhir-validation/scripts/map-fhir-expression.mjs");
const pointer = runJson(expressionMapper, ["Observation.category[0].coding[0].code"]);
if (pointer?.jsonPointer !== "/category/0/coding/0/code") errors.push("FHIR expression mapper returned unexpected pointer.");

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("Smoke test passed.");
