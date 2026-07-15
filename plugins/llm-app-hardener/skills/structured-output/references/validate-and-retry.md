# Validate-and-Retry: The Loop and Why Extraction Is Fragile

Native structured output makes valid output *likely*; a schema-validated parse plus a bounded retry makes your code *safe*. This is the pattern that turns "the model's JSON breaks in prod" into a recoverable, typed operation.

## Why `JSON.parse` / regex extraction is fragile
The tempting shortcuts all fail on inputs that look fine in a demo:
- **`JSON.parse(text)` / `json.loads(text)` on raw output**: throws on a markdown fence (```` ```json ````), a leading "Here is the JSON:", a trailing comma, a smart quote, or an unescaped newline in a string. One bad call is an unhandled exception on a hot path.
- **Regex extraction, `re.search(r"\{.*\}", text)`**: regex cannot parse a recursive grammar. It grabs the wrong braces on nested objects, chokes on braces inside string values, and silently truncates. `.*` is greedy and `.*?` is too lazy; neither is correct for JSON.
- **Fence stripping, `text.split("```")[1]`**: depends on the model formatting exactly as expected; breaks the moment it emits two code blocks, no fence, or a different language tag.
- **Even valid JSON is not your shape**: a syntactically fine object can miss a required field, add an unexpected one, or use the wrong type. Accessing `data["field"]` straight off the parse is a `KeyError`/`undefined` waiting to happen.

The fix is the same in every language: **define the schema once, validate every response against it, and retry with the validation error fed back.**

## The loop (TypeScript / Zod)
```ts
import { z } from "zod";

const Result = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  score: z.number(),
});
type Result = z.infer<typeof Result>;

async function getStructured(userPrompt: string, maxAttempts = 3): Promise<Result> {
  let lastError = "";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const messages = [{ role: "user", content: userPrompt }];
    if (lastError) {
      messages.push({
        role: "user",
        content: `Your previous output failed validation: ${lastError}. `
          + `Return ONLY output that satisfies the schema.`,
      });
    }
    // Prefer native schema-constrained output here (see structured-output-apis.md);
    // this loop is the safety net around it.
    const raw = await callModel(messages);
    const parsed = Result.safeParse(tryJson(raw));
    if (parsed.success) return parsed.data;      // typed, validated
    lastError = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
  }
  throw new StructuredOutputError(`schema not satisfied after ${maxAttempts} attempts: ${lastError}`);
}

function tryJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return {}; }   // let the schema report the real failure
}
```

## The loop (Python / Pydantic)
```python
from pydantic import BaseModel, ValidationError

class Result(BaseModel):
    sentiment: str
    score: float
    model_config = {"extra": "forbid"}     # reject unexpected fields

def get_structured(user_prompt: str, max_attempts: int = 3) -> Result:
    last_error = ""
    for _ in range(max_attempts):
        messages = [{"role": "user", "content": user_prompt}]
        if last_error:
            messages.append({
                "role": "user",
                "content": f"Your previous output failed validation: {last_error}. "
                           "Return ONLY output matching the schema.",
            })
        raw = call_model(messages)          # prefer native schema-constrained output
        try:
            return Result.model_validate_json(raw)   # parses + validates in one step
        except ValidationError as e:
            last_error = "; ".join(f"{err['loc']}: {err['msg']}" for err in e.errors())
    raise StructuredOutputError(f"schema not satisfied after {max_attempts} attempts: {last_error}")
```

## Why feeding the error back works
Models are good at self-correction *when told what was wrong*. "Return valid JSON" repeated verbatim rarely fixes anything; "field `score`: expected number, received string '0.8'" gives the model the exact defect to repair, and it usually does on the next attempt. Include the concrete validator message, not a generic instruction.

## Making retries cheap and safe
- **Bound the attempts** (2–3 is plenty) and raise a typed error when exhausted, never loop unbounded, which is a cost and latency hazard and can spin on a fundamentally impossible schema.
- **Retry only on validation failure**, not on network/rate-limit errors (handle those with the SDK's own retry).
- **Layer on top of native output**: the loop is the safety net, not the primary mechanism. With schema-constrained decoding, the loop almost never fires; without it, it's doing real work.
- **Log which attempt succeeded.** If attempt-2+ fires often, the schema is too strict, the prompt is unclear, or the model lacks native support, fix the cause rather than raising `max_attempts`.
- **Keep the schema flat and closed.** Set `additionalProperties: false` / `extra="forbid"` so unexpected fields fail loudly, and validate provider-unsupported constraints (numeric/length bounds) client-side after the parse.
- **Return a typed value.** The whole point is that callers get `Result`, never a raw dict, downstream code should never touch an unvalidated parse.
