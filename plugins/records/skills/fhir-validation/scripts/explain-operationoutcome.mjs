#!/usr/bin/env node
import { issueByCode, unknownIssue } from "./lib/operationoutcome-issues.mjs";
import { createResultContract } from "./lib/result-contract.mjs";
import { readStdinLimited, readTextFileLimited } from "./lib/safe-io.mjs";

const file = process.argv[2];
let text;
try {
  text = file ? await readTextFileLimited(file) : await readStdinLimited();
} catch (error) {
  console.error(`Cannot read input: ${error.message}`);
  process.exit(2);
}

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
  ...createResultContract({
    tool: "explain-operationoutcome",
    mode: "issue-explanation",
    ok: !issues.some((issue) => ["fatal", "error"].includes(issue.severity)),
    privacyBoundary: "local-input-only",
    validationDepth: "operationoutcome-analysis",
  }),
  resourceType: "OperationOutcome",
  issueCount: issues.length,
  severityCounts,
  issues,
  warnings: [],
  nextActions: ["Apply only fixes classified as mechanically safe; request domain input for clinical values or policy."],
}, null, 2));
