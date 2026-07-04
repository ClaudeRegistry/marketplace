#!/usr/bin/env node
import { stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRuntimePlan, isUrlTarget } from "./lib/runtime-policy.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const detectorScript = path.join(scriptDir, "detect-fhir-project.mjs");
const target = process.argv[2] || ".";

function runDetector(root) {
  const result = spawnSync(process.execPath, [detectorScript, root], { encoding: "utf8" });
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
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

console.log(JSON.stringify(buildRuntimePlan(detector, { target }), null, 2));
