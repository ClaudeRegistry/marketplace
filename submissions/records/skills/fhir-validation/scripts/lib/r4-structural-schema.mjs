// Minimal, hand-curated FHIR R4 structural schema for the structural fallback
// validator. This is deliberately small and honest: it covers base-resource
// shape, a curated element allow-list for common resource types, required
// (min-cardinality) elements, required choice[x] elements, choice[x] expansion,
// required-binding code enums, and primitive datatypes for selected elements.
// It is NOT a substitute for profile, terminology, invariant, or reference
// validation, and it does not load StructureDefinitions or packages.
//
// Resource types without an entry here still get the generic base-resource
// checks (resourceType, id format, no nulls/empty arrays); schema-level checks
// only run for the types listed below.

// Elements present on every DomainResource (and thus every resource here).
const domainResource = [
  "id",
  "meta",
  "implicitRules",
  "language",
  "text",
  "contained",
  "extension",
  "modifierExtension",
];

// Expand a choice base into its concrete property names (value -> valueQuantity, ...).
function choice(base, types) {
  return types.map((type) => `${base}${type[0].toUpperCase()}${type.slice(1)}`);
}

const observationStatus = [
  "registered", "preliminary", "final", "amended", "corrected",
  "cancelled", "entered-in-error", "unknown",
];

export const resourceSchemas = {
  Patient: {
    required: [],
    codes: { gender: ["male", "female", "other", "unknown"] },
    primitives: {
      active: "boolean", birthDate: "date", deceasedBoolean: "boolean",
      deceasedDateTime: "dateTime", multipleBirthBoolean: "boolean",
      multipleBirthInteger: "integer",
    },
    elements: [
      ...domainResource,
      "identifier", "active", "name", "telecom", "gender", "birthDate",
      ...choice("deceased", ["boolean", "dateTime"]),
      "address", "maritalStatus",
      ...choice("multipleBirth", ["boolean", "integer"]),
      "photo", "contact", "communication", "generalPractitioner",
      "managingOrganization", "link",
    ],
  },
  Observation: {
    required: ["status", "code"],
    codes: { status: observationStatus },
    primitives: {
      issued: "instant", effectiveDateTime: "dateTime", effectiveInstant: "instant",
      valueDateTime: "dateTime", valueString: "string", valueBoolean: "boolean",
      valueInteger: "integer", valueTime: "time",
    },
    elements: [
      ...domainResource,
      "identifier", "basedOn", "partOf", "status", "category", "code",
      "subject", "focus", "encounter",
      ...choice("effective", ["dateTime", "Period", "Timing", "instant"]),
      "issued", "performer",
      ...choice("value", ["Quantity", "CodeableConcept", "string", "boolean", "integer", "Range", "Ratio", "SampledData", "time", "dateTime", "Period"]),
      "dataAbsentReason", "interpretation", "note", "bodySite", "method",
      "specimen", "device", "referenceRange", "hasMember", "derivedFrom",
      "component",
    ],
  },
  Bundle: {
    required: ["type"],
    codes: {
      type: [
        "document", "message", "transaction", "transaction-response",
        "batch", "batch-response", "history", "searchset", "collection",
      ],
    },
    primitives: { timestamp: "instant", total: "unsignedInt" },
    elements: [
      ...domainResource,
      "identifier", "type", "timestamp", "total", "link", "entry", "signature",
    ],
  },
  Condition: {
    required: ["subject"],
    codes: {},
    primitives: { recordedDate: "dateTime", onsetDateTime: "dateTime", abatementDateTime: "dateTime", abatementBoolean: "boolean" },
    elements: [
      ...domainResource,
      "identifier", "clinicalStatus", "verificationStatus", "category",
      "severity", "code", "bodySite", "subject", "encounter",
      ...choice("onset", ["dateTime", "Age", "Period", "Range", "string"]),
      ...choice("abatement", ["dateTime", "Age", "Period", "Range", "string", "boolean"]),
      "recordedDate", "recorder", "asserter", "stage", "evidence", "note",
    ],
  },
  Encounter: {
    required: ["status", "class"],
    codes: {
      status: ["planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled", "entered-in-error", "unknown"],
    },
    primitives: {},
    elements: [
      ...domainResource,
      "identifier", "status", "statusHistory", "class", "classHistory", "type",
      "serviceType", "priority", "subject", "episodeOfCare", "basedOn",
      "participant", "appointment", "period", "length", "reasonCode",
      "reasonReference", "diagnosis", "account", "hospitalization", "location",
      "serviceProvider", "partOf",
    ],
  },
  Procedure: {
    required: ["status", "subject"],
    codes: {
      status: ["preparation", "in-progress", "not-done", "on-hold", "stopped", "completed", "entered-in-error", "unknown"],
    },
    primitives: { performedDateTime: "dateTime", instantiatesUri: "uri" },
    elements: [
      ...domainResource,
      "identifier", "instantiatesCanonical", "instantiatesUri", "basedOn",
      "partOf", "status", "statusReason", "category", "code", "subject",
      "encounter",
      ...choice("performed", ["dateTime", "Period", "string", "Age", "Range"]),
      "recorder", "asserter", "performer", "location", "reasonCode",
      "reasonReference", "bodySite", "outcome", "report", "complication",
      "complicationDetail", "followUp", "note", "focalDevice", "usedReference",
      "usedCode",
    ],
  },
  MedicationRequest: {
    required: ["status", "intent", "subject"],
    requiredChoices: [["medicationCodeableConcept", "medicationReference"]],
    codes: {
      status: ["active", "on-hold", "cancelled", "completed", "entered-in-error", "stopped", "draft", "unknown"],
      intent: ["proposal", "plan", "order", "original-order", "reflex-order", "filler-order", "instance-order", "option"],
    },
    primitives: { authoredOn: "dateTime", doNotPerform: "boolean", reportedBoolean: "boolean" },
    elements: [
      ...domainResource,
      "identifier", "status", "statusReason", "intent", "category", "priority",
      "doNotPerform",
      ...choice("reported", ["boolean", "Reference"]),
      ...choice("medication", ["CodeableConcept", "Reference"]),
      "subject", "encounter", "supportingInformation", "authoredOn",
      "requester", "performer", "performerType", "recorder", "reasonCode",
      "reasonReference", "instantiatesCanonical", "instantiatesUri", "basedOn",
      "groupIdentifier", "courseOfTherapyType", "insurance", "note",
      "dosageInstruction", "dispenseRequest", "substitution",
      "priorPrescription", "detectedIssue", "eventHistory",
    ],
  },
  DiagnosticReport: {
    required: ["status", "code"],
    codes: {
      status: ["registered", "partial", "preliminary", "final", "amended", "corrected", "appended", "cancelled", "entered-in-error", "unknown"],
    },
    primitives: { issued: "instant", effectiveDateTime: "dateTime", conclusion: "string" },
    elements: [
      ...domainResource,
      "identifier", "basedOn", "status", "category", "code", "subject",
      "encounter",
      ...choice("effective", ["dateTime", "Period"]),
      "issued", "performer", "resultsInterpreter", "specimen", "result",
      "imagingStudy", "media", "conclusion", "conclusionCode", "presentedForm",
    ],
  },
};

export const coveredResourceTypes = Object.keys(resourceSchemas);
