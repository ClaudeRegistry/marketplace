#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const inputPath = process.argv[2];
const text = inputPath ? await readFile(inputPath, "utf8") : await new Promise((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { data += chunk; });
  process.stdin.on("end", () => resolve(data));
});

const highRiskTypes = new Set(["Patient", "Person", "RelatedPerson", "Practitioner"]);
const directSensitiveKeys = new Set(["id", "value", "text", "display", "family", "given", "birthDate", "line", "city", "district", "state", "postalCode", "country"]);

function riskForTypes(types) {
  if (Object.keys(types).some((type) => highRiskTypes.has(type))) return "high";
  if (Object.keys(types).some((type) => ["Bundle", "Encounter", "Observation", "DiagnosticReport", "Condition"].includes(type))) return "medium";
  return "low";
}

function collect(resource, summary) {
  const type = resource?.resourceType || "unknown";
  summary.resourceTypes[type] = (summary.resourceTypes[type] || 0) + 1;
  if (resource?.id) summary.idsRedacted += 1;
  for (const profile of Array.isArray(resource?.meta?.profile) ? resource.meta.profile : []) {
    summary.metaProfiles[profile] = (summary.metaProfiles[profile] || 0) + 1;
  }
  for (const identifier of Array.isArray(resource?.identifier) ? resource.identifier : []) {
    const system = identifier.system || "(missing-system)";
    summary.identifierSystems[system] = (summary.identifierSystems[system] || 0) + 1;
    if (identifier.value) summary.identifierValuesRedacted += 1;
  }
  JSON.stringify(resource, (key, value) => {
    if (key === "reference" && typeof value === "string") {
      summary.references[value.replace(/\/[^/]+$/, "/[redacted]")] = (summary.references[value.replace(/\/[^/]+$/, "/[redacted]")] || 0) + 1;
    }
    if (directSensitiveKeys.has(key) && value != null && typeof value !== "object") summary.fieldsRedacted += 1;
    return value;
  });
  for (const contained of Array.isArray(resource?.contained) ? resource.contained : []) collect(contained, summary);
}

let parsed;
try {
  parsed = JSON.parse(text);
} catch (error) {
  console.error(`Invalid JSON: ${error.message}`);
  process.exit(1);
}

const summary = {
  schemaVersion: 1,
  resourceType: parsed.resourceType || "unknown",
  resourceTypes: {},
  metaProfiles: {},
  identifierSystems: {},
  identifierValuesRedacted: 0,
  idsRedacted: 0,
  fieldsRedacted: 0,
  references: {},
  containedResourcesCounted: 0,
  issueCount: Array.isArray(parsed.issue) ? parsed.issue.length : undefined,
  entryCount: parsed.resourceType === "Bundle" && Array.isArray(parsed.entry) ? parsed.entry.length : undefined,
};

if (parsed.resourceType === "Bundle" && Array.isArray(parsed.entry)) {
  collect(parsed, summary);
  for (const entry of parsed.entry) {
    if (entry?.resource) collect(entry.resource, summary);
  }
} else {
  collect(parsed, summary);
}

summary.containedResourcesCounted = Object.values(summary.resourceTypes).reduce((sum, count) => sum + count, 0) - (parsed.resourceType === "Bundle" ? (summary.entryCount || 0) + 1 : 1);
summary.privacyRiskLevel = riskForTypes(summary.resourceTypes);
summary.references = Object.fromEntries(Object.entries(summary.references).sort(([a], [b]) => a.localeCompare(b)));

console.log(JSON.stringify(summary, null, 2));
