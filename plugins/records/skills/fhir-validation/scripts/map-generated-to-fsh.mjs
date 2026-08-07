#!/usr/bin/env node
import { stat } from "node:fs/promises";
import path from "node:path";
import { createResultContract } from "./lib/result-contract.mjs";
import { readJsonFileLimited, readTextFileLimited, scanFiles } from "./lib/safe-io.mjs";

const generatedPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
const root = path.resolve(process.argv[3] || process.cwd());

if (!generatedPath) {
  console.error("Usage: map-generated-to-fsh.mjs <fsh-generated/resources/*.json> [project-root]");
  process.exit(2);
}

async function readJson(file) {
  return await readJsonFileLimited(file);
}

function declarationNames(text) {
  const declarations = [];
  for (const match of text.matchAll(/^(Profile|Extension|Instance|ValueSet|CodeSystem|Logical|Resource|Invariant|RuleSet):\s*([^\s]+)/gm)) {
    declarations.push({ kind: match[1], name: match[2] });
  }
  return declarations;
}

function scoreCandidate(text, resource, file) {
  const reasons = [];
  const tokens = [
    ["id", resource.id],
    ["name", resource.name],
    ["url", resource.url],
    ["type", resource.type],
  ].filter(([, value]) => typeof value === "string" && value.length);

  for (const [field, value] of tokens) {
    if (text.includes(value)) reasons.push(`matches ${field}: ${value}`);
  }

  const declarations = declarationNames(text);
  for (const declaration of declarations) {
    if ([resource.id, resource.name].includes(declaration.name)) {
      reasons.push(`matches ${declaration.kind} declaration: ${declaration.name}`);
    }
  }

  const profileUrl = resource.meta?.profile?.find?.((value) => typeof value === "string");
  if (profileUrl && text.includes(profileUrl)) reasons.push(`matches meta.profile: ${profileUrl}`);
  if (resource.baseDefinition && text.includes(resource.baseDefinition)) reasons.push(`matches baseDefinition: ${resource.baseDefinition}`);

  return {
    file,
    score: reasons.length,
    reasons,
    declarations,
  };
}

const resource = await readJson(generatedPath);
const fshRoot = path.join(root, "input/fsh");
let scan = await scanFiles(fshRoot, {
  include: (file) => file.endsWith(".fsh"),
  excludeNames: ["node_modules", ".git", "fsh-generated", "output", "input-cache", ".fhir"],
  maxFiles: 500,
  maxDirectories: 500,
  maxEntries: 10_000,
  maxDepth: 12,
});
let fshFiles = scan.files;

if (!fshFiles.length) {
  scan = await scanFiles(root, {
    include: (file) => file.endsWith(".fsh"),
    excludeNames: ["node_modules", ".git", "fsh-generated", "output", "input-cache", ".fhir"],
    maxFiles: 500,
    maxDirectories: 500,
    maxEntries: 10_000,
    maxDepth: 12,
  });
  fshFiles = scan.files;
}

const candidates = [];
for (const file of fshFiles) {
  const text = await readTextFileLimited(file);
  const candidate = scoreCandidate(text, resource, path.relative(root, file));
  if (candidate.score > 0) candidates.push(candidate);
}

candidates.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

const generatedStat = await stat(generatedPath);
const result = {
  ...createResultContract({
    tool: "map-generated-to-fsh",
    mode: "source-mapping",
    privacyBoundary: "local-filesystem-only",
    fhirVersion: resource.fhirVersion || "unknown",
    validationDepth: "source-attribution",
    profilesLoaded: Array.isArray(resource.meta?.profile) ? resource.meta.profile : [],
  }),
  root,
  scan: scan.stats,
  generatedFile: path.relative(root, generatedPath),
  generatedFileBytes: generatedStat.size,
  resource: {
    resourceType: resource.resourceType || null,
    id: resource.id || null,
    url: resource.url || null,
    name: resource.name || null,
    type: resource.type || null,
    baseDefinition: resource.baseDefinition || null,
    metaProfiles: Array.isArray(resource.meta?.profile) ? resource.meta.profile : [],
  },
  fshSearchRoot: path.relative(root, fshRoot),
  candidates,
  warnings: scan.stats.truncated ? ["FSH source scan reached a safety limit; candidates may be incomplete."] : [],
  nextActions: candidates.length
    ? ["Review the highest-confidence source, make only mechanical changes, rebuild with SUSHI, and revalidate."]
    : ["Find the durable source before changing generated JSON."],
  recommendation: candidates.length
    ? "Edit the highest-confidence FSH source only for mechanical fixes, rebuild with SUSHI, then revalidate."
    : "No matching FSH source found. Do not edit generated JSON unless no durable source exists or the user explicitly asks for a direct generated-artifact patch.",
};

console.log(JSON.stringify(result, null, 2));
