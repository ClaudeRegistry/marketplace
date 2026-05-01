#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());

async function walk(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (["node_modules", ".git", "fsh-generated", "output", "input-cache"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}

function addCount(map, key) {
  if (!key) return;
  map[key] = (map[key] || 0) + 1;
}

const files = await walk(root);
const resources = [];
for (const file of files) {
  try {
    const resource = JSON.parse(await readFile(file, "utf8"));
    if (resource?.resourceType) resources.push({ file: path.relative(root, file), resource });
  } catch {
    // Ignore non-resource JSON.
  }
}

const byType = {};
const profilesByType = {};
const identifierSystemsByType = {};
const referenceTargets = {};
for (const { resource } of resources) {
  addCount(byType, resource.resourceType);
  profilesByType[resource.resourceType] ||= {};
  for (const profile of Array.isArray(resource.meta?.profile) ? resource.meta.profile : []) addCount(profilesByType[resource.resourceType], profile);
  identifierSystemsByType[resource.resourceType] ||= {};
  for (const identifier of Array.isArray(resource.identifier) ? resource.identifier : []) addCount(identifierSystemsByType[resource.resourceType], identifier.system || "(missing-system)");
  JSON.stringify(resource, (key, value) => {
    if (key === "reference" && typeof value === "string") addCount(referenceTargets, value.split("/")[0]);
    return value;
  });
}

const rules = [];
for (const [type, count] of Object.entries(byType)) {
  const profiles = Object.entries(profilesByType[type] || {}).filter(([, n]) => n === count);
  for (const [profile] of profiles) {
    rules.push({
      id: `profile-${type}`,
      confidence: count >= 3 ? "high" : "medium",
      reviewer: "technical",
      rule: `${type} resources should declare meta.profile ${profile}.`,
      evidence: { resourceType: type, matched: count, sampled: count },
      ciFit: "Records CLI or custom rule",
    });
  }
  const identifierSystems = Object.entries(identifierSystemsByType[type] || {}).filter(([, n]) => n >= 2);
  for (const [system, matched] of identifierSystems) {
    rules.push({
      id: `identifier-system-${type}`,
      confidence: matched === count ? "medium" : "low",
      reviewer: "domain",
      rule: `${type}.identifier.system commonly uses ${system}; treat as proposed local convention.`,
      evidence: { resourceType: type, matched, sampled: count },
      ciFit: "manual review or custom rule",
    });
  }
}

console.log(JSON.stringify({
  schemaVersion: 1,
  root,
  sampledResources: resources.length,
  resourceTypes: byType,
  referenceTargets,
  proposedRules: rules,
  caveat: "Rules are inferred from local examples and require review before becoming policy.",
}, null, 2));
