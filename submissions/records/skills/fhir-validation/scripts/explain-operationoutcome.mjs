#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { issueByCode, unknownIssue } from "./lib/operationoutcome-issues.mjs";

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
  const mapped = issueByCode[code] || unknownIssue;
  return {
    index,
    severity: issue.severity || "unknown",
    code,
    expression: issue.expression || issue.location || [],
    diagnostics: issue.diagnostics || null,
    meaning: mapped.meaning,
    safeFixability: mapped.safeFixability,
    domainInput: mapped.domainInput,
    setupOrPackageSignal: mapped.setupSignal,
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
