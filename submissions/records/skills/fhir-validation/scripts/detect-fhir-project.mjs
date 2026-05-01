#!/usr/bin/env node
import { access, readdir, readFile, stat } from "node:fs/promises";
import { accessSync } from "node:fs";
import { constants } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const schemaVersion = 1;
const root = path.resolve(process.argv[2] || process.cwd());
const maxInventoryFiles = Number.parseInt(process.env.RECORDS_DETECTOR_MAX_FILES || "500", 10);

async function exists(file) {
  try {
    await access(path.join(root, file), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function isDir(file) {
  try {
    return (await stat(path.join(root, file))).isDirectory();
  } catch {
    return false;
  }
}

async function listFiles(dir, depth = 2) {
  const base = path.join(root, dir);
  const out = [];
  async function walk(current, remaining) {
    if (remaining < 0) return;
    let entries = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (["node_modules", ".git", ".fhir", "input-cache"].includes(entry.name)) continue;
      const full = path.join(current, entry.name);
      const rel = path.relative(root, full);
      if (entry.isDirectory()) await walk(full, remaining - 1);
      else out.push(rel);
    }
  }
  await walk(base, depth);
  return out.sort();
}

async function readText(file) {
  try {
    return await readFile(path.join(root, file), "utf8");
  } catch {
    return "";
  }
}

function findExecutable(command) {
  const pathEnv = process.env.PATH || "";
  const pathExt = process.platform === "win32" ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of pathEnv.split(path.delimiter).filter(Boolean)) {
    for (const ext of pathExt) {
      const candidate = path.join(dir, `${command}${ext}`);
      try {
        accessSyncShim(candidate);
        return candidate;
      } catch {
        // Keep scanning PATH.
      }
    }
  }
  return null;
}

function accessSyncShim(file) {
  accessSync(file, constants.X_OK);
}

function commandInfo(command, args = ["--version"]) {
  const resolvedPath = findExecutable(command);
  if (!resolvedPath) {
    return { available: false, command, path: null, version: null, reason: "not_found" };
  }
  const result = spawnSync(resolvedPath, args, { encoding: "utf8", timeout: 3000 });
  if (result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM") {
    return { available: true, command, path: resolvedPath, version: null, reason: "version_timeout" };
  }
  const output = String(result.stdout || result.stderr || "").split(/\r?\n/).find(Boolean) || null;
  return {
    available: true,
    command,
    path: resolvedPath,
    version: output,
    reason: result.status === 0 ? "ok" : "version_unavailable",
  };
}

async function packageJson() {
  if (!(await exists("package.json"))) return null;
  try {
    return JSON.parse(await readText("package.json"));
  } catch {
    return null;
  }
}

function parseYamlScalar(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*([^\\n#]+)`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
}

function parseSushiDependencies(text) {
  const deps = {};
  const block = text.match(/^dependencies:\s*\n((?:\s{2,}.+\n?)*)/m);
  if (!block) return deps;
  for (const line of block[1].split(/\r?\n/)) {
    const match = line.match(/^\s{2,}([^:#]+):\s*([^#]+?)\s*$/);
    if (match) deps[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return deps;
}

async function inventoryResources(dirs) {
  const byDirectory = {};
  const byResourceType = {};
  const metaProfiles = {};
  const privacySignals = {};
  let scanned = 0;
  for (const dir of dirs) {
    const files = (await listFiles(dir, 6)).filter((file) => file.endsWith(".json")).slice(0, maxInventoryFiles);
    byDirectory[dir] = { jsonFiles: files.length, resourceTypes: {} };
    for (const file of files) {
      scanned += 1;
      let resource;
      try {
        resource = JSON.parse(await readText(file));
      } catch {
        continue;
      }
      const type = typeof resource.resourceType === "string" ? resource.resourceType : "unknown";
      byDirectory[dir].resourceTypes[type] = (byDirectory[dir].resourceTypes[type] || 0) + 1;
      byResourceType[type] = (byResourceType[type] || 0) + 1;
      for (const profile of Array.isArray(resource.meta?.profile) ? resource.meta.profile : []) {
        metaProfiles[profile] = (metaProfiles[profile] || 0) + 1;
      }
      if (["Patient", "Person", "RelatedPerson", "Practitioner"].includes(type)) {
        privacySignals[type] = (privacySignals[type] || 0) + 1;
      }
      if (type === "Bundle" && Array.isArray(resource.entry)) {
        const patientEntries = resource.entry.filter((entry) => entry?.resource?.resourceType === "Patient").length;
        if (patientEntries) privacySignals.BundleWithPatient = (privacySignals.BundleWithPatient || 0) + patientEntries;
      }
    }
  }
  return { scannedJsonFiles: scanned, byDirectory, byResourceType, metaProfiles, privacySignals };
}

const sourceDirs = [];
for (const dir of ["input/fsh", "input/resources", "examples", "fixtures", "src", "test"]) {
  if (await isDir(dir)) sourceDirs.push(dir);
}

const generatedDirs = [];
for (const dir of ["fsh-generated/resources", "fsh-generated", "output", "package"]) {
  if (await isDir(dir)) generatedDirs.push(dir);
}

const workflowFiles = [];
for (const file of ["sushi-config.yaml", "sushi-config.yml", "ig.ini", "package.json", ".rules.yaml", ".rules.yml"]) {
  if (await exists(file)) workflowFiles.push(file);
}
if (await isDir(".github/workflows")) workflowFiles.push(...(await listFiles(".github/workflows", 1)));

const pkg = await packageJson();
const scripts = pkg?.scripts || {};
const scriptNames = Object.keys(scripts);
const sushiConfigFile = (await exists("sushi-config.yaml")) ? "sushi-config.yaml" : ((await exists("sushi-config.yml")) ? "sushi-config.yml" : null);
const sushiConfig = sushiConfigFile ? await readText(sushiConfigFile) : "";
const packageManifestText = await readText("package/package.json");
let packageManifest = null;
try {
  packageManifest = packageManifestText ? JSON.parse(packageManifestText) : null;
} catch {
  packageManifest = null;
}

const fhirVersions = [
  parseYamlScalar(sushiConfig, "fhirVersion"),
  packageManifest?.fhirVersions?.join?.(", "),
  packageManifest?.fhirVersion,
  pkg?.fhirVersion,
].filter(Boolean);
const packageDependencies = {
  sushi: parseSushiDependencies(sushiConfig),
  packageJson: Object.fromEntries(
    Object.entries({ ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) })
      .filter(([name]) => /fhir|sushi|records|hapi|firely|validator/i.test(name)),
  ),
};

const availableRuntimes = {
  recordsApi: {
    available: Boolean(process.env.RECORDS_API_URL),
    command: null,
    path: null,
    version: null,
    reason: process.env.RECORDS_API_URL ? "env_configured" : "env_not_set",
  },
  recordsCli: commandInfo("records"),
  localRecordsCliPackage: {
    available: await exists("cli/package.json"),
    command: null,
    path: (await exists("cli/package.json")) ? path.join(root, "cli/package.json") : null,
    version: null,
    reason: (await exists("cli/package.json")) ? "found" : "not_found",
  },
  sushi: commandInfo("sushi"),
  npxSushiScript: {
    available: scriptNames.some((name) => /sushi|fsh/i.test(`${name} ${scripts[name]}`)),
    command: null,
    path: (await exists("package.json")) ? path.join(root, "package.json") : null,
    version: null,
    reason: scriptNames.some((name) => /sushi|fsh/i.test(`${name} ${scripts[name]}`)) ? "script_found" : "script_not_found",
  },
  java: commandInfo("java", ["-version"]),
  javaValidatorJar: {
    available: (await listFiles(".", 2)).some((file) => /validator.*\.jar$/i.test(file)),
    command: null,
    path: null,
    version: null,
    reason: "scan",
    files: (await listFiles(".", 2)).filter((file) => /validator.*\.jar$/i.test(file)),
  },
  firelyTerminal: commandInfo("fhir"),
  hapi: commandInfo("hapi-fhir-cli"),
  packageScripts: scripts,
};

let projectType = "unknown";
if (workflowFiles.some((file) => file.startsWith("sushi-config")) || sourceDirs.includes("input/fsh")) {
  projectType = "fsh-ig";
} else if (workflowFiles.includes("ig.ini")) {
  projectType = "ig";
} else if (sourceDirs.some((dir) => ["input/resources", "examples", "fixtures"].includes(dir))) {
  projectType = "fhir-resources";
}

const resourceDirs = [...new Set([...sourceDirs, ...generatedDirs].filter((dir) => !dir.endsWith("/fsh") && dir !== "fsh-generated"))];
const resourceInventory = await inventoryResources(resourceDirs);
const mixedFhirVersionWarning = new Set(fhirVersions.map((value) => String(value).toLowerCase().replace(/\s+/g, ""))).size > 1;

const recommendedOrder = [];
if (sourceDirs.includes("input/fsh")) {
  recommendedOrder.push("Inspect input/fsh and sushi-config.yaml before editing generated resources.");
  if (availableRuntimes.sushi.available || availableRuntimes.npxSushiScript.available) {
    recommendedOrder.push("Run the repository SUSHI script or sushi build after FSH changes.");
  } else {
    recommendedOrder.push("SUSHI sources exist, but no local SUSHI runtime was detected; ask before installing.");
  }
}
if (availableRuntimes.recordsCli.available) {
  recommendedOrder.push("Run records validate-file on source or generated JSON directories.");
} else if (availableRuntimes.recordsApi.available) {
  recommendedOrder.push("Use RECORDS_API_URL only after confirming privacy consent for the selected resources.");
} else {
  recommendedOrder.push("Use structural fallback only and label it as not profile-aware.");
}
if (workflowFiles.includes("ig.ini") && availableRuntimes.java.available) {
  recommendedOrder.push("Run configured IG Publisher or Java validator for profile-aware IG validation when requested.");
}
if (availableRuntimes.firelyTerminal.available || availableRuntimes.hapi.available) {
  recommendedOrder.push("Use Firely Terminal or HAPI as a configured cross-check, not as an unannounced replacement.");
}

const privacyWarnings = [];
let privacyRiskLevel = "low";
if (availableRuntimes.recordsApi.available) {
  privacyRiskLevel = "medium";
  privacyWarnings.push("RECORDS_API_URL is set; confirm consent before sending PHI or full patient resources to the API.");
}
if (Object.keys(resourceInventory.privacySignals).length) {
  privacyRiskLevel = "high";
  privacyWarnings.push("Patient-like resources were detected; avoid printing identifiers and prefer local validation.");
}
if (sourceDirs.includes("examples") || sourceDirs.includes("fixtures") || sourceDirs.includes("input/resources")) {
  if (privacyRiskLevel === "low") privacyRiskLevel = "medium";
  privacyWarnings.push("FHIR resource directories may contain PHI; summarize minimally and prefer local validation.");
}
if (workflowFiles.some((file) => file.includes(".github/workflows"))) {
  privacyWarnings.push("CI workflows may publish logs; avoid printing complete Patient resources or secrets.");
}
if (mixedFhirVersionWarning) {
  privacyWarnings.push("Mixed FHIR version signals detected; confirm the intended FHIR version before profile-aware validation.");
}

const result = {
  schemaVersion,
  root,
  projectType,
  sourceDirs,
  generatedDirs,
  workflowFiles,
  fhirVersions,
  packageDependencies,
  resourceInventory,
  availableRuntimes,
  recommendedOrder,
  privacyRiskLevel,
  privacyWarnings,
};

console.log(JSON.stringify(result, null, 2));
