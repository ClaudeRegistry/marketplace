#!/usr/bin/env node
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const generatedPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
const root = path.resolve(process.argv[3] || process.cwd());

if (!generatedPath) {
  console.error("Usage: map-generated-to-fsh.mjs <fsh-generated/resources/*.json> [project-root]");
  process.exit(2);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

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
    else out.push(full);
  }
  return out;
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
let fshFiles = (await walk(fshRoot)).filter((file) => file.endsWith(".fsh"));

if (!fshFiles.length) {
  fshFiles = (await walk(root)).filter((file) => file.endsWith(".fsh"));
}

const candidates = [];
for (const file of fshFiles) {
  const text = await readFile(file, "utf8");
  const candidate = scoreCandidate(text, resource, path.relative(root, file));
  if (candidate.score > 0) candidates.push(candidate);
}

candidates.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

const generatedStat = await stat(generatedPath);
const result = {
  schemaVersion: 1,
  root,
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
  recommendation: candidates.length
    ? "Edit the highest-confidence FSH source only for mechanical fixes, rebuild with SUSHI, then revalidate."
    : "No matching FSH source found. Do not edit generated JSON unless no durable source exists or the user explicitly asks for a direct generated-artifact patch.",
};

console.log(JSON.stringify(result, null, 2));
