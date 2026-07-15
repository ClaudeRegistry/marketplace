#!/usr/bin/env node
// CLI wrapper around lib/fhirpath-pointer.mjs. Maps a FHIRPath-like expression
// (as emitted in OperationOutcome.issue.expression) to a JSON Pointer.
import { mapExpression } from "./lib/fhirpath-pointer.mjs";

const expression = process.argv[2];
if (!expression) {
  console.error("Usage: map-fhir-expression.mjs '<FHIRPath-like expression>'");
  process.exit(2);
}

console.log(JSON.stringify(mapExpression(expression), null, 2));
