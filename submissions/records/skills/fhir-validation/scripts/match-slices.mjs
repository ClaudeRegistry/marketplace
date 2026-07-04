#!/usr/bin/env node
// Instance-based slice matching, completing the Firely/HL7 slicing workflow.
//
// Given a profile StructureDefinition and an instance resource, evaluate each
// sliced element's discriminator(s) against the instance array entries and
// report which entry matches which named slice. This is what a profile-aware
// validator does internally to attribute slicing issues to a specific slice;
// here it runs structurally so the agent can map a `slicing` OperationOutcome
// issue (or a repair) to the right array index without guessing.
//
// Supports discriminator types `value` and `pattern` backed by fixed[x] /
// pattern[x] constraints. `type`, `profile`, and `exists` discriminators are
// reported as caveats because they need StructureDefinition/type resolution.
//
// Usage: match-slices.mjs <profile-structuredefinition.json> <instance.json>
import { readFile } from "node:fs/promises";

const [profilePath, instancePath] = [process.argv[2], process.argv[3]];
if (!profilePath || !instancePath) {
  console.error("Usage: match-slices.mjs <profile-structuredefinition.json> <instance.json>");
  process.exit(2);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

const profile = await readJson(profilePath);
const instance = await readJson(instancePath);
if (profile.resourceType !== "StructureDefinition") {
  console.error("First argument must be a StructureDefinition.");
  process.exit(2);
}

const elements = (profile.differential?.element?.length ? profile.differential.element : profile.snapshot?.element) || [];

// Pull a fixed[x]/pattern[x] value off an element definition.
function fixedOrPattern(element) {
  for (const [key, value] of Object.entries(element)) {
    if (key.startsWith("fixed") || key.startsWith("pattern")) return value;
  }
  return undefined;
}

// Navigate a dotted path within a plain object/value, descending into arrays,
// collecting the terminal primitive values.
function collectValues(node, dottedPath) {
  let current = [node];
  for (const segment of dottedPath.split(".")) {
    const next = [];
    for (const item of current) {
      if (item == null) continue;
      if (Array.isArray(item)) {
        for (const sub of item) if (sub && typeof sub === "object") next.push(sub[segment]);
      } else if (typeof item === "object") {
        next.push(item[segment]);
      }
    }
    current = next.flatMap((value) => (Array.isArray(value) ? value : [value]));
  }
  return current.filter((value) => value !== undefined && value !== null && typeof value !== "object");
}

// Expected discriminator value for a slice: a direct child constraint
// (slice.discriminatorPath) or a pattern/fixed on the slice root navigated by
// the discriminator path.
function sliceExpectedValue(slicedPath, sliceName, discriminatorPath) {
  const childId = `${slicedPath}:${sliceName}.${discriminatorPath}`;
  for (const element of elements) {
    if (element.id === childId) {
      const value = fixedOrPattern(element);
      if (value !== undefined && typeof value !== "object") return value;
    }
  }
  const rootId = `${slicedPath}:${sliceName}`;
  for (const element of elements) {
    if (element.id === rootId || (element.sliceName === sliceName && element.path === slicedPath)) {
      const pattern = fixedOrPattern(element);
      if (pattern && typeof pattern === "object") {
        const found = collectValues(pattern, discriminatorPath);
        if (found.length) return found[0];
      }
    }
  }
  return undefined;
}

function jsonPointerForPath(slicedPath) {
  // Strip the resource type and turn dots into pointer segments.
  const relative = slicedPath.replace(/^[A-Z][A-Za-z0-9]*\./, "");
  return `/${relative.split(".").join("/")}`;
}

const slicedElements = [];
const caveats = [];

for (const element of elements) {
  if (!element.slicing) continue;
  const slicedPath = element.path;
  const discriminators = Array.isArray(element.slicing.discriminator) ? element.slicing.discriminator : [];
  const sliceNames = elements.filter((candidate) => candidate.sliceName && candidate.path === slicedPath).map((candidate) => candidate.sliceName);

  const supported = discriminators.filter((discriminator) => ["value", "pattern"].includes(discriminator.type));
  for (const discriminator of discriminators) {
    if (!["value", "pattern"].includes(discriminator.type)) {
      caveats.push(`Discriminator type '${discriminator.type}' at ${slicedPath} needs StructureDefinition/type resolution; not evaluated.`);
    }
  }

  // Build per-slice expected values for each supported discriminator.
  const sliceExpectations = {};
  for (const sliceName of sliceNames) {
    sliceExpectations[sliceName] = supported.map((discriminator) => ({
      path: discriminator.path,
      value: sliceExpectedValue(slicedPath, sliceName, discriminator.path),
    }));
  }

  const basePointer = jsonPointerForPath(slicedPath);
  const relative = slicedPath.replace(/^[A-Z][A-Za-z0-9]*\./, "");
  const arrayValue = relative.includes(".") ? undefined : instance[relative];
  const entries = [];
  const slices = {};
  const unmatched = [];

  if (!Array.isArray(arrayValue)) {
    if (relative.includes(".")) caveats.push(`Sliced element ${slicedPath} is nested; only top-level sliced arrays are evaluated.`);
  } else {
    arrayValue.forEach((entry, index) => {
      let matchedSlice = null;
      for (const sliceName of sliceNames) {
        const expectations = sliceExpectations[sliceName];
        if (!expectations.length || expectations.some((expectation) => expectation.value === undefined)) continue;
        const allMatch = expectations.every((expectation) => collectValues(entry, expectation.path).includes(expectation.value));
        if (allMatch) { matchedSlice = sliceName; break; }
      }
      entries.push({ index, jsonPointer: `${basePointer}/${index}`, sliceName: matchedSlice });
      if (matchedSlice) (slices[matchedSlice] ||= []).push(index);
      else unmatched.push(index);
    });
  }

  slicedElements.push({
    path: slicedPath,
    jsonPointer: basePointer,
    rules: element.slicing.rules || null,
    discriminator: discriminators.map((discriminator) => ({ type: discriminator.type || null, path: discriminator.path || null })),
    sliceNames,
    entries,
    slices,
    unmatched,
  });
}

console.log(JSON.stringify({
  schemaVersion: 1,
  profile: profile.url || null,
  instanceType: instance.resourceType || null,
  slicedElements,
  caveats,
}, null, 2));
