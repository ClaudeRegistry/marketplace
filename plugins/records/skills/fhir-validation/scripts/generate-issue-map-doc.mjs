#!/usr/bin/env node
// Regenerates the issue-code table in references/operationoutcome-map.md from
// scripts/lib/operationoutcome-issues.mjs (the single source of truth).
//
//   node generate-issue-map-doc.mjs          # rewrite the markdown table
//   node generate-issue-map-doc.mjs --check  # exit 1 if the table is stale
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { issueCodes } from "./lib/operationoutcome-issues.mjs";

const docPath = path.resolve(new URL("../references/operationoutcome-map.md", import.meta.url).pathname);
const beginMarker = "<!-- BEGIN GENERATED ISSUE TABLE -->";
const endMarker = "<!-- END GENERATED ISSUE TABLE -->";

function cell(value) {
  return String(value).replace(/\|/g, "\\|");
}

function buildTable() {
  const rows = [
    "| Code | Meaning | Safe fixability | Domain input needed | Setup/package suspicion |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const entry of issueCodes) {
    rows.push(`| \`${entry.code}\` | ${cell(entry.meaning)} | ${cell(entry.safeFixability)} | ${cell(entry.domainInput)} | ${cell(entry.setupSignal)} |`);
  }
  return rows.join("\n");
}

const current = await readFile(docPath, "utf8");
const begin = current.indexOf(beginMarker);
const end = current.indexOf(endMarker);
if (begin === -1 || end === -1 || end < begin) {
  console.error(`Markers ${beginMarker} / ${endMarker} not found in ${docPath}.`);
  process.exit(2);
}

const next = `${current.slice(0, begin + beginMarker.length)}\n${buildTable()}\n${current.slice(end)}`;

if (process.argv.includes("--check")) {
  if (next !== current) {
    console.error("operationoutcome-map.md is stale; run generate-issue-map-doc.mjs.");
    process.exit(1);
  }
  console.log("Issue map doc is in sync.");
} else {
  await writeFile(docPath, next, "utf8");
  console.log("Regenerated operationoutcome-map.md issue table.");
}
