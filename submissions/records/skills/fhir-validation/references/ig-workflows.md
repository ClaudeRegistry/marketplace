# IG, FSH, SUSHI, and Validator Workflows

Use this reference for Implementation Guide repositories, SUSHI/FSH projects, generated artifacts, and profile-aware validation.

## Project Signals

- `input/fsh`: FSH source files.
- `sushi-config.yaml`: SUSHI project configuration and dependencies.
- `ig.ini`: IG Publisher entry point.
- `fsh-generated/resources`: SUSHI output; usually generated, not source.
- `input/resources`: hand-authored examples or conformance resources.
- `examples` and `fixtures`: test/example resources.
- `.github/workflows`: CI validation patterns.
- `package.json`: scripts such as `sushi`, `build`, `ig`, `publisher`, or Records validation.

## Recommended Order

1. Run the detector script and read `projectType`, directories, workflow files, runtimes, and warnings.
2. If FSH exists, inspect `sushi-config.yaml` and `input/fsh` before generated JSON.
3. Run existing project scripts first when present.
4. Run SUSHI to regenerate `fsh-generated/resources` when FSH changed.
5. Run Records validation for JSON resources.
6. Run configured profile-aware validators or IG Publisher when full IG conformance is required.
7. Summarize setup/package errors separately from resource defects.

## FSH Source Mapping

When a validation error points to `fsh-generated/resources/*.json`:

1. Do not directly edit generated JSON if `input/fsh` exists.
2. Extract `id`, `url`, `name`, `resourceType`, `type`, `baseDefinition`, and relevant element paths from the generated JSON.
3. Prefer the helper script:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/skills/fhir-validation/scripts/map-generated-to-fsh.mjs" <generated-json> <project-root>
   ```

4. Search `input/fsh` for matching declarations:
   - `Profile: <name-or-id>`
   - `Extension: <name-or-id>`
   - `Instance: <name-or-id>`
   - `ValueSet: <name-or-id>`
   - `CodeSystem: <name-or-id>`
   - `Logical: <name-or-id>`
   - Canonical URL fragments and aliases.
5. Map element errors to FSH rules by path, slice name, caret path, invariant id, or instance rule.
6. Make only mechanical FSH fixes when the intent is clear.
7. Run `sushi .` or the repository's SUSHI script.
8. Re-run Records/validator on regenerated output.

If no FSH source exists, generated JSON may be the only local artifact, but still note that the durable source is unknown.

## SUSHI and IG Publisher

SUSHI compiles FSH from the project input directory, commonly `input/fsh`, into FHIR artifacts under `fsh-generated/resources`. IG Publisher builds the full IG and performs broader package/profile checks. Records local structural validation is useful for JSON shape checks but is not a replacement for profile, terminology, invariant, reference, and package resolution.

Do not install SUSHI, Java, the IG Publisher, Firely Terminal, HAPI, or terminology tooling without user consent. If they are already configured locally, it is acceptable to run them after stating the privacy/setup boundary.

## Firely and HAPI Cross-Checks

Firely Terminal can validate resources using project scope and package dependencies when available. HAPI and the HL7 Java validator can provide profile-aware cross-checks when configured. Use them as second opinions, not replacements for Records, unless the user asks for a specific validator.

Separate findings into:

- Agrees with Records.
- Records only.
- Other validator only.
- Setup/package/terminology failures.
