# CI Templates

Use these templates when `/records:init-ci` or `/records:fhir-validation` adds repository validation. Adapt paths to the target project and preserve existing workflow style.

## Local Records CLI

```yaml
name: FHIR Validation

on:
  pull_request:
  push:
    branches: [main]

jobs:
  records-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install Records CLI
        run: npm install -g @records-fhir/cli
      - name: Validate FHIR resources
        run: records validate-file ./examples --format junit
```

## API-Backed Records CLI

Use only when the user explicitly wants hosted/API validation and has configured secrets.

```yaml
- name: Validate FHIR resources with Records API
  env:
    RECORDS_API_URL: ${{ secrets.RECORDS_API_URL }}
    RECORDS_API_KEY: ${{ secrets.RECORDS_API_KEY }}
  run: records --api-url "$RECORDS_API_URL" --auth-token "$RECORDS_API_KEY" validate-file ./examples --format junit
```

## SUSHI Prebuild plus Records

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
- name: Install FSH tooling
  run: npm install -g fsh-sushi @records-fhir/cli
- name: Build FSH artifacts
  run: sushi .
- name: Validate generated resources
  run: records validate-file ./fsh-generated/resources --format junit
```

## JUnit Artifact Upload

If the Records CLI writes a JUnit file in the target repository's workflow, upload it explicitly:

```yaml
- name: Upload validation report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: records-validation-report
    path: records-validation.xml
```

Do not print complete Patient resources, Bundles, API keys, or FHIR server responses into CI logs.
