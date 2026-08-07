#!/usr/bin/env node
import path from "node:path";
import { createResultContract } from "./lib/result-contract.mjs";
import { boundedEnvInt, readJsonFileLimited, scanFiles } from "./lib/safe-io.mjs";

const root = path.resolve(process.argv[2] || process.cwd());
const maxFiles = boundedEnvInt("RECORDS_QUALITY_MAX_FILES", 500, { max: 10_000 });

function addCount(map, key) {
  if (!key) return;
  map[key] = (map[key] || 0) + 1;
}

const scan = await scanFiles(root, {
  include: (file) => file.endsWith(".json"),
  excludeNames: ["node_modules", ".git", "fsh-generated", "output", "input-cache", ".fhir"],
  maxFiles,
  maxDirectories: 500,
  maxEntries: 10_000,
  maxDepth: 12,
});
const files = scan.files;
const resources = [];
for (const file of files) {
  try {
    const resource = await readJsonFileLimited(file);
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
  ...createResultContract({
    tool: "derive-quality-rules",
    mode: "local-rule-inference",
    privacyBoundary: "local-filesystem-only",
    validationDepth: "sample-pattern-analysis",
  }),
  root,
  scan: scan.stats,
  sampledResources: resources.length,
  resourceTypes: byType,
  referenceTargets,
  proposedRules: rules,
  warnings: [
    "Rules are inferred from local examples and require technical or domain review before becoming policy.",
    ...(scan.stats.truncated ? ["The scan reached a safety limit; inferred rules are based on a partial sample."] : []),
  ],
  nextActions: ["Review each proposed rule and reject conventions that are not backed by an explicit profile or domain decision."],
  caveat: "Rules are inferred from local examples and require review before becoming policy.",
}, null, 2));
