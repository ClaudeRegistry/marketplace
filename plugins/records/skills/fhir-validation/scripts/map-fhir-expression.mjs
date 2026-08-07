#!/usr/bin/env node
// CLI wrapper around lib/fhirpath-pointer.mjs. Maps a FHIRPath-like expression
// (as emitted in OperationOutcome.issue.expression) to a JSON Pointer.
import { mapExpression } from "./lib/fhirpath-pointer.mjs";
import { createResultContract } from "./lib/result-contract.mjs";

const expression = process.argv[2];
if (!expression) {
  console.error("Usage: map-fhir-expression.mjs '<FHIRPath-like expression>'");
  process.exit(2);
}

console.log(JSON.stringify({
  ...createResultContract({
    tool: "map-fhir-expression",
    mode: "expression-mapping",
    privacyBoundary: "local-argument-only",
    validationDepth: "expression-to-pointer",
  }),
  ...mapExpression(expression),
  warnings: [],
  nextActions: ["Resolve partial pointers against the concrete instance and profile before editing."],
}, null, 2));
