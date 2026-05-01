#!/usr/bin/env node
const expression = process.argv[2];
if (!expression) {
  console.error("Usage: map-fhir-expression.mjs '<FHIRPath-like expression>'");
  process.exit(2);
}

function toPointer(expr) {
  const withoutRoot = expr.replace(/^[A-Z][A-Za-z0-9]*\.?/, "");
  if (!withoutRoot) return "/";
  const parts = [];
  for (const raw of withoutRoot.split(".")) {
    const match = raw.match(/^([A-Za-z0-9_-]+)(?:\[(\d+|[A-Za-z0-9_-]+)\])?$/);
    if (!match) {
      parts.push(raw.replace(/\[.*$/, ""));
      continue;
    }
    parts.push(match[1]);
    if (match[2] && /^\d+$/.test(match[2])) parts.push(match[2]);
  }
  return `/${parts.map((part) => part.replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`;
}

console.log(JSON.stringify({
  schemaVersion: 1,
  expression,
  jsonPointer: toPointer(expression),
  caveat: "FHIRPath predicates and named slices may need profile/FSH context before editing.",
}, null, 2));
