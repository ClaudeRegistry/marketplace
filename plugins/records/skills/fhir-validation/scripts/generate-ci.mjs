#!/usr/bin/env node
import { createResultContract } from "./lib/result-contract.mjs";

const mode = process.argv.includes("--api") ? "api" : (process.argv.includes("--sushi") ? "sushi" : "local");
const dirArgIndex = process.argv.findIndex((arg) => arg === "--dir");
const resourceDir = dirArgIndex >= 0 ? process.argv[dirArgIndex + 1] : "./examples";
const upload = process.argv.includes("--upload-artifact");
const recordsCliVersion = "0.1.1";
const sushiVersion = "3.20.0";

if (!resourceDir || resourceDir.length > 500 || /[\r\n\0]/.test(resourceDir) || resourceDir.includes("${{")) {
  console.error("--dir must be a single path without control characters or GitHub expression syntax.");
  process.exit(2);
}

function yamlSingleQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const steps = [
  "      - uses: actions/checkout@v5",
  "      - uses: actions/setup-node@v5",
  "        with:",
  "          node-version: 24",
];

if (mode === "sushi") {
  steps.push(
    "      - name: Install FSH and Records tooling",
    `        run: npm install -g fsh-sushi@${sushiVersion} @records-fhir/cli@${recordsCliVersion}`,
    "      - name: Build FSH artifacts",
    "        run: sushi .",
    "      - name: Validate generated resources",
    '        run: records validate-file "$FHIR_RESOURCE_DIR" --format junit',
  );
} else {
  steps.push(
    "      - name: Install Records CLI",
    `        run: npm install -g @records-fhir/cli@${recordsCliVersion}`,
  );
  if (mode === "api") {
    steps.push(
      "      - name: Validate FHIR resources with Records API",
      "        env:",
      "          RECORDS_API_URL: ${{ secrets.RECORDS_API_URL }}",
      "          RECORDS_API_KEY: ${{ secrets.RECORDS_API_KEY }}",
      '        run: records --api-url "$RECORDS_API_URL" --auth-token "$RECORDS_API_KEY" validate-file "$FHIR_RESOURCE_DIR" --format junit',
    );
  } else {
    steps.push(
      "      - name: Validate FHIR resources",
      '        run: records validate-file "$FHIR_RESOURCE_DIR" --format junit',
    );
  }
}

if (upload) {
  steps.push(
    "      - name: Upload validation report",
    "        if: always()",
    "        uses: actions/upload-artifact@v4",
    "        with:",
    "          name: records-validation-report",
    "          path: records-validation.xml",
  );
}

const workflow = `name: FHIR Validation

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  records-validate:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      FHIR_RESOURCE_DIR: ${yamlSingleQuote(resourceDir)}
    steps:
${steps.join("\n")}
`;

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({
    ...createResultContract({
      tool: "generate-ci",
      mode: `github-actions-${mode}`,
      privacyBoundary: mode === "api" ? "hosted-api-requires-explicit-consent" : "local-validation",
      validationDepth: mode === "sushi" ? "sushi-build-plus-records-cli" : "records-cli-configuration-dependent",
      terminologyMode: "runtime-configuration-dependent",
      referenceMode: "runtime-configuration-dependent",
    }),
    artifact: {
      mediaType: "application/yaml",
      suggestedPath: ".github/workflows/fhir-validation.yml",
      content: workflow,
    },
    warnings: [
      ...(mode === "api" ? ["API-backed validation can expose PHI; use only with explicit approval and appropriate secrets."] : []),
      ...(upload ? ["Verify that uploaded reports cannot contain PHI before enabling artifact upload."] : []),
    ],
    nextActions: ["Review the generated workflow against existing project conventions, then validate it locally."],
  }, null, 2));
} else {
  console.log(workflow);
}
