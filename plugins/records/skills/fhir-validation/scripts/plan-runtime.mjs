#!/usr/bin/env node
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRuntimePlan, isUrlTarget } from "./lib/runtime-policy.mjs";
import { createResultContract, normalizedFhirVersion } from "./lib/result-contract.mjs";
import { runJsonProcess } from "./lib/process-runner.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const detectorScript = path.join(scriptDir, "detect-fhir-project.mjs");
const target = process.argv[2] || ".";

function runDetector(root) {
  const result = runJsonProcess(process.execPath, [detectorScript, root]);
  return result.status === 0 ? result.parsed : null;
}

let detector = null;
if (!isUrlTarget(target)) {
  try {
    const targetStat = await stat(target);
    detector = runDetector(targetStat.isDirectory() ? target : path.dirname(target));
  } catch {
    detector = null;
  }
}

const plan = buildRuntimePlan(detector, { target });
console.log(JSON.stringify({
  ...createResultContract({
    tool: "plan-runtime",
    mode: "runtime-planning",
    privacyBoundary: plan.privacyGate?.riskLevel === "high" ? "local-only-pending-consent" : "local-filesystem-only",
    fhirVersion: normalizedFhirVersion(detector?.fhirVersions),
    validationDepth: plan.selectedRuntime?.profileAware === "yes" ? "profile-aware" : "planning-only",
  }),
  ...plan,
  warnings: detector?.warnings || [],
  nextActions: plan.nextActions || detector?.recommendedOrder || [],
}, null, 2));
