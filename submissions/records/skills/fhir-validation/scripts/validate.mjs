#!/usr/bin/env node
// End-to-end structural validation orchestrator: ties the local skill helpers
// into a single call. For a directory it first runs the project detector for
// mode/privacy context, then runs the structural validator on each resource,
// enriches every issue with fixability guidance (the OperationOutcome issue
// map) and a JSON Pointer (the FHIRPath mapper).
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

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const validatorScript = path.join(scriptDir, "validate-structural.mjs");
const detectorScript = path.join(scriptDir, "detect-fhir-project.mjs");
const maxFiles = Number.parseInt(process.env.RECORDS_VALIDATE_MAX_FILES || "200", 10);

const target = process.argv[2];
if (!target) {
  console.error("Usage: validate.mjs <file-or-directory>");
  process.exit(2);
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

// Resolve the set of resource files.
let files;
let detector = null;
if (targetStat.isDirectory()) {
  const detectorRun = runJsonScript(detectorScript, [target]);
  if (detectorRun.parsed) {
    detector = {
      projectType: detectorRun.parsed.projectType,
      privacyRiskLevel: detectorRun.parsed.privacyRiskLevel,
      recommendedOrder: detectorRun.parsed.recommendedOrder,
      packageResolution: detectorRun.parsed.packageResolution,
    };
  }
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

console.log(JSON.stringify({
  schemaVersion: 1,
  mode: "structural-fallback (orchestrated)",
  scope: "Local structural triage only. Not profile-, terminology-, invariant-, or cross-document-reference-aware.",
  target,
  detector,
  totals,
  results,
}, null, 2));

process.exit(totals.error > 0 ? 1 : 0);
