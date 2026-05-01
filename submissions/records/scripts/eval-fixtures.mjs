#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const repo = path.resolve(new URL("../../..", import.meta.url).pathname);
const plugin = path.join(repo, "plugins/records");
const failures = [];

function runJson(script, args, input = null) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: repo,
    input,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    failures.push(`${path.relative(repo, script)} failed: ${result.stderr || result.stdout}`);
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    failures.push(`${path.relative(repo, script)} output was not JSON: ${error.message}`);
    return null;
  }
}

async function snapshot(name) {
  return JSON.parse(await readFile(path.join(plugin, "eval-snapshots", name), "utf8"));
}

function stableDetection(value) {
  return {
    schemaVersion: value.schemaVersion,
    projectType: value.projectType,
    sourceDirs: value.sourceDirs,
    generatedDirs: value.generatedDirs,
    workflowFiles: value.workflowFiles,
    fhirVersions: value.fhirVersions,
    resourceTypes: value.resourceInventory.byResourceType,
    metaProfiles: value.resourceInventory.metaProfiles,
    privacyRiskLevel: value.privacyRiskLevel,
  };
}

function stableMapping(value) {
  return {
    schemaVersion: value.schemaVersion,
    generatedFile: value.generatedFile,
    resourceType: value.resource.resourceType,
    id: value.resource.id,
    topCandidate: value.candidates[0]?.file,
    topCandidateReasons: value.candidates[0]?.reasons || [],
  };
}

function stableRedaction(value) {
  return {
    schemaVersion: value.schemaVersion,
    resourceType: value.resourceType,
    resourceTypes: value.resourceTypes,
    identifierSystems: value.identifierSystems,
    identifierValuesRedacted: value.identifierValuesRedacted,
    idsRedacted: value.idsRedacted,
    privacyRiskLevel: value.privacyRiskLevel,
  };
}

const detector = path.join(plugin, "skills/fhir-validation/scripts/detect-fhir-project.mjs");
const mapper = path.join(plugin, "skills/fhir-validation/scripts/map-generated-to-fsh.mjs");
const redactor = path.join(plugin, "skills/fhir-validation/scripts/redact-fhir-summary.mjs");
const miniIg = path.join(plugin, "fixtures/mini-ig");

const detection = runJson(detector, [miniIg]);
if (detection) {
  const expected = [
    detection.projectType === "fsh-ig",
    detection.sourceDirs.includes("input/fsh"),
    detection.generatedDirs.includes("fsh-generated/resources"),
    detection.packageDependencies.sushi["hl7.fhir.r4.core"] === "4.0.1",
    detection.resourceInventory.metaProfiles["https://example.org/fhir/records-mini/StructureDefinition/records-mini-observation"] === 1,
  ];
  if (expected.some((value) => !value)) failures.push("Detector fixture expectations failed.");
}
if (detection && JSON.stringify(stableDetection(detection), null, 2) !== JSON.stringify(await snapshot("detector-mini-ig.json"), null, 2)) {
  failures.push("Detector snapshot changed.");
}

const mapping = runJson(mapper, [
  path.join(miniIg, "fsh-generated/resources/Observation-MiniObservationMissingCode.json"),
  miniIg,
]);
if (mapping) {
  if (mapping.resource.resourceType !== "Observation") failures.push("Mapper did not read generated Observation.");
  if (!mapping.candidates[0]?.reasons?.length) failures.push("Mapper did not explain candidate reasons.");
}
if (mapping && JSON.stringify(stableMapping(mapping), null, 2) !== JSON.stringify(await snapshot("generated-to-fsh.json"), null, 2)) {
  failures.push("Generated-to-FSH snapshot changed.");
}

const summary = runJson(redactor, [path.join(plugin, "fixtures/patient-with-phi.json")]);
if (summary) {
  if (summary.idsRedacted !== 1) failures.push("Redactor did not redact Patient id.");
  if (JSON.stringify(summary).includes("Jane")) failures.push("Redactor leaked patient name.");
}
if (summary && JSON.stringify(stableRedaction(summary), null, 2) !== JSON.stringify(await snapshot("redacted-patient.json"), null, 2)) {
  failures.push("Redacted Patient snapshot changed.");
}

const outcome = runJson(redactor, [path.join(plugin, "fixtures/operationoutcome-required.json")]);
if (outcome) {
  if (outcome.resourceType !== "OperationOutcome" || outcome.issueCount !== 2) failures.push("Redactor did not summarize OperationOutcome.");
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Fixture evals passed.");
