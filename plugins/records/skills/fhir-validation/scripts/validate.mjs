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
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { issueByCode, unknownIssue } from "./lib/operationoutcome-issues.mjs";
import { mapExpression } from "./lib/fhirpath-pointer.mjs";
import { buildPackageDoctor } from "./lib/package-doctor.mjs";
import { buildRuntimePlan, isUrlTarget } from "./lib/runtime-policy.mjs";
import {
  createResultContract,
  normalizedFhirVersion,
  unsupportedDeclaredFhirVersions,
} from "./lib/result-contract.mjs";
import { boundedEnvInt, readJsonFileLimited, scanFiles } from "./lib/safe-io.mjs";
import { runJsonProcess, runProcess } from "./lib/process-runner.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const validatorScript = path.join(scriptDir, "validate-structural.mjs");
const detectorScript = path.join(scriptDir, "detect-fhir-project.mjs");
const maxFiles = boundedEnvInt("RECORDS_VALIDATE_MAX_FILES", 200, { max: 10_000 });
const maxScanDirectories = boundedEnvInt("RECORDS_SCAN_MAX_DIRECTORIES", 500, { max: 10_000 });
const maxScanEntries = boundedEnvInt("RECORDS_SCAN_MAX_ENTRIES", 10_000, { max: 1_000_000 });
const recordsCliTimeoutMs = boundedEnvInt("RECORDS_VALIDATE_RUNTIME_TIMEOUT_MS", 30_000, { max: 10 * 60_000 });

const target = process.argv[2];
if (!target) {
  await finish({
    ...createResultContract({
      tool: "validate",
      mode: "input-error",
      ok: false,
      validationDepth: "none",
    }),
    error: "Usage: validate.mjs <file-or-directory>",
    warnings: [],
    nextActions: ["Pass a FHIR JSON file or project directory."],
  }, 2);
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
    ...createResultContract({
      tool: "validate",
      mode: "blocked-pending-consent",
      ok: false,
      privacyBoundary: "no-network-access",
      validationDepth: "blocked",
    }),
    scope: "No network or FHIR server access was attempted. URL validation requires explicit user consent.",
    target,
    privacyGate: runtimePlan.privacyGate,
    runtimePlan,
    packageDoctor: null,
    runtimeAttempts: [],
    totals: { resources: 0, error: 0, warning: 0, information: 0 },
    results: [],
    warnings: ["URL validation is blocked until explicit consent is given."],
    nextActions: ["Confirm whether this URL may be accessed and whether it can contain PHI."],
  }, 2);
}

let targetStat;
try {
  targetStat = await stat(target);
} catch (error) {
  await finish({
    ...createResultContract({
      tool: "validate",
      mode: "input-error",
      ok: false,
      validationDepth: "none",
    }),
    target,
    error: `Cannot access target: ${error.message}`,
    warnings: [],
    nextActions: ["Confirm that the target exists and is readable."],
  }, 2);
}

function runJsonScript(script, args) {
  return runJsonProcess(process.execPath, [script, ...args]);
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
  const result = runProcess(command, ["validate-file", target, "--format", "json"], {
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
  if (result.timedOut) {
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
      ...createResultContract({
        tool: "validate",
        mode: "records-cli",
        ok: totals.error === 0,
        privacyBoundary: "local-process-only",
        fhirVersion: normalizedFhirVersion(detectorOutput?.fhirVersions),
        validationDepth: "records-cli-configuration-dependent",
        profilesLoaded: [],
        terminologyMode: "records-cli-configuration-dependent",
        referenceMode: "records-cli-configuration-dependent",
      }),
      scope: "Local Records CLI validation. Profile, terminology, and invariant coverage depend on the CLI/project configuration.",
      target,
      detector,
      privacyGate: runtimePlan.privacyGate,
      runtimePlan,
      packageDoctor,
      runtimeAttempts,
      totals,
      results: [recordsCliRun.normalized],
      warnings: detectorOutput?.warnings || [],
      nextActions: totals.error
        ? ["Review the reported issues and re-run validation after safe fixes."]
        : ["Record the CLI configuration before making profile-aware conformance claims."],
    }, totals.error > 0 ? 1 : 0);
  }
}

const unsupportedVersions = unsupportedDeclaredFhirVersions(detectorOutput?.fhirVersions);
if (unsupportedVersions.length) {
  await finish({
    ...createResultContract({
      tool: "validate",
      mode: "blocked-unsupported-fhir-version",
      ok: false,
      privacyBoundary: "local-filesystem-only",
      fhirVersion: normalizedFhirVersion(detectorOutput.fhirVersions),
      validationDepth: "blocked",
    }),
    scope: "The bundled structural fallback is FHIR R4-only and did not validate this project.",
    target,
    detector,
    privacyGate: runtimePlan.privacyGate,
    runtimePlan,
    packageDoctor,
    runtimeAttempts,
    totals: { resources: 0, error: 1, warning: 0, information: 0 },
    results: [],
    warnings: [`Unsupported structural-fallback FHIR version signal(s): ${unsupportedVersions.join(", ")}.`],
    nextActions: ["Use a profile-aware validator configured for the project's declared FHIR version."],
  }, 2);
}

let scanStats = null;
if (targetStat.isDirectory()) {
  const scan = await scanFiles(target, {
    include: (file) => file.endsWith(".json"),
    maxFiles,
    maxDirectories: maxScanDirectories,
    maxEntries: maxScanEntries,
    maxDepth: 12,
  });
  files = scan.files;
  scanStats = scan.stats;
} else {
  files = [target];
}

const results = [];
for (const file of files) {
  // Only validate JSON that is actually a FHIR resource.
  try {
    const parsed = await readJsonFileLimited(file);
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
  ...createResultContract({
    tool: "validate",
    mode: "structural-fallback-orchestrated",
    ok: totals.error === 0,
    privacyBoundary: "local-filesystem-only",
    fhirVersion: normalizedFhirVersion(detectorOutput?.fhirVersions) === "unknown"
      ? "4.0.1-rules; input-version-unknown"
      : normalizedFhirVersion(detectorOutput?.fhirVersions),
    validationDepth: "structural-r4",
    profilesLoaded: [],
    terminologyMode: "not-checked",
    referenceMode: "contained-and-intra-bundle-only",
  }),
  scope: "Local structural triage only. Not profile-, terminology-, invariant-, or cross-document-reference-aware.",
  target,
  detector,
  privacyGate: runtimePlan.privacyGate,
  runtimePlan,
  packageDoctor,
  runtimeAttempts,
  scan: scanStats,
  totals,
  results,
  warnings: [
    ...(detectorOutput?.warnings || []),
    ...(scanStats?.truncated ? ["Directory scan reached a safety limit; validation coverage is partial."] : []),
  ],
  nextActions: totals.error
    ? ["Apply only mechanical fixes, then re-run validation.", "Use a profile-aware runtime for full conformance."]
    : ["Use a profile-aware runtime for full conformance before claiming IG compliance."],
}, totals.error > 0 ? 1 : 0);
