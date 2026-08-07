// FHIR R4 primitive datatype validators, JSON-shape aware: some primitives are
// JSON strings (date, dateTime, code, uri ...), others JSON numbers/booleans.
// Patterns follow the FHIR R4 specification. Unknown primitive names are skipped
// (return valid) so callers can annotate only the elements they care about.

const stringPatterns = {
  date: /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?)?$/,
  dateTime: /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|[+-]((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$/,
  instant: /^([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|[+-]((0[0-9]|1[0-3]):[0-5][0-9]|14:00))$/,
  time: /^([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?$/,
  code: /^[^\s]+( [^\s]+)*$/,
  id: /^[A-Za-z0-9\-.]{1,64}$/,
  oid: /^urn:oid:[0-2](\.(0|[1-9][0-9]*))+$/,
  uuid: /^urn:uuid:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
};

export const supportedPrimitives = [
  "boolean", "integer", "positiveInt", "unsignedInt", "decimal", "string",
  "markdown", "uri", "url", "canonical", "date", "dateTime", "instant",
  "time", "code", "id", "oid", "uuid",
];

export function validatePrimitive(type, value) {
  switch (type) {
    case "boolean":
      return typeof value === "boolean" ? { valid: true } : { valid: false, reason: "expected a boolean" };
    case "integer":
    case "positiveInt":
    case "unsignedInt": {
      if (typeof value !== "number" || !Number.isInteger(value)) return { valid: false, reason: "expected an integer" };
      if (type === "positiveInt" && value <= 0) return { valid: false, reason: "must be greater than 0" };
      if (type === "unsignedInt" && value < 0) return { valid: false, reason: "must be 0 or greater" };
      return { valid: true };
    }
    case "decimal":
      return typeof value === "number" ? { valid: true } : { valid: false, reason: "expected a number" };
    case "string":
    case "markdown":
      return typeof value === "string" && value.length > 0 ? { valid: true } : { valid: false, reason: "expected a non-empty string" };
    case "uri":
    case "url":
    case "canonical":
      return typeof value === "string" && /^\S+$/.test(value) ? { valid: true } : { valid: false, reason: "expected a non-empty URI without whitespace" };
    default: {
      const pattern = stringPatterns[type];
      if (!pattern) return { valid: true };
      if (typeof value !== "string") return { valid: false, reason: "expected a string" };
      return pattern.test(value) ? { valid: true } : { valid: false, reason: `does not match the ${type} format` };
    }
  }
}
