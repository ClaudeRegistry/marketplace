# Request Validation Patterns (per stack)

Validate at the boundary, params, query, body, **before** business logic, reject unknown fields, and reshape the validator's native error into the RFC 9457 `errors` array (`[{ field, message, code }]`). One schema per request; one central mapper per app. The signature is always the same across stacks: *parse-or-throw at the edge → catch in the one error handler → emit `problem+json`.*

## Zod (TypeScript, Express/Koa/Fastify)
```ts
import { z } from "zod";

const CreateOrder = z.object({
  email: z.string().email(),
  quantity: z.number().int().min(1),
  couponCode: z.string().optional(),
}).strict();               // .strict() → reject unknown keys

// In the route (or a validate() middleware):
const parsed = CreateOrder.safeParse(req.body);
if (!parsed.success) {
  throw new ValidationError(parsed.error.issues.map(i => ({
    field: i.path.join("."),   // e.g. "quantity" or "items.0.qty"
    message: i.message,
    code: i.code,              // "invalid_type", "too_small", ...
  })));
}
const body = parsed.data;      // typed + coerced
```
Map `ZodIssue[]` → `errors[]`. Use `z.coerce.number()` for query strings. `safeParse` avoids try/catch; a shared error middleware turns `ValidationError` into a 422 envelope.

## Pydantic v2 (Python, FastAPI/Flask)
```python
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class CreateOrder(BaseModel):
    model_config = ConfigDict(extra="forbid")   # reject unknown fields
    email: EmailStr
    quantity: int = Field(ge=1)
    coupon_code: str | None = None                # optional
```
FastAPI validates the body against the model automatically and raises `RequestValidationError`. Install one handler:
```python
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def on_validation_error(request: Request, exc: RequestValidationError):
    errors = [{
        "field": ".".join(str(p) for p in e["loc"][1:]),  # drop "body"
        "message": e["msg"],
        "code": e["type"],                                 # "greater_than_equal", ...
    } for e in exc.errors()]
    return JSONResponse(status_code=422, media_type="application/problem+json", content={
        "type": "https://api.example.com/problems/validation-error",
        "title": "Validation failed", "status": 422, "errors": errors,
    })
```

## class-validator + class-transformer (NestJS)
```ts
export class CreateOrderDto {
  @IsEmail() email: string;
  @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsString() couponCode?: string;
}
// main.ts, global pipe
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, forbidNonWhitelisted: true,   // strip/deny unknown props
  transform: true,                                // coerce to DTO types
  exceptionFactory: (errs) => new UnprocessableEntityException(flatten(errs)),
}));
```
Flatten `ValidationError[]` (they nest via `.children` for nested objects) into `errors[]`; a global exception filter renders the envelope. `forbidNonWhitelisted` is what rejects unknown fields.

## Joi (Node, Express/Hapi)
```js
const schema = Joi.object({
  email: Joi.string().email().required(),
  quantity: Joi.number().integer().min(1).required(),
  couponCode: Joi.string().optional(),
}).options({ abortEarly: false, stripUnknown: false, presence: "optional" });

const { error, value } = schema.validate(req.body);
if (error) throw new ValidationError(error.details.map(d => ({
  field: d.path.join("."), message: d.message, code: d.type,   // "number.min", ...
})));
```
`abortEarly: false` returns **all** errors, not just the first, essential for good validation UX. Use `.unknown(false)` (default) to reject unknown keys.

## JSON Schema / Ajv (framework-agnostic; native to Fastify)
```js
const schema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    quantity: { type: "integer", minimum: 1 },
    couponCode: { type: "string" },
  },
  required: ["email", "quantity"],
  additionalProperties: false,      // reject unknown fields
};
const validate = ajv.compile(schema);       // allErrors: true in Ajv options
if (!validate(body)) {
  const errors = validate.errors.map(e => ({
    field: e.instancePath.replace(/^\//, "").replace(/\//g, "."),
    message: e.message, code: e.keyword,     // "minimum", "required", ...
  }));
}
```
In Fastify this doubles as the OpenAPI schema, one artifact validates the request and documents it, eliminating a whole class of drift. Set Ajv `allErrors: true` to aggregate.

## Go, go-playground/validator (net/http / Gin)
```go
type CreateOrder struct {
    Email    string `json:"email"    binding:"required,email"`
    Quantity int    `json:"quantity" binding:"required,gte=1"`
    Coupon   string `json:"couponCode" binding:"omitempty"`
}
// Gin:
var req CreateOrder
if err := c.ShouldBindJSON(&req); err != nil {
    var ve validator.ValidationErrors
    if errors.As(err, &ve) {
        errs := make([]FieldErr, 0, len(ve))
        for _, fe := range ve {
            errs = append(errs, FieldErr{
                Field:   fe.Field(),   // struct field or json tag via RegisterTagNameFunc
                Message: msgFor(fe),    // map fe.Tag() -> human message
                Code:    fe.Tag(),      // "required", "gte", "email"
            })
        }
        writeProblem(c, 422, errs)
    }
}
```
Register a `TagNameFunc` so `fe.Field()` reports the JSON name, not the Go field name. Use `DisallowUnknownFields` on the decoder to reject extras.

## Rails, strong params + validations (ActiveModel / dry-validation)
```ruby
# Strong params define the accepted request shape (rejects unpermitted keys silently by default;
# set config.action_controller.action_on_unpermitted_parameters = :raise to fail loudly).
def order_params
  params.require(:order).permit(:email, :quantity, :coupon_code)
end

# Model / dry-validation supplies the rules; render the envelope on failure:
order = Order.new(order_params)
unless order.valid?
  errors = order.errors.map { |e| { field: e.attribute, message: e.message, code: e.type } }
  render json: problem(422, errors), status: :unprocessable_entity,
         content_type: "application/problem+json"
end
```
For request-shape validation independent of the model, prefer `dry-validation` or `dry-schema` contracts; map `.errors.to_h` into `errors[]`.

## Cross-stack checklist
- Validate **params, query, and body**: not just the body. Path/query values are strings; coerce and bound them.
- Aggregate **all** violations in one response (`abortEarly:false`, `allErrors:true`, Pydantic/DRF do this by default). Never fail on the first field only.
- **Reject unknown fields** where the endpoint is strict (`.strict()`, `extra="forbid"`, `forbidNonWhitelisted`, `additionalProperties:false`, `DisallowUnknownFields`, `action_on_unpermitted_parameters=:raise`).
- **One mapper** from the library's native error to `{ field, message, code }`: keep the envelope identical across every endpoint.
- Choose the status by meaning: `400` for unparseable JSON, `422` for well-formed-but-invalid. Do not use `400` for both.
- Never echo the raw validator/exception object to the client; it may leak internal field names, regexes, or types beyond what the contract documents.
