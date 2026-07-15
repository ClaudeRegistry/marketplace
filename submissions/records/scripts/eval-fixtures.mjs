#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const plugin = path.resolve(scriptDir, "..");
const marketplaceRepo = path.resolve(plugin, "../..");
const isCanonicalMarketplaceLayout = path.basename(plugin) === "records"
  && path.basename(path.dirname(plugin)) === "plugins"
  && existsSync(path.join(marketplaceRepo, ".claude-plugin/marketplace.json"));
const repo = isCanonicalMarketplaceLayout ? marketplaceRepo : plugin;
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

const validator = path.join(plugin, "skills/fhir-validation/scripts/validate-structural.mjs");
const validatorRun = spawnSync(process.execPath, [validator, path.join(plugin, "fixtures/invalid-observation.json")], { cwd: repo, encoding: "utf8" });
let validatorOutput = null;
try {
  validatorOutput = JSON.parse(validatorRun.stdout);
} catch (error) {
  failures.push(`Structural validator output was not JSON: ${error.message}`);
}
if (validatorOutput) {
  const stableValidation = {
    schemaVersion: validatorOutput.schemaVersion,
    mode: validatorOutput.mode,
    resourceType: validatorOutput.resourceType,
    exitCode: validatorRun.status,
    summary: validatorOutput.summary,
    issues: validatorOutput.operationOutcome.issue.map((entry) => ({
      severity: entry.severity,
      code: entry.code,
      expression: entry.expression[0],
    })),
  };
  if (JSON.stringify(stableValidation, null, 2) !== JSON.stringify(await snapshot("structural-invalid-observation.json"), null, 2)) {
    failures.push("Structural validator snapshot changed.");
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Fixture evals passed.");
