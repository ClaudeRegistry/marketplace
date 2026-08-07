export const resultSchemaVersion = 2;

export function normalizedFhirVersion(values) {
  const normalized = [...new Set(
    (Array.isArray(values) ? values : [values])
      .filter(Boolean)
      .flatMap((value) => String(value).split(","))
      .map((value) => value.trim())
      .filter(Boolean),
  )];
  if (!normalized.length) return "unknown";
  if (normalized.length > 1) return "mixed";
  return normalized[0];
}

export function isR4Version(value) {
  const version = String(value || "").trim().toLowerCase();
  return version === "r4" || version === "4" || version.startsWith("4.0");
}

export function unsupportedDeclaredFhirVersions(values) {
  return (Array.isArray(values) ? values : [values])
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter((value) => value && !isR4Version(value));
}

export function createResultContract({
  tool,
  mode,
  ok = true,
  privacyBoundary = "local-filesystem-only",
  fhirVersion = "unknown",
  validationDepth = "not-applicable",
  profilesLoaded = [],
  terminologyMode = "not-checked",
  referenceMode = "not-checked",
} = {}) {
  return {
    schemaVersion: resultSchemaVersion,
    tool,
    ok,
    mode,
    privacyBoundary,
    capabilities: {
      fhirVersion,
      validationDepth,
      profilesLoaded,
      terminologyMode,
      referenceMode,
    },
  };
}
