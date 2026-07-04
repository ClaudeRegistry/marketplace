#!/usr/bin/env node
// End-to-end local validation orchestrator: plans the best configured runtime,
// enforces privacy boundaries, optionally uses a local Records CLI, and falls
// back to structural validation with enriched issues.
//
// This is still the structural fallback: not profile-, terminology-,
// invariant-, or cross-document-reference-aware. Prefer a profile-aware runtime
// when available; this orchestrator is for fast local triage.
//
// Usage: validate.mjs <file-or-directory>
import { readdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { issueByCode, unknownIssue } from "./lib/operationoutcome-issues.mjs";
import { mapExpression } from "./lib/fhirpath-pointer.mjs";
import { buildPackageDoctor } from "./lib/package-doctor.mjs";
import { buildRuntimePlan, isUrlTarget } from "./lib/runtime-policy.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const validatorScript = path.join(scriptDir, "validate-structural.mjs");
const detectorScript = path.join(scriptDir, "detect-fhir-project.mjs");
const maxFiles = Number.parseInt(process.env.RECORDS_VALIDATE_MAX_FILES || "200", 10);
const recordsCliTimeoutMs = Number.parseInt(process.env.RECORDS_VALIDATE_RUNTIME_TIMEOUT_MS || "30000", 10);

const target = process.argv[2];
if (!target) {
  console.error("Usage: validate.mjs <file-or-directory>");
  process.exit(2);
}

async function finish(payload, code) {
  await new Promise((resolve) => {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`, resolve);
  });
  process.exit(code);
}

if (isUrlTarget(target)) {
  const runtimePlan = buildRuntimePlan(null, { target });
  await finish({
    schemaVersion: 1,
    mode: "blocked-pending-consent",
    scope: "No network or FHIR server access was attempted. URL validation requires explicit user consent.",
    target,
    privacyGate: runtimePlan.privacyGate,
    runtimePlan,
    packageDoctor: null,
    runtimeAttempts: [],
    totals: { resources: 0, error: 0, warning: 0, information: 0 },
    results: [],
  }, 2);
}

let targetStat;
try {
  targetStat = await stat(target);
} catch (error) {
  console.error(`Cannot access ${target}: ${error.message}`);
  process.exit(2);
}

async function walk(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (["node_modules", ".git", ".fhir", "input-cache"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}

function runJsonScript(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    parsed = null;
  }
  return { status: result.status, parsed, stderr: result.stderr };
}

function severitySummary(issues) {
  return issues.reduce(
    (acc, issue) => {
      const severity = issue.severity === "fatal" ? "error" : issue.severity;
      if (severity === "error") acc.error += 1;
      else if (severity === "warning") acc.warning += 1;
      else acc.information += 1;
      return acc;
    },
    { error: 0, warning: 0, information: 0 },
  );
}

function enrichIssue(issue) {
  const guidance = issueByCode[issue.code] || unknownIssue;
  const expression = Array.isArray(issue.expression) ? issue.expression[0] : issue.expression;
  const pointer = expression ? mapExpression(expression) : null;
  return {
    severity: issue.severity,
    code: issue.code,
    expression: expression || null,
    jsonPointer: pointer?.jsonPointer ?? null,
    pointerConfidence: pointer?.confidence ?? null,
    text: issue.details?.text ?? null,
    meaning: guidance.meaning,
    safeFixability: guidance.safeFixability,
    domainInput: guidance.domainInput,
  };
}

function validateFile(file) {
  const run = runJsonScript(validatorScript, [file]);
  if (!run.parsed) {
    return { file, ok: false, error: run.stderr?.trim() || "validator produced no JSON", summary: { error: 1, warning: 0, information: 0 }, issues: [] };
  }
  const realIssues = run.parsed.operationOutcome.issue.filter((issue) => issue.code !== "informational");
  return {
    file,
    resourceType: run.parsed.resourceType,
    summary: run.parsed.summary,
    issues: realIssues.map(enrichIssue),
  };
}

function normalizeOperationOutcome(file, operationOutcome) {
  if (operationOutcome?.resourceType !== "OperationOutcome" || !Array.isArray(operationOutcome.issue)) return null;
  const realIssues = operationOutcome.issue.filter((issue) => issue.code !== "informational");
  return {
    file,
    resourceType: null,
    summary: severitySummary(realIssues),
    issues: realIssues.map(enrichIssue),
  };
}

function tryRecordsCli(runtimePlan) {
  const selected = runtimePlan.selectedRuntime;
  if (process.env.RECORDS_VALIDATE_STRUCTURAL_ONLY === "1") return null;
  if (selected?.name !== "records-cli" || selected.blocked || !selected.available) return null;
  const command = selected.path || "records";
  const result = spawnSync(command, ["validate-file", target, "--format", "json"], {
    encoding: "utf8",
    timeout: recordsCliTimeoutMs,
  });
  const attempt = {
    runtime: "records-cli",
    command: "records validate-file <target> --format json",
    status: result.status,
    signal: result.signal || null,
    error: result.error?.message || null,
    parsed: false,
    fallbackUsed: false,
  };
  if (result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM") {
    attempt.error = "records CLI timed out";
    attempt.fallbackUsed = true;
    return { attempt, normalized: null };
  }
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
    attempt.parsed = true;
  } catch {
    attempt.error = (result.stderr || result.stdout || "records CLI output was not JSON").trim();
    attempt.fallbackUsed = true;
    return { attempt, normalized: null };
  }
  const operationOutcome = parsed.resourceType === "OperationOutcome" ? parsed : parsed.operationOutcome;
  const normalized = normalizeOperationOutcome(target, operationOutcome);
  if (!normalized) {
    attempt.error = "records CLI JSON did not contain an OperationOutcome";
    attempt.fallbackUsed = true;
    return { attempt, normalized: null };
  }
  return { attempt, normalized };
}

// Resolve the set of resource files.
let files;
let detectorOutput = null;
const detectorRoot = targetStat.isDirectory() ? target : path.dirname(target);
const detectorRun = runJsonScript(detectorScript, [detectorRoot]);
if (detectorRun.parsed) detectorOutput = detectorRun.parsed;
const runtimePlan = buildRuntimePlan(detectorOutput, { target });
const packageDoctor = detectorOutput ? buildPackageDoctor(detectorOutput) : null;
const runtimeAttempts = [];
const detector = detectorOutput ? {
  projectType: detectorOutput.projectType,
  privacyRiskLevel: detectorOutput.privacyRiskLevel,
  recommendedOrder: detectorOutput.recommendedOrder,
  packageResolution: detectorOutput.packageResolution,
} : null;

const recordsCliRun = tryRecordsCli(runtimePlan);
if (recordsCliRun) {
  runtimeAttempts.push(recordsCliRun.attempt);
  if (recordsCliRun.normalized) {
    const totals = {
      resources: 1,
      ...recordsCliRun.normalized.summary,
    };
    await finish({
      schemaVersion: 1,
      mode: "records-cli",
      scope: "Local Records CLI validation. Profile, terminology, and invariant coverage depend on the CLI/project configuration.",
      target,
      detector,
      privacyGate: runtimePlan.privacyGate,
      runtimePlan,
      packageDoctor,
      runtimeAttempts,
      totals,
      results: [recordsCliRun.normalized],
    }, totals.error > 0 ? 1 : 0);
  }
}

if (targetStat.isDirectory()) {
  files = (await walk(target)).slice(0, maxFiles);
} else {
  files = [target];
}

const results = [];
for (const file of files) {
  // Only validate JSON that is actually a FHIR resource.
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    if (!parsed || typeof parsed.resourceType !== "string") continue;
  } catch {
    continue;
  }
  results.push(validateFile(file));
}

const totals = results.reduce(
  (acc, result) => {
    acc.error += result.summary.error || 0;
    acc.warning += result.summary.warning || 0;
    acc.information += result.summary.information || 0;
    return acc;
  },
  { resources: results.length, error: 0, warning: 0, information: 0 },
);

await finish({
  schemaVersion: 1,
  mode: "structural-fallback (orchestrated)",
  scope: "Local structural triage only. Not profile-, terminology-, invariant-, or cross-document-reference-aware.",
  target,
  detector,
  privacyGate: runtimePlan.privacyGate,
  runtimePlan,
  packageDoctor,
  runtimeAttempts,
  totals,
  results,
}, totals.error > 0 ? 1 : 0);
