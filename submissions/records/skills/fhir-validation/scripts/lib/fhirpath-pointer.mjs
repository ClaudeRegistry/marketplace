// Best-effort mapping from a FHIRPath-like expression (as emitted in
// OperationOutcome.issue.expression) to a JSON Pointer into the resource.
//
// Structural validators and the HL7 reference validator emit FHIRPath, which is
// richer than JSON Pointer: it carries choice types (value[x]), named slices,
// and navigation functions (where/resolve/ofType/extension). Those cannot be
// resolved to a single pointer without profile or instance context, so they are
// reported separately and lower the confidence instead of being silently lost.

function escapePointer(part) {
  return part.replace(/~/g, "~0").replace(/\//g, "~1");
}

function stripRoot(expr) {
  // Drop a leading resource type token (e.g. "Observation.") but keep lowercase
  // roots such as "value" that are already element names.
  return expr.replace(/^[A-Z][A-Za-z0-9]*(?=\.|$)/, "").replace(/^\./, "");
}

// Split on dots that are not inside (), [], or backticks.
function splitSteps(expr) {
  const steps = [];
  let current = "";
  let depthParen = 0;
  let depthBracket = 0;
  let inTick = false;
  for (const char of expr) {
    if (char === "`") inTick = !inTick;
    if (!inTick) {
      if (char === "(") depthParen += 1;
      else if (char === ")") depthParen = Math.max(0, depthParen - 1);
      else if (char === "[") depthBracket += 1;
      else if (char === "]") depthBracket = Math.max(0, depthBracket - 1);
      else if (char === "." && depthParen === 0 && depthBracket === 0) {
        steps.push(current);
        current = "";
        continue;
      }
    }
    current += char;
  }
  if (current) steps.push(current);
  return steps.filter(Boolean);
}

export function mapExpression(expression) {
  const segments = [];
  const slices = [];
  const functions = [];
  const caveats = [];
  let resolvable = true;

  const body = stripRoot(String(expression).trim());

  for (const step of splitSteps(body)) {
    // Navigation/filter functions: name(...) — cannot map to a pointer.
    const fn = step.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)$/s);
    if (fn) {
      functions.push({ name: fn[1], argument: fn[2].trim() || null });
      resolvable = false;
      caveats.push(`'${fn[1]}(...)' is a FHIRPath function; needs instance or profile context to locate the node.`);
      continue;
    }

    // Backtick-quoted element name: `value`.
    const ticked = step.match(/^`([^`]+)`(\[.*\])?$/);
    const named = ticked || step.match(/^([A-Za-z_][A-Za-z0-9_]*)(\[(.+)\])?$/);
    if (!named) {
      resolvable = false;
      caveats.push(`Could not parse step '${step}'.`);
      continue;
    }

    const name = ticked ? ticked[1] : named[1];
    const bracket = ticked ? (ticked[2] ? ticked[2].slice(1, -1) : undefined) : named[3];

    // Choice element: value[x] / deceased[x].
    if (name.endsWith("[x]") || bracket === "x") {
      const choiceBase = name.replace(/\[x\]$/, "");
      resolvable = false;
      caveats.push(`'${choiceBase}[x]' is a choice element; the concrete property (e.g. ${choiceBase}Quantity, ${choiceBase}String) depends on the instance.`);
      segments.push({ name: choiceBase, kind: "choice", pointerPart: null });
      continue;
    }

    segments.push({ name, kind: "element", pointerPart: name });

    if (bracket === undefined) continue;
    if (/^\d+$/.test(bracket)) {
      segments.push({ name: bracket, kind: "index", pointerPart: bracket });
    } else {
      // Named slice, e.g. category[VSCat] — not a JSON array index.
      slices.push({ element: name, slice: bracket });
      resolvable = false;
      caveats.push(`'${name}[${bracket}]' is a named slice; the matching array entry depends on the profile and the data.`);
    }
  }

  const pointerParts = [];
  let pointerComplete = true;
  for (const segment of segments) {
    if (segment.pointerPart === null) {
      pointerComplete = false;
      break;
    }
    pointerParts.push(escapePointer(segment.pointerPart));
  }

  const jsonPointer = pointerParts.length ? `/${pointerParts.join("/")}` : "/";
  const confidence = resolvable && pointerComplete ? "exact" : (pointerParts.length ? "partial" : "none");

  return {
    schemaVersion: 2,
    expression,
    jsonPointer,
    jsonPointerComplete: pointerComplete && resolvable,
    confidence,
    segments,
    slices,
    functions,
    caveats,
  };
}
