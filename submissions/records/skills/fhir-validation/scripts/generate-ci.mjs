#!/usr/bin/env node
const mode = process.argv.includes("--api") ? "api" : (process.argv.includes("--sushi") ? "sushi" : "local");
const dirArgIndex = process.argv.findIndex((arg) => arg === "--dir");
const resourceDir = dirArgIndex >= 0 ? process.argv[dirArgIndex + 1] : "./examples";
const upload = process.argv.includes("--upload-artifact");

const steps = [
  "      - uses: actions/checkout@v4",
  "      - uses: actions/setup-node@v4",
  "        with:",
  "          node-version: 20",
];

if (mode === "sushi") {
  steps.push(
    "      - name: Install FSH and Records tooling",
    "        run: npm install -g fsh-sushi @records-fhir/cli",
    "      - name: Build FSH artifacts",
    "        run: sushi .",
    "      - name: Validate generated resources",
    `        run: records validate-file ${resourceDir} --format junit`,
  );
} else {
  steps.push(
    "      - name: Install Records CLI",
    "        run: npm install -g @records-fhir/cli",
  );
  if (mode === "api") {
    steps.push(
      "      - name: Validate FHIR resources with Records API",
      "        env:",
      "          RECORDS_API_URL: ${{ secrets.RECORDS_API_URL }}",
      "          RECORDS_API_KEY: ${{ secrets.RECORDS_API_KEY }}",
      `        run: records --api-url "$RECORDS_API_URL" --auth-token "$RECORDS_API_KEY" validate-file ${resourceDir} --format junit`,
    );
  } else {
    steps.push(
      "      - name: Validate FHIR resources",
      `        run: records validate-file ${resourceDir} --format junit`,
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

console.log(`name: FHIR Validation

on:
  pull_request:
  push:
    branches: [main]

jobs:
  records-validate:
    runs-on: ubuntu-latest
    steps:
${steps.join("\n")}
`);
