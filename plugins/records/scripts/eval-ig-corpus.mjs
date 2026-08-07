#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runJsonProcess } from "../skills/fhir-validation/scripts/lib/process-runner.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const plugin = path.resolve(scriptDir, "..");
const corpus = path.join(plugin, "fixtures/ig-corpus");
const manifest = JSON.parse(await readFile(path.join(corpus, "manifest.json"), "utf8"));
const validator = path.join(plugin, "skills/fhir-validation/scripts/validate-structural.mjs");
const failures = [];

for (const testCase of manifest.cases || []) {
  const file = path.join(corpus, testCase.file);
  const bytes = await readFile(file);
  const checksum = createHash("sha256").update(bytes).digest("hex");
  if (checksum !== testCase.sha256) failures.push(`${testCase.file} checksum differs from its pinned corpus manifest.`);

  const resource = JSON.parse(bytes.toString("utf8"));
  if (resource.resourceType !== testCase.resourceType) failures.push(`${testCase.file} resourceType drifted.`);
  if (!resource.meta?.profile?.includes(testCase.profile)) failures.push(`${testCase.file} no longer declares the expected profile.`);

  const validation = runJsonProcess(process.execPath, [validator, file]);
  if (validation.status !== 0) {
    failures.push(`${testCase.file} failed R4 structural triage: ${validation.stderr || validation.stdout}`);
    continue;
  }
  if (
    validation.parsed?.schemaVersion !== 2
    || validation.parsed?.tool !== "validate-structural"
    || validation.parsed?.capabilities?.validationDepth !== "structural-r4"
  ) {
    failures.push(`${testCase.file} did not return the shared v2 capability contract.`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Published IG corpus passed for ${manifest.cases.length} pinned R4 examples.`);
