# Native Structured-Output APIs by Provider

Pick the strongest mechanism the detected provider and model support. "Guaranteed" below means the provider constrains decoding to the schema so the response is schema-valid by construction; "best-effort" means valid JSON but not necessarily your shape, those need validate-and-retry on top. Always keep a validated parse regardless (a length cap or refusal can still interrupt native output).

## Anthropic (Claude)
Two mechanisms, both schema-constrained on supported models (current Claude models plus recent legacy tiers):

**JSON output, `output_config.format`.** The canonical parameter on `messages.create()`. The SDK's `client.messages.parse()` / `.parse({...})` also validates the response against the schema for you and returns typed output.
```python
schema = {
    "type": "object",
    "properties": {
        "sentiment": {"type": "string", "enum": ["positive", "neutral", "negative"]},
        "score": {"type": "number"},
    },
    "required": ["sentiment", "score"],
    "additionalProperties": False,   # required for every object
}
resp = client.messages.create(
    model="claude-opus-4-8", max_tokens=1024,
    output_config={"format": {"type": "json_schema", "schema": schema}},
    messages=[{"role": "user", "content": "Classify: 'shipping was slow but support fixed it'"}],
)
# Or, with SDK validation:
# resp = client.messages.parse(model=..., output_config={"format": {...}}, messages=[...])
```
**Strict tool use, `strict: true`.** When the value is an argument to an action, define a tool with `strict: true` (a top-level field on the tool, alongside `name`/`description`/`input_schema`: *not* on `tool_choice`) and `additionalProperties: false` + `required`. The tool `input` then validates exactly.

**Guarantees & limits.** Structured output is available on current Claude tiers (and recent legacy Opus tiers), if the target model doesn't support it, fall back to validate-and-retry and say so. Supported schema features: basic types, `enum`, `const`, `anyOf`, `allOf`, `$ref`/`$def`, and the standard string `format`s. **Not** supported: recursive schemas, numeric constraints (`minimum`/`maximum`/`multipleOf`), string constraints (`minLength`/`maxLength`), and `additionalProperties` set to anything but `false`. The Python/TypeScript SDKs strip unsupported constraints from the sent schema and validate them client-side. A new schema pays a one-time compilation latency, then caches ~24h. Incompatible with citations (returns 400) and with message prefilling.

## OpenAI
**Structured Outputs, `response_format` json_schema.** Set `strict: true` for guaranteed conformance on the supported model family; the SDK also offers a `.parse()` helper that binds a Pydantic/Zod model.
```python
resp = client.chat.completions.create(
    model="gpt-4o-mini",
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "classification",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {"sentiment": {"type": "string", "enum": ["positive","neutral","negative"]}},
                "required": ["sentiment"],
                "additionalProperties": False,
            },
        },
    },
    messages=[{"role": "user", "content": "..."}],
)
```
**Strict function calling.** Set `strict: true` on the function/tool definition (with `additionalProperties: false` and all fields `required`) to guarantee valid tool arguments. Same schema restrictions as above (all object properties required; use `anyOf`/nullable to express optionality). Bare `{"type": "json_object"}` is *best-effort* JSON only, validate + retry.

## Google Gemini / Vertex AI
**`responseSchema` + JSON mime type.** Constrain output via `generationConfig`:
```python
generation_config = {
    "response_mime_type": "application/json",
    "response_schema": {
        "type": "object",
        "properties": {"sentiment": {"type": "string", "enum": ["positive","neutral","negative"]}},
        "required": ["sentiment"],
    },
}
```
Gemini also supports function-calling schemas for tool arguments and a controlled `enum` mode for single-label classification. On **Vertex AI**, Anthropic (Claude) models use the Anthropic mechanism above; native Gemini models use `responseSchema`.

## Vercel AI SDK (TypeScript)
**`generateObject` / `streamObject`.** Pass a Zod schema; the SDK validates and returns a typed `.object`. It works across providers (OpenAI, Anthropic, Google) and uses each provider's native constraint under the hood.
```ts
import { generateObject } from "ai";
import { z } from "zod";
const { object } = await generateObject({
  model,                                   // any supported provider model
  schema: z.object({ sentiment: z.enum(["positive","neutral","negative"]), score: z.number() }),
  prompt: "Classify: ...",
});
// object is fully typed and already validated
```
`output: 'array'` streams a list of objects; `output: 'enum'` constrains to a fixed label set. Validation failures throw `NoObjectGeneratedError` / a schema error, catch it and retry.

## Pydantic AI (Python)
**`result_type`.** The agent's result is validated into a Pydantic model; on a validation failure the framework can re-prompt the model automatically.
```python
from pydantic import BaseModel
from pydantic_ai import Agent

class Classification(BaseModel):
    sentiment: str
    score: float

agent = Agent("anthropic:claude-opus-4-8", result_type=Classification)
result = agent.run_sync("Classify: ...")
result.output   # a validated Classification instance
```
Raise `ModelRetry("...")` inside a validator or tool to trigger a bounded self-correction with your error message fed back to the model.

## LangChain
**`.with_structured_output(schema)`** on a chat model binds a Pydantic model / TypedDict / JSON Schema and routes through the underlying provider's native structured-output or tool-calling mechanism, returning a validated object. Prefer this over hand-parsing a `PromptTemplate` that "asks for JSON."

## Choosing quickly
- The value is **data the app consumes** → JSON schema output (`output_config.format` / `response_format json_schema` / `responseSchema` / `generateObject` / `result_type`).
- The value is **an argument to an action** → strict tool/function schema.
- The provider/model **lacks native support** → JSON mode + validate-and-retry (`references/validate-and-retry.md`), and disclose the weaker guarantee.
