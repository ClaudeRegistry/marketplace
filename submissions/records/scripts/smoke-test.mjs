#!/usr/bin/env node
import { access, chmod, mkdir, mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const plugin = path.resolve(scriptDir, "..");
const marketplaceRepo = path.resolve(plugin, "../..");
const isCanonicalMarketplaceLayout = path.basename(plugin) === "records"
  && path.basename(path.dirname(plugin)) === "plugins"
  && existsSync(path.join(marketplaceRepo, ".claude-plugin/marketplace.json"));
const repo = isCanonicalMarketplaceLayout ? marketplaceRepo : plugin;
const errors = [];
const spawnMaxBuffer = 10 * 1024 * 1024;

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
    maxBuffer: spawnMaxBuffer,
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

const marketplacePath = path.join(repo, ".claude-plugin/marketplace.json");
const packagePath = path.join(repo, "package.json");
const marketplace = (await exists(marketplacePath)) ? await readJson(marketplacePath) : null;
const manifest = await readJson(path.join(plugin, ".claude-plugin/plugin.json"));
const packageJson = (await exists(packagePath)) ? await readJson(packagePath) : null;
const canonicalSkillFile = path.join(plugin, "skills/fhir-validation/SKILL.md");
const flatSkillFile = path.join(plugin, "skills/fhir-validation.md");
const skillFile = (await exists(canonicalSkillFile)) ? canonicalSkillFile : flatSkillFile;
if (marketplace && marketplace.name !== "medvertical") errors.push("Marketplace name must remain medvertical.");
if (manifest?.name !== "records") errors.push("Plugin name must remain records.");
if (marketplace && marketplace.plugins?.[0]?.name !== "records") errors.push("Marketplace plugin entry must remain records.");
if (marketplace && marketplace.plugins?.[0]?.version !== manifest?.version) errors.push("Marketplace and plugin versions differ.");
if (packageJson && packageJson.version !== manifest?.version) errors.push("Root package version must match plugin version.");

const requiredRepoFiles = marketplace ? ["README.md"] : [];
const requiredPluginFiles = [
  "README.md",
  "skills/fhir-validation/references/ig-workflows.md",
  "skills/fhir-validation/references/repair-policy.md",
  "skills/fhir-validation/references/operationoutcome-map.md",
  "skills/fhir-validation/references/quality-rules.md",
  "skills/fhir-validation/references/ci-templates.md",
  "skills/fhir-validation/references/structural-validation.md",
  "skills/fhir-validation/scripts/lib/operationoutcome-issues.mjs",
  "skills/fhir-validation/scripts/lib/package-doctor.mjs",
  "skills/fhir-validation/scripts/lib/runtime-policy.mjs",
  "skills/fhir-validation/scripts/lib/r4-structural-schema.mjs",
  "skills/fhir-validation/scripts/lib/r4-primitives.mjs",
  "skills/fhir-validation/scripts/lib/fhirpath-pointer.mjs",
  "skills/fhir-validation/scripts/validate-structural.mjs",
  "skills/fhir-validation/scripts/validate.mjs",
  "skills/fhir-validation/scripts/match-slices.mjs",
  "skills/fhir-validation/scripts/generate-issue-map-doc.mjs",
  "skills/fhir-validation/scripts/analyze-structuredefinition.mjs",
  "skills/fhir-validation/scripts/plan-runtime.mjs",
  "skills/fhir-validation/scripts/doctor-packages.mjs",
  "skills/fhir-validation/scripts/detect-fhir-project.mjs",
  "skills/fhir-validation/scripts/map-generated-to-fsh.mjs",
  "skills/fhir-validation/scripts/redact-fhir-summary.mjs",
  "skills/fhir-validation/scripts/explain-operationoutcome.mjs",
  "skills/fhir-validation/scripts/derive-quality-rules.mjs",
  "skills/fhir-validation/scripts/generate-ci.mjs",
  "skills/fhir-validation/scripts/map-fhir-expression.mjs",
  "commands/doctor.md",
  "commands/init-ci.md",
  "commands/explain-outcome.md",
  "commands/derive-quality-rules.md",
  "commands/validate.md",
  "agents/fhir-validation-reviewer.md",
  "fixtures/invalid-observation.json",
  "fixtures/operationoutcome-required.json",
  "fixtures/mini-ig/input/fsh/profiles.fsh",
  "fixtures/mini-ig/sushi-config.yaml",
];
for (const file of requiredRepoFiles) {
  if (!(await exists(path.join(repo, file)))) errors.push(`Missing required file: ${file}`);
}
for (const file of requiredPluginFiles) {
  if (!(await exists(path.join(plugin, file)))) errors.push(`Missing required file: ${path.relative(repo, path.join(plugin, file))}`);
}
if (!(await exists(skillFile))) errors.push("Missing required skill file: skills/fhir-validation/SKILL.md or skills/fhir-validation.md");

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
  skillFile,
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

const skillText = await readFile(skillFile, "utf8");
const skillLines = skillText.trim().split(/\r?\n/).length;
if (skillLines > 90) errors.push(`SKILL.md should stay concise; found ${skillLines} lines.`);

for (const script of [
  "skills/fhir-validation/scripts/detect-fhir-project.mjs",
  "skills/fhir-validation/scripts/map-generated-to-fsh.mjs",
  "skills/fhir-validation/scripts/redact-fhir-summary.mjs",
  "skills/fhir-validation/scripts/explain-operationoutcome.mjs",
  "skills/fhir-validation/scripts/derive-quality-rules.mjs",
  "skills/fhir-validation/scripts/generate-ci.mjs",
  "skills/fhir-validation/scripts/map-fhir-expression.mjs",
  "skills/fhir-validation/scripts/validate-structural.mjs",
  "skills/fhir-validation/scripts/validate.mjs",
  "skills/fhir-validation/scripts/match-slices.mjs",
  "skills/fhir-validation/scripts/generate-issue-map-doc.mjs",
  "skills/fhir-validation/scripts/analyze-structuredefinition.mjs",
  "skills/fhir-validation/scripts/plan-runtime.mjs",
  "skills/fhir-validation/scripts/doctor-packages.mjs",
  "skills/fhir-validation/scripts/lib/operationoutcome-issues.mjs",
  "skills/fhir-validation/scripts/lib/package-doctor.mjs",
  "skills/fhir-validation/scripts/lib/runtime-policy.mjs",
  "skills/fhir-validation/scripts/lib/r4-structural-schema.mjs",
  "skills/fhir-validation/scripts/lib/r4-primitives.mjs",
  "skills/fhir-validation/scripts/lib/fhirpath-pointer.mjs",
]) {
  const scriptStat = await stat(path.join(plugin, script));
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
if (pointer?.confidence !== "exact") errors.push("FHIR expression mapper should map a plain path with exact confidence.");

const choicePointer = runJson(expressionMapper, ["Observation.value[x]"]);
if (choicePointer?.confidence !== "none" || !choicePointer?.caveats?.length) {
  errors.push("FHIR expression mapper should flag choice[x] with low confidence and a caveat.");
}

const slicePointer = runJson(expressionMapper, ["Observation.category[VSCat].coding[0]"]);
if (!slicePointer?.slices?.some((entry) => entry.slice === "VSCat") || slicePointer?.confidence !== "partial") {
  errors.push("FHIR expression mapper should report named slices and partial confidence.");
}

// Issue-map single source of truth stays in sync with the generated doc.
const docCheck = spawnSync(process.execPath, [path.join(plugin, "skills/fhir-validation/scripts/generate-issue-map-doc.mjs"), "--check"], { cwd: repo, encoding: "utf8", maxBuffer: spawnMaxBuffer });
if (docCheck.status !== 0) errors.push(`operationoutcome-map.md is out of sync with operationoutcome-issues.mjs: ${docCheck.stderr || docCheck.stdout}`);

// Structural fallback validator.
function runValidator(args, input = null) {
  const result = spawnSync(process.execPath, [path.join(plugin, "skills/fhir-validation/scripts/validate-structural.mjs"), ...args], { cwd: repo, input, encoding: "utf8", maxBuffer: spawnMaxBuffer });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    errors.push(`Structural validator did not output JSON: ${result.stderr || result.stdout}`);
  }
  return { status: result.status, parsed };
}

// runJson in this file passes env, not stdin; this variant feeds JSON on stdin.
function runJsonInput(script, input) {
  const result = spawnSync(process.execPath, [script], { cwd: repo, input, encoding: "utf8", maxBuffer: spawnMaxBuffer });
  if (result.status !== 0) {
    errors.push(`${rel(script)} failed on stdin input: ${result.stderr || result.stdout}`);
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    errors.push(`${rel(script)} did not output JSON: ${error.message}`);
    return null;
  }
}

// Run an arbitrary JSON-emitting script with file args and return status+parsed.
function runValidatorScript(script, args, env = process.env) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: repo, encoding: "utf8", env, maxBuffer: spawnMaxBuffer });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    errors.push(`${rel(script)} did not output JSON: ${result.stderr || result.stdout}`);
  }
  return { status: result.status, parsed };
}

const invalidObs = runValidator([path.join(plugin, "fixtures/invalid-observation.json")]);
if (invalidObs.parsed) {
  if (invalidObs.status !== 1) errors.push("Structural validator should exit 1 for the invalid Observation.");
  const codes = invalidObs.parsed.operationOutcome.issue.map((entry) => `${entry.severity}:${entry.code}`);
  if (!codes.includes("error:required")) errors.push("Structural validator should flag the missing required Observation.code.");
  if (!codes.includes("error:value")) errors.push("Structural validator should flag the non-string Observation.status.");
}
const validPatient = runValidator([], '{"resourceType":"Patient","id":"ok","gender":"female"}');
if (validPatient.parsed) {
  if (validPatient.status !== 0) errors.push("Structural validator should exit 0 for a valid Patient.");
  if (validPatient.parsed.summary.error !== 0) errors.push("Structural validator should report no errors for a valid Patient.");
}

// StructureDefinition snapshot/slicing analyzer.
const analyzer = path.join(plugin, "skills/fhir-validation/scripts/analyze-structuredefinition.mjs");
const analysis = runJson(analyzer, [path.join(plugin, "fixtures/structuredefinition-sliced.json")]);
if (analysis) {
  if (analysis.needsSnapshot !== true) errors.push("Analyzer should flag the differential-only profile as needing a snapshot.");
  const slice = analysis.slicing?.[0];
  if (slice?.path !== "Observation.category") errors.push("Analyzer should report the sliced element path.");
  if (!slice?.slices?.includes("vital") || !slice?.slices?.includes("lab")) errors.push("Analyzer should list declared slice names.");
  if (slice?.discriminator?.[0]?.path !== "coding.code") errors.push("Analyzer should report the slice discriminator path.");
}

// Detector package-cache and dependency resolution surface.
// Point at an empty cache so resolution is deterministic regardless of the host.
const emptyCache = await mkdtemp(path.join(os.tmpdir(), "records-empty-cache-"));
const resolution = runJson(detector, [miniIg], { ...process.env, FHIR_PACKAGE_CACHE: emptyCache });
if (resolution) {
  if (resolution.fhirPackageCache?.available !== true || resolution.fhirPackageCache.packageCount !== 0) {
    errors.push("Detector should report an available but empty package cache.");
  }
  if (resolution.packageResolution?.declaredCount !== 1) errors.push("Detector should count one declared mini-ig dependency.");
  if (!resolution.packageResolution?.missing?.some((entry) => entry.name === "hl7.fhir.r4.core")) {
    errors.push("Detector should report the unresolved hl7.fhir.r4.core dependency.");
  }
}

// A populated cache resolves the declared dependency.
const fullCache = await mkdtemp(path.join(os.tmpdir(), "records-full-cache-"));
await mkdir(path.join(fullCache, "hl7.fhir.r4.core#4.0.1"), { recursive: true });
const resolvedDetection = runJson(detector, [miniIg], { ...process.env, FHIR_PACKAGE_CACHE: fullCache });
if (resolvedDetection && resolvedDetection.packageResolution?.resolvedCount !== 1) {
  errors.push("Detector should resolve hl7.fhir.r4.core when present in the cache.");
}

// Runtime planning, privacy gates, and package doctor.
const planner = path.join(plugin, "skills/fhir-validation/scripts/plan-runtime.mjs");
const runtimePlan = runJson(planner, [miniIg], { ...process.env, FHIR_PACKAGE_CACHE: emptyCache, PATH: "" });
if (runtimePlan) {
  if (runtimePlan.selectedMode !== "structural-fallback") errors.push("Runtime planner should select structural fallback when no runtime is available.");
  if (!runtimePlan.privacyGate?.consentRequired?.some((entry) => entry.action === "package-download-or-install")) {
    errors.push("Runtime planner should gate missing package downloads behind consent.");
  }
}
const urlPlan = runJson(planner, ["https://example.org/fhir/Patient/1"]);
if (urlPlan) {
  if (urlPlan.selectedMode !== "blocked-pending-consent") errors.push("Runtime planner should block FHIR URLs pending consent.");
  if (!urlPlan.privacyGate?.consentRequired?.some((entry) => entry.action === "fetch-fhir-url")) {
    errors.push("Runtime planner should require consent before fetching FHIR URLs.");
  }
}
const packageDoctor = path.join(plugin, "skills/fhir-validation/scripts/doctor-packages.mjs");
const missingPackageDoctor = runValidatorScript(packageDoctor, [miniIg], { ...process.env, FHIR_PACKAGE_CACHE: emptyCache });
if (missingPackageDoctor.status !== 1 || missingPackageDoctor.parsed?.maxSeverity !== "error") {
  errors.push("Package doctor should exit 1 when declared FHIR packages are missing.");
}
const resolvedPackageDoctor = runValidatorScript(packageDoctor, [miniIg], { ...process.env, FHIR_PACKAGE_CACHE: fullCache });
if (resolvedPackageDoctor.status !== 0 || resolvedPackageDoctor.parsed?.packageResolution?.resolvedCount !== 1) {
  errors.push("Package doctor should pass when declared FHIR packages are present in cache.");
}

// --- Extended structural validator coverage ---
function validatorCodes(args, input = null) {
  const run = runValidator(args, input);
  return { status: run.status, codes: run.parsed ? run.parsed.operationOutcome.issue.map((entry) => `${entry.code}:${entry.expression[0]}`) : null };
}
const unknownElement = validatorCodes([], '{"resourceType":"Patient","id":"x","bogusElement":1}');
if (!unknownElement.codes?.some((entry) => entry.startsWith("structure:") && entry.includes("bogusElement"))) errors.push("Validator should flag unknown elements as structure.");
const doubleChoice = validatorCodes([], '{"resourceType":"Observation","status":"final","code":{},"valueString":"a","valueInteger":2}');
if (!doubleChoice.codes?.includes("structure:Observation.value[x]")) errors.push("Validator should flag choice[x] exclusivity.");
const badEnum = validatorCodes([], '{"resourceType":"Observation","status":"bogus","code":{}}');
if (!badEnum.codes?.includes("code-invalid:Observation.status")) errors.push("Validator should flag invalid required code enums.");
const nullValue = validatorCodes([], '{"resourceType":"Patient","id":"x","active":null}');
if (!nullValue.codes?.some((entry) => entry.startsWith("value:"))) errors.push("Validator should flag null values.");
const emptyArray = validatorCodes([], '{"resourceType":"Patient","id":"x","name":[]}');
if (!emptyArray.codes?.some((entry) => entry.startsWith("value:"))) errors.push("Validator should flag empty arrays.");
const unknownType = runValidator([], '{"resourceType":"Goober","id":"x"}');
if (unknownType.status !== 0 || !unknownType.parsed?.operationOutcome.issue.some((entry) => entry.code === "incomplete")) errors.push("Validator should return incomplete info and exit 0 for unschemaed resource types.");
const bundleRecursion = validatorCodes([], '{"resourceType":"Bundle","type":"collection","entry":[{"resource":{"resourceType":"Observation","status":12}}]}');
if (!bundleRecursion.codes?.some((entry) => entry.includes("entry[0].resource"))) errors.push("Validator should recurse into Bundle entries.");
const validatorBadJson = spawnSync(process.execPath, [path.join(plugin, "skills/fhir-validation/scripts/validate-structural.mjs")], { cwd: repo, input: "{not json", encoding: "utf8" });
if (validatorBadJson.status !== 2) errors.push("Validator should exit 2 on invalid JSON.");

// --- Extended expression mapper coverage ---
const functionExpr = runJson(expressionMapper, ["Bundle.entry.resource.ofType(Patient).name.where(use='official')"]);
if (!functionExpr?.functions?.some((entry) => entry.name === "ofType") || !functionExpr?.functions?.some((entry) => entry.name === "where")) errors.push("Expression mapper should capture FHIRPath functions.");
const noArgExpr = spawnSync(process.execPath, [expressionMapper], { cwd: repo, encoding: "utf8" });
if (noArgExpr.status !== 2) errors.push("Expression mapper should exit 2 with no argument.");

// --- Extended explainer coverage ---
const allCodes = ["required", "value", "code-invalid", "structure", "invariant", "processing", "not-found", "duplicate", "forbidden", "incomplete", "business-rule", "profile-unknown", "slicing"];
const allExplained = runJsonInput(explainer, JSON.stringify({ resourceType: "OperationOutcome", issue: allCodes.map((code) => ({ severity: "error", code })) }));
if (!allExplained?.issues?.every((entry) => entry.meaning && !/Unknown/.test(entry.meaning))) errors.push("Explainer should map every known issue code.");
const unknownCode = runJsonInput(explainer, JSON.stringify({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "made-up" }] }));
if (!/Unknown/.test(unknownCode?.issues?.[0]?.meaning || "")) errors.push("Explainer should fall back for unknown codes.");
if (spawnSync(process.execPath, [explainer], { cwd: repo, input: '{"resourceType":"Patient"}', encoding: "utf8" }).status !== 2) errors.push("Explainer should exit 2 for non-OperationOutcome input.");

// --- Extended analyzer coverage ---
const withSnapshot = runJsonInput(analyzer, JSON.stringify({ resourceType: "StructureDefinition", derivation: "constraint", snapshot: { element: [{ path: "Observation" }] } }));
if (withSnapshot?.needsSnapshot !== false) errors.push("Analyzer should not flag profiles that already have a snapshot.");
const noDiscriminator = runJsonInput(analyzer, JSON.stringify({ resourceType: "StructureDefinition", derivation: "constraint", snapshot: { element: [{ path: "X" }] }, differential: { element: [{ path: "Observation.category", slicing: { rules: "open" } }] } }));
if (!noDiscriminator?.caveats?.some((entry) => /no discriminator/.test(entry))) errors.push("Analyzer should caveat slicing without a discriminator.");
if (spawnSync(process.execPath, [analyzer], { cwd: repo, input: '{"resourceType":"Patient"}', encoding: "utf8" }).status !== 2) errors.push("Analyzer should exit 2 for non-StructureDefinition input.");

// --- Flat-directory detection ---
const flatDir = await mkdtemp(path.join(os.tmpdir(), "records-flat-"));
await writeFile(path.join(flatDir, "obs.json"), JSON.stringify({ resourceType: "Observation", id: "a", status: "final", code: {} }), "utf8");
const flatDetection = runJson(detector, [flatDir], { ...process.env, FHIR_PACKAGE_CACHE: emptyCache });
if (flatDetection?.projectType !== "fhir-resources" || flatDetection?.resourceInventory.byResourceType.Observation !== 1) {
  errors.push("Detector should classify a flat directory of resources as fhir-resources.");
}
const emptyDir = await mkdtemp(path.join(os.tmpdir(), "records-emptydir-"));
const emptyDetection = runJson(detector, [emptyDir], { ...process.env, FHIR_PACKAGE_CACHE: emptyCache });
if (emptyDetection?.projectType !== "unknown") errors.push("Detector should classify an empty directory as unknown.");

// --- Redaction and quality-rule derivation ---
const redactor = path.join(plugin, "skills/fhir-validation/scripts/redact-fhir-summary.mjs");
const bundleSummary = runJsonInput(redactor, JSON.stringify({ resourceType: "Bundle", entry: [{ resource: { resourceType: "Patient", id: "p1" } }] }));
if (bundleSummary?.entryCount !== 1 || bundleSummary?.privacyRiskLevel !== "high") errors.push("Redactor should summarize Bundles and raise risk for Patient entries.");
const qualityDir = await mkdtemp(path.join(os.tmpdir(), "records-quality-"));
for (const id of ["a", "b", "c"]) {
  await writeFile(path.join(qualityDir, `${id}.json`), JSON.stringify({ resourceType: "Observation", id, status: "final", code: {}, meta: { profile: ["https://example.org/StructureDefinition/p"] } }), "utf8");
}
const qualityRules = runJson(path.join(plugin, "skills/fhir-validation/scripts/derive-quality-rules.mjs"), [qualityDir]);
if (!qualityRules?.proposedRules?.some((rule) => rule.id.startsWith("profile-") && rule.confidence === "high")) {
  errors.push("Quality-rule derivation should propose a high-confidence profile rule when all resources share a profile.");
}

// --- CI generation modes ---
const ciGen = path.join(plugin, "skills/fhir-validation/scripts/generate-ci.mjs");
const apiCi = spawnSync(process.execPath, [ciGen, "--api"], { cwd: repo, encoding: "utf8" }).stdout;
if (!apiCi.includes("RECORDS_API_URL")) errors.push("CI generator --api should reference RECORDS_API_URL.");
const sushiCi = spawnSync(process.execPath, [ciGen, "--sushi"], { cwd: repo, encoding: "utf8" }).stdout;
if (!sushiCi.includes("sushi .")) errors.push("CI generator --sushi should include a SUSHI build step.");
const uploadCi = spawnSync(process.execPath, [ciGen, "--upload-artifact"], { cwd: repo, encoding: "utf8" }).stdout;
if (!uploadCi.includes("upload-artifact")) errors.push("CI generator --upload-artifact should add an artifact upload step.");

// --- v0.5.0: expanded schema, primitives, required choice, references ---
const condition = validatorCodes([path.join(plugin, "fixtures/condition-missing-subject.json")]);
if (!condition.codes?.includes("required:Condition.subject")) errors.push("Validator should require Condition.subject.");
if (!condition.codes?.some((entry) => entry.startsWith("value:Condition.recordedDate"))) errors.push("Validator should flag the malformed Condition.recordedDate primitive.");

const badPrimitive = validatorCodes([], '{"resourceType":"Patient","id":"x","birthDate":"2020-13-01","active":"yes"}');
if (!badPrimitive.codes?.some((entry) => entry.startsWith("value:Patient.birthDate"))) errors.push("Validator should flag an invalid date primitive.");
if (!badPrimitive.codes?.some((entry) => entry.startsWith("value:Patient.active"))) errors.push("Validator should flag a non-boolean primitive.");

const reqChoiceMissing = validatorCodes([], '{"resourceType":"MedicationRequest","id":"m","status":"active","intent":"order","subject":{"reference":"Patient/p"}}');
if (!reqChoiceMissing.codes?.some((entry) => entry.includes("required:MedicationRequest.medication[x]"))) errors.push("Validator should require a medication[x] choice.");
const reqChoicePresent = validatorCodes([], '{"resourceType":"MedicationRequest","id":"m","status":"active","intent":"order","subject":{"reference":"Patient/p"},"medicationCodeableConcept":{}}');
if (reqChoicePresent.codes?.some((entry) => entry.includes("MedicationRequest.medication[x]"))) errors.push("Validator should accept a satisfied medication[x] choice.");

const containedMissing = runValidator([], '{"resourceType":"Observation","status":"final","code":{},"subject":{"reference":"#p1"}}');
if (containedMissing.parsed?.summary.error !== 1 || !containedMissing.parsed?.operationOutcome.issue.some((entry) => entry.severity === "error" && entry.code === "not-found")) {
  errors.push("Validator should flag an unresolved contained reference as an error.");
}
const bundleUnresolved = runValidator([], '{"resourceType":"Bundle","type":"collection","entry":[{"resource":{"resourceType":"Observation","status":"final","code":{},"subject":{"reference":"Patient/missing"}}}]}');
if (bundleUnresolved.parsed?.summary.warning !== 1 || bundleUnresolved.status !== 0) errors.push("Validator should warn (not error) on an unresolved intra-Bundle reference.");
const bundleResolved = runValidator([], '{"resourceType":"Bundle","type":"collection","entry":[{"resource":{"resourceType":"Patient","id":"p"}},{"resource":{"resourceType":"Observation","status":"final","code":{},"subject":{"reference":"Patient/p"}}}]}');
if (bundleResolved.parsed?.summary.warning !== 0 || bundleResolved.parsed?.summary.error !== 0) errors.push("Validator should resolve an intra-Bundle reference cleanly.");

// --- v0.5.0: instance-based slice matching ---
const matcher = path.join(plugin, "skills/fhir-validation/scripts/match-slices.mjs");
const slice = runJson(matcher, [path.join(plugin, "fixtures/structuredefinition-sliced.json"), path.join(plugin, "fixtures/observation-sliced-instance.json")]);
const sliceElement = slice?.slicedElements?.[0];
if (!sliceElement || JSON.stringify(sliceElement.slices) !== JSON.stringify({ vital: [0], lab: [1] })) errors.push("Slice matcher should attribute entries 0 and 1 to the vital and lab slices.");
if (!sliceElement?.unmatched?.includes(2)) errors.push("Slice matcher should report the unmatched social-history entry.");

// --- v0.5.0: orchestrator ---
const orchestrator = path.join(plugin, "skills/fhir-validation/scripts/validate.mjs");
const orchFile = runValidatorScript(orchestrator, [path.join(plugin, "fixtures/invalid-observation.json")]);
if (orchFile.status !== 1 || orchFile.parsed?.totals.error !== 2) errors.push("Orchestrator should report 2 errors and exit 1 for the invalid Observation.");
const firstIssue = orchFile.parsed?.results?.[0]?.issues?.[0];
if (!firstIssue?.jsonPointer || !firstIssue?.safeFixability) errors.push("Orchestrator should enrich issues with a JSON Pointer and fixability guidance.");
if (!orchFile.parsed?.runtimePlan || !orchFile.parsed?.privacyGate || !orchFile.parsed?.packageDoctor) {
  errors.push("Orchestrator should include runtimePlan, privacyGate, and packageDoctor context.");
}
const orchDir = runValidatorScript(orchestrator, [miniIg]);
if (orchDir.parsed?.detector?.projectType !== "fsh-ig") errors.push("Orchestrator should include detector context for a directory target.");
if (!(orchDir.parsed?.totals.resources >= 2)) errors.push("Orchestrator should validate every resource in a directory.");
const orchUrl = runValidatorScript(orchestrator, ["https://example.org/fhir/Patient/1"]);
if (orchUrl.status !== 2 || orchUrl.parsed?.mode !== "blocked-pending-consent") {
  errors.push("Orchestrator should block URL targets pending consent without fetching.");
}

const fakeRuntimeBin = await mkdtemp(path.join(os.tmpdir(), "records-runtime-"));
const fakeRecords = path.join(fakeRuntimeBin, "records");
await writeFile(fakeRecords, `#!/bin/sh
if [ "$1" = "--version" ]; then
  echo "records 9.9.9"
  exit 0
fi
if [ "$1" = "validate-file" ]; then
  cat <<'JSON'
{"resourceType":"OperationOutcome","issue":[{"severity":"error","code":"required","expression":["Observation.code"],"details":{"text":"Missing required element code."}}]}
JSON
  exit 1
fi
echo "unexpected records args: $*" >&2
exit 2
`, "utf8");
await chmod(fakeRecords, 0o755);
const orchRecordsCli = runValidatorScript(orchestrator, [path.join(plugin, "fixtures/invalid-observation.json")], {
  ...process.env,
  PATH: `${fakeRuntimeBin}${path.delimiter}${process.env.PATH || ""}`,
});
if (orchRecordsCli.status !== 1 || orchRecordsCli.parsed?.mode !== "records-cli") {
  errors.push("Orchestrator should execute a detected local Records CLI before falling back.");
}
if (!orchRecordsCli.parsed?.runtimeAttempts?.[0]?.parsed || orchRecordsCli.parsed?.totals?.error !== 1) {
  errors.push("Records CLI adapter should parse OperationOutcome output and summarize errors.");
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("Smoke test passed.");
