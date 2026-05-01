#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const issueMap = {
  required: ["A mandatory element is missing.", "safe only when the value is mechanically implied", "domain input for clinical fields", "possible unexpected profile or stale generated artifact"],
  value: ["A value has the wrong datatype, cardinality, or format.", "safe for syntax-only shape fixes", "domain input when meaning changes", "possible FHIR version mismatch"],
  "code-invalid": ["A code is not allowed by the binding or enum.", "safe for obvious enum typos", "usually terminology/domain input", "likely terminology package or tx setup issue"],
  structure: ["The resource shape does not match the base resource or profile.", "safe for unambiguous path moves", "domain input for profile/slice intent", "likely wrong FHIR version/profile or stale generated StructureDefinition"],
  invariant: ["A FHIRPath invariant failed.", "sometimes safe for structural invariants", "often domain or IG policy input", "possible stale dependency/profile"],
  processing: ["The validator could not process input or dependencies.", "fix setup first", "domain input only after setup is ruled out", "very likely package, terminology, cache, or runtime setup"],
  "not-found": ["A referenced resource, profile, package, or endpoint was not found.", "safe for local package/path config fixes", "needed before changing references/canonicals", "very likely dependency or canonical resolution issue"],
  duplicate: ["Duplicate ids, canonicals, slices, or artifacts were detected.", "safe when one copy is clearly stale", "needed to pick authoritative artifact", "likely partial rebuild or duplicate FSH/example"],
  forbidden: ["An element or operation is not allowed.", "safe to remove clearly accidental fields", "needed for clinical/business/server policy fields", "possible wrong profile or endpoint"],
  incomplete: ["Validation lacks enough data or context.", "safe for setup/config fixes", "needed if source data is missing", "common missing package, terminology, or partial Bundle"],
  "business-rule": ["A project, profile, or server policy failed.", "rarely auto-fixable", "usually required", "possible wrong profile/server context"],
  "profile-unknown": ["A profile canonical could not be resolved.", "safe to fix dependencies/config", "needed before changing canonical URLs", "very likely package or build setup"],
  slicing: ["A repeating element did not match the expected slice.", "safe only for mechanical slice/discriminator fixes", "often needed to choose correct slice", "likely stale generated profile or missing dependency"],
};

const file = process.argv[2];
const text = file ? await readFile(file, "utf8") : await new Promise((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { data += chunk; });
  process.stdin.on("end", () => resolve(data));
});

let outcome;
try {
  outcome = JSON.parse(text);
} catch (error) {
  console.error(`Invalid JSON: ${error.message}`);
  process.exit(1);
}

if (outcome.resourceType !== "OperationOutcome" || !Array.isArray(outcome.issue)) {
  console.error("Input must be a FHIR OperationOutcome with issue[].");
  process.exit(2);
}

const issues = outcome.issue.map((issue, index) => {
  const code = issue.code || "unknown";
  const mapped = issueMap[code] || ["Unknown or validator-specific issue code.", "unknown", "review needed", "check validator provenance"];
  return {
    index,
    severity: issue.severity || "unknown",
    code,
    expression: issue.expression || issue.location || [],
    diagnostics: issue.diagnostics || null,
    meaning: mapped[0],
    safeFixability: mapped[1],
    domainInput: mapped[2],
    setupOrPackageSignal: mapped[3],
  };
});

const severityCounts = issues.reduce((acc, issue) => {
  acc[issue.severity] = (acc[issue.severity] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({
  schemaVersion: 1,
  resourceType: "OperationOutcome",
  issueCount: issues.length,
  severityCounts,
  issues,
}, null, 2));
