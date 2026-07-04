export function buildPackageDoctor(detector) {
  const findings = [];
  const cache = detector?.fhirPackageCache || { available: false, packageCount: 0, packages: [] };
  const resolution = detector?.packageResolution || { declaredCount: 0, resolvedCount: 0, missingCount: 0, missing: [] };
  const metaProfiles = detector?.resourceInventory?.metaProfiles || {};
  const fhirVersions = detector?.fhirVersions || [];
  const workflowFiles = detector?.workflowFiles || [];
  const sourceDirs = detector?.sourceDirs || [];
  const generatedDirs = detector?.generatedDirs || [];
  const uniqueVersions = [...new Set(fhirVersions.map((value) => String(value).toLowerCase().replace(/\s+/g, "")))];

  function add(severity, code, message, nextStep) {
    findings.push({ severity, code, message, nextStep });
  }

  if (!cache.available) {
    add("warning", "package-cache-unavailable", "The local FHIR package cache could not be read.", "Confirm FHIR_PACKAGE_CACHE or ~/.fhir/packages before profile-aware validation.");
  }
  if (resolution.missingCount) {
    add("error", "missing-fhir-packages", `${resolution.missingCount} declared FHIR package dependency is missing from the local cache.`, "Resolve package cache setup before editing resources for profile-unknown or not-found issues.");
  }
  if (!resolution.declaredCount && Object.keys(metaProfiles).length) {
    add("warning", "profiles-without-dependencies", "Resources declare meta.profile canonicals, but no package dependencies were detected.", "Add or verify sushi-config.yaml/package dependencies before profile-aware validation.");
  }
  if (uniqueVersions.length > 1) {
    add("warning", "mixed-fhir-version-signals", `Multiple FHIR version signals were detected: ${fhirVersions.join(", ")}.`, "Confirm the intended FHIR version before running profile-aware validators.");
  }
  if (sourceDirs.includes("input/fsh") && !generatedDirs.includes("fsh-generated/resources")) {
    add("warning", "fsh-without-generated-resources", "FSH source exists but generated resources were not detected.", "Run the configured SUSHI build before validating generated artifacts.");
  }
  if (workflowFiles.includes("ig.ini") && !detector?.availableRuntimes?.java?.available) {
    add("warning", "ig-without-java", "ig.ini exists, but Java was not detected.", "Install or configure Java only with user consent when IG Publisher validation is required.");
  }
  if (!findings.length) {
    add("info", "package-setup-clear", "No obvious FHIR package-cache or version setup issue was detected.", "Proceed with local validation and still separate setup failures from resource defects.");
  }

  const severityRank = { error: 3, warning: 2, info: 1 };
  const maxSeverity = findings.reduce((max, finding) => severityRank[finding.severity] > severityRank[max] ? finding.severity : max, "info");
  return {
    schemaVersion: 1,
    maxSeverity,
    fhirVersions,
    packageCache: {
      path: cache.path || null,
      available: Boolean(cache.available),
      packageCount: cache.packageCount || 0,
    },
    packageResolution: resolution,
    profileCanonicalCount: Object.keys(metaProfiles).length,
    findings,
  };
}
