export function isUrlTarget(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function hasConsentAction(gate, action) {
  return gate.consentRequired.some((entry) => entry.action === action);
}

function addConsent(gate, action, reason, riskLevel = gate.riskLevel) {
  if (hasConsentAction(gate, action)) return;
  const entry = { action, riskLevel, reason, blockedUntil: "explicit-user-consent" };
  gate.consentRequired.push(entry);
  gate.blockedActions.push(entry);
}

export function buildPrivacyGate(detector, options = {}) {
  const target = options.target || "";
  const resourceSignals = detector?.resourceInventory?.privacySignals || {};
  const hasResourceInventory = Boolean(detector?.resourceInventory?.scannedJsonFiles);
  const hasProfiles = Boolean(Object.keys(detector?.resourceInventory?.metaProfiles || {}).length);
  const gate = {
    schemaVersion: 1,
    riskLevel: detector?.privacyRiskLevel || "low",
    dataSignals: resourceSignals,
    localActionsAllowed: [
      "records-cli",
      "structural-fallback",
      "local-sushi-build",
      "local-package-cache-inspection",
      "local-redacted-summary",
    ],
    consentRequired: [],
    blockedActions: [],
    blockedRuntimeNames: [],
    summary: "Local validation and redacted summaries are allowed by default.",
  };

  if (isUrlTarget(target)) {
    gate.riskLevel = "high";
    addConsent(gate, "fetch-fhir-url", "The target is an HTTP(S) URL. Fetching it may contact a FHIR server and expose identifiers.");
    addConsent(gate, "fhir-server-access", "FHIR server access requires explicit consent for this task.");
  }

  if (Object.keys(resourceSignals).length) {
    gate.riskLevel = "high";
    addConsent(gate, "hosted-validator", "Patient-like resources were detected. Do not use hosted validation without consent.");
    addConsent(gate, "fhir-server-access", "Patient-like resources require consent before any FHIR server access.");
  } else if (hasResourceInventory && gate.riskLevel === "low") {
    gate.riskLevel = "medium";
  }

  if (detector?.availableRuntimes?.recordsApi?.available && gate.riskLevel !== "low") {
    addConsent(gate, "records-api", "RECORDS_API_URL is configured, but external API validation needs consent for medium/high-risk FHIR data.");
  }

  if (detector?.packageResolution?.missingCount) {
    addConsent(gate, "package-download-or-install", "Declared FHIR package dependencies are missing from the local cache.");
  }

  if (hasProfiles || detector?.workflowFiles?.includes("ig.ini")) {
    addConsent(gate, "terminology-server", "Profile-aware validation may contact terminology services unless configured fully offline.");
  }

  const blockedByAction = {
    "records-api": "records-api",
    "fetch-fhir-url": "fhir-url",
    "hosted-validator": "hosted-validator",
    "package-download-or-install": "package-download-or-install",
    "terminology-server": "terminology-server",
    "fhir-server-access": "fhir-server-access",
  };
  gate.blockedRuntimeNames = [...new Set(gate.consentRequired.map((entry) => blockedByAction[entry.action]).filter(Boolean))];
  if (gate.consentRequired.length) {
    gate.summary = "Local-only actions are allowed; listed network, hosted, install, package, or terminology actions are blocked until explicit consent.";
  }
  return gate;
}

function runtimeCandidate(name, available, details) {
  return {
    name,
    available: Boolean(available),
    local: Boolean(details.local),
    profileAware: details.profileAware || "no",
    autoExecutable: Boolean(details.autoExecutable),
    command: details.command || null,
    path: details.path || null,
    reason: details.reason || (available ? "available" : "not_available"),
    blocked: Boolean(details.blocked),
    blockedBy: details.blockedBy || [],
    notes: details.notes || [],
  };
}

export function buildRuntimePlan(detector, options = {}) {
  const gate = buildPrivacyGate(detector, options);
  const runtimes = detector?.availableRuntimes || {};
  const workflowFiles = detector?.workflowFiles || [];
  const sourceDirs = detector?.sourceDirs || [];
  const generatedDirs = detector?.generatedDirs || [];
  const hasSushiSource = sourceDirs.includes("input/fsh");
  const hasGeneratedResources = generatedDirs.includes("fsh-generated/resources");
  const terminologyBlocked = gate.blockedRuntimeNames.includes("terminology-server");
  const packageBlocked = gate.blockedRuntimeNames.includes("package-download-or-install");

  const candidates = [
    runtimeCandidate("records-cli", runtimes.recordsCli?.available, {
      local: true,
      profileAware: "depends-on-records-configuration",
      autoExecutable: true,
      command: "records validate-file <target> --format json",
      path: runtimes.recordsCli?.path || null,
      reason: runtimes.recordsCli?.reason,
      notes: ["Preferred executable local runtime when available."],
    }),
    runtimeCandidate("records-api", runtimes.recordsApi?.available, {
      local: false,
      profileAware: "depends-on-api-configuration",
      autoExecutable: false,
      command: "POST RECORDS_API_URL validation endpoint",
      blocked: gate.blockedRuntimeNames.includes("records-api"),
      blockedBy: gate.consentRequired.filter((entry) => entry.action === "records-api").map((entry) => entry.action),
      reason: runtimes.recordsApi?.reason,
      notes: ["Never use automatically for medium/high-risk resources."],
    }),
    runtimeCandidate("sushi-build", hasSushiSource && (runtimes.sushi?.available || runtimes.npxSushiScript?.available), {
      local: true,
      profileAware: "build-only",
      autoExecutable: false,
      command: runtimes.sushi?.available ? "sushi ." : "npm run <sushi-script>",
      path: runtimes.sushi?.path || runtimes.npxSushiScript?.path || null,
      blocked: packageBlocked,
      blockedBy: packageBlocked ? ["package-download-or-install"] : [],
      reason: hasSushiSource ? "fsh_source_detected" : "no_fsh_source",
      notes: ["Build profiles before validating generated resources; do not edit generated JSON as source."],
    }),
    runtimeCandidate("ig-publisher-or-java-validator", workflowFiles.includes("ig.ini") && runtimes.java?.available, {
      local: true,
      profileAware: "yes-when-packages-and-terminology-are-configured",
      autoExecutable: false,
      command: "java -jar <validator-or-publisher>.jar",
      path: runtimes.java?.path || null,
      blocked: terminologyBlocked || packageBlocked,
      blockedBy: [
        ...(terminologyBlocked ? ["terminology-server"] : []),
        ...(packageBlocked ? ["package-download-or-install"] : []),
      ],
      reason: workflowFiles.includes("ig.ini") ? "ig_ini_detected" : "no_ig_ini",
      notes: ["Profile-aware, but setup-specific; run only when configured or requested."],
    }),
    runtimeCandidate("firely-terminal", runtimes.firelyTerminal?.available, {
      local: true,
      profileAware: "yes-when-project-scope-is-configured",
      autoExecutable: false,
      command: "fhir validate <target>",
      path: runtimes.firelyTerminal?.path || null,
      blocked: terminologyBlocked,
      blockedBy: terminologyBlocked ? ["terminology-server"] : [],
      reason: runtimes.firelyTerminal?.reason,
      notes: ["Use as a configured cross-check, not as an unannounced replacement."],
    }),
    runtimeCandidate("hapi-fhir-cli", runtimes.hapi?.available, {
      local: true,
      profileAware: "yes-when-packages-are-configured",
      autoExecutable: false,
      command: "hapi-fhir-cli validate <target>",
      path: runtimes.hapi?.path || null,
      blocked: terminologyBlocked || packageBlocked,
      blockedBy: [
        ...(terminologyBlocked ? ["terminology-server"] : []),
        ...(packageBlocked ? ["package-download-or-install"] : []),
      ],
      reason: runtimes.hapi?.reason,
      notes: ["Use as a configured cross-check when available."],
    }),
    runtimeCandidate("structural-fallback", true, {
      local: true,
      profileAware: "no",
      autoExecutable: true,
      command: "node validate-structural.mjs <target>",
      reason: "always_available",
      notes: ["Fast local triage only; not profile, terminology, invariant, or full reference validation."],
    }),
  ];

  const selectedRuntime = isUrlTarget(options.target)
    ? runtimeCandidate("blocked-pending-consent", true, {
      local: false,
      profileAware: "unknown",
      autoExecutable: false,
      command: null,
      reason: "remote_url_requires_consent",
      blocked: true,
      blockedBy: gate.consentRequired.map((entry) => entry.action),
      notes: ["No URL fetch or FHIR server access is allowed until the user explicitly consents."],
    })
    : candidates.find((candidate) => candidate.available && candidate.autoExecutable && !candidate.blocked)
      || candidates[candidates.length - 1];
  const profileAwareCandidate = candidates.find((candidate) => candidate.available && candidate.profileAware !== "no" && !candidate.blocked) || null;

  return {
    schemaVersion: 1,
    target: options.target || null,
    projectType: detector?.projectType || (isUrlTarget(options.target) ? "remote-fhir-url" : "unknown"),
    selectedMode: selectedRuntime.name,
    selectedRuntime,
    profileAwareCandidate,
    hasGeneratedResources,
    privacyGate: gate,
    candidates,
    recommendedOrder: detector?.recommendedOrder || [],
  };
}
