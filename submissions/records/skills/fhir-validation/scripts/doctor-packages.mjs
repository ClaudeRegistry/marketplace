#!/usr/bin/env node
import { stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPackageDoctor } from "./lib/package-doctor.mjs";

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

const result = spawnSync(process.execPath, [detectorScript, root], { encoding: "utf8" });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Detector failed.");
  process.exit(2);
}

let detector;
try {
  detector = JSON.parse(result.stdout);
} catch (error) {
  console.error(`Detector output was not JSON: ${error.message}`);
  process.exit(2);
}

const doctor = buildPackageDoctor(detector);
console.log(JSON.stringify({
  schemaVersion: 1,
  target,
  root,
  projectType: detector.projectType,
  privacyRiskLevel: detector.privacyRiskLevel,
  ...doctor,
}, null, 2));

process.exit(doctor.maxSeverity === "error" ? 1 : 0);
