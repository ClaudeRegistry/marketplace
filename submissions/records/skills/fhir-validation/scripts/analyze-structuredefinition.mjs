#!/usr/bin/env node
// Analyze a FHIR StructureDefinition for the two things that most often break
// profile-aware validation in the HL7 reference validator, HAPI, and Firely:
//
//   1. Snapshot readiness. Constraint profiles must have a generated snapshot
//      (differential expanded against the base) before validation. A
//      differential-only profile causes misleading structure/slicing issues.
//   2. Slicing. Each sliced element is matched by its discriminator(s). Surfacing
//      the slice element paths, discriminators, and slice names lets a `slicing`
//      OperationOutcome issue be mapped to the right slice without guessing.
//
// This does not generate snapshots or evaluate discriminators against an
// instance; it reports the profile's declared structure so the agent can route
// the next step (regenerate snapshot, pick a slice, or fix FSH).
import { readFile } from "node:fs/promises";

const file = process.argv[2];
const text = file ? await readFile(file, "utf8") : await new Promise((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { data += chunk; });
  process.stdin.on("end", () => resolve(data));
});

let sd;
try {
  sd = JSON.parse(text);
} catch (error) {
  console.error(`Invalid JSON: ${error.message}`);
  process.exit(1);
}

if (sd.resourceType !== "StructureDefinition") {
  console.error("Input must be a FHIR StructureDefinition.");
  process.exit(2);
}

const snapshotElements = Array.isArray(sd.snapshot?.element) ? sd.snapshot.element : [];
const differentialElements = Array.isArray(sd.differential?.element) ? sd.differential.element : [];
// Slicing is authored in the differential; fall back to snapshot when needed.
const elements = differentialElements.length ? differentialElements : snapshotElements;

// Group declared slice names by element path.
const sliceNamesByPath = {};
for (const element of elements) {
  if (!element.sliceName) continue;
  const path = element.path || (element.id ? element.id.split(":")[0] : null);
  if (!path) continue;
  (sliceNamesByPath[path] ||= []).push(element.sliceName);
}

const slicing = [];
for (const element of elements) {
  if (!element.slicing) continue;
  const discriminator = Array.isArray(element.slicing.discriminator)
    ? element.slicing.discriminator.map((entry) => ({ type: entry.type || null, path: entry.path || null }))
    : [];
  slicing.push({
    path: element.path || null,
    rules: element.slicing.rules || null,
    ordered: Boolean(element.slicing.ordered),
    discriminator,
    slices: sliceNamesByPath[element.path] || [],
  });
}

const snapshotPresent = snapshotElements.length > 0;
const isConstraint = sd.derivation === "constraint";
const needsSnapshot = isConstraint && !snapshotPresent;

const caveats = [];
if (needsSnapshot) {
  caveats.push("Constraint profile without a snapshot; generate it with SUSHI, IG Publisher, or Firely before profile validation. Validators that expect a snapshot may misreport structure or slicing issues.");
}
for (const slice of slicing) {
  if (!slice.discriminator.length) {
    caveats.push(`Slicing at ${slice.path} has no discriminator; matching the correct slice depends on profile rules and instance data.`);
  }
}

console.log(JSON.stringify({
  schemaVersion: 1,
  resourceType: "StructureDefinition",
  url: sd.url || null,
  name: sd.name || null,
  id: sd.id || null,
  type: sd.type || null,
  kind: sd.kind || null,
  derivation: sd.derivation || null,
  baseDefinition: sd.baseDefinition || null,
  fhirVersion: sd.fhirVersion || null,
  snapshotPresent,
  snapshotElementCount: snapshotElements.length,
  differentialPresent: differentialElements.length > 0,
  differentialElementCount: differentialElements.length,
  needsSnapshot,
  slicing,
  caveats,
}, null, 2));
