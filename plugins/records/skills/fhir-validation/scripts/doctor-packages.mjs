#!/usr/bin/env node
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPackageDoctor } from "./lib/package-doctor.mjs";
import { createResultContract, normalizedFhirVersion } from "./lib/result-contract.mjs";
import { runJsonProcess } from "./lib/process-runner.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const detectorScript = path.join(scriptDir, "detect-fhir-project.mjs");
const target = process.argv[2] || ".";

let root = target;
try {
  const targetStat = await stat(target);
  if (!targetStat.isDirectory()) root = path.dirname(target);
} catch (error) {
  console.error(`Cannot inspect ${target}: ${error.message}`);
  process.exit(2);
}

const result = runJsonProcess(process.execPath, [detectorScript, root]);
if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Detector failed.");
  process.exit(2);
}

const detector = result.parsed;
if (!detector) {
  console.error("Detector output was not JSON.");
  process.exit(2);
}

const doctor = buildPackageDoctor(detector);
console.log(JSON.stringify({
  ...createResultContract({
    tool: "doctor-packages",
    mode: "package-diagnosis",
    ok: doctor.maxSeverity !== "error",
    privacyBoundary: "local-package-cache-only",
    fhirVersion: normalizedFhirVersion(detector.fhirVersions),
    validationDepth: "setup-diagnosis-only",
  }),
  target,
  root,
  projectType: detector.projectType,
  privacyRiskLevel: detector.privacyRiskLevel,
  ...doctor,
  warnings: detector.warnings || [],
  nextActions: doctor.findings
    .filter((finding) => finding.severity !== "information")
    .map((finding) => finding.remediation)
    .filter(Boolean),
}, null, 2));

process.exit(doctor.maxSeverity === "error" ? 1 : 0);
