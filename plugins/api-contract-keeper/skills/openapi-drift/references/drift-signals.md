# Drift Signals: reading the API surface from code

For each framework: where routes, path/query params, request bodies, response schemas, and status codes live, so you can build the code-side model and diff it against the spec. Read the same six facts everywhere: **route (path+method), path params, query params, request body, response body, status codes** (plus auth). Cite the `file:line` of each.

## Express (JS/TS)
- **Routes**: `app.get('/orders', ...)`, `router.post('/orders/:id', ...)`. Path params are the `:name` tokens.
- **Query/body**: `req.query.status`, `req.body.total`. There is no built-in schema, the request shape lives in the validation middleware (Zod `z.object`, Joi `Joi.object`, `express-validator` chains, or Ajv JSON Schema). Treat the validator as the request schema; a route with no validator has an *implicit* (untyped) body, flag it.
- **Response**: `res.json(obj)` / `res.send(obj)`. The shape is whatever object is built, trace the variable. `res.status(409).json(...)` gives the status set.
- **Drift tells**: a `req.query.X` read with no matching `parameters` entry; a `res.status(N)` whose `N` is not in the spec's `responses`.

## Fastify (JS/TS)
- **Routes**: `fastify.get('/orders', { schema }, handler)` or `fastify.route({ method, url, schema })`.
- **Schema is explicit**: `schema.params`, `schema.querystring`, `schema.body`, `schema.response[statusCode]` are already JSON Schema, map them **directly** to OpenAPI, honoring each object's `required` array and `additionalProperties`. This is the highest-fidelity source; a route with a `schema` block should match the spec exactly, and a discrepancy is real drift.

## NestJS (TS)
- **Routes**: `@Controller('orders')` + `@Get(':id')`/`@Post()`; full path is controller prefix + method path.
- **Params**: `@Param('id')`, `@Query('status')`, `@Body() dto: CreateOrderDto`.
- **Schema**: the DTO class + `class-validator` decorators (`@IsInt`, `@IsOptional`, `@IsEnum`) and `@ApiProperty({ required, nullable, type, enum })`. A field with `@IsOptional()` is not `required`. A **missing `@ApiProperty`** on a DTO field is the #1 NestJS drift source (validation enforces it, the generated spec omits it).
- **Status**: `@HttpCode(201)`, `@ApiResponse({ status })`, thrown `HttpException` subclasses (`NotFoundException` → 404).

## Koa (JS/TS)
- **Routes**: `@koa/router`: `router.get('/orders', ...)`; params via `ctx.params`, query via `ctx.query`, body via `ctx.request.body` (needs body parser).
- **Response**: `ctx.body = obj; ctx.status = 201`. Same validator-as-schema rule as Express.

## FastAPI (Python)
- **Routes**: `@app.get('/orders/{id}')` or `@router.post(...)`. Path params are the `{name}` tokens, bound to typed function args.
- **Params**: function signature, `status: str | None = None` is an optional query param; `id: int` in the path is a required path param; `body: CreateOrder` (a Pydantic model) is the request body.
- **Required/nullable**: a parameter/field with a default (`= None`, `Optional[...]`, `| None`) is optional; without a default it is required. `response_model=OrderOut` declares the response schema; `response_model_exclude_none` etc. affect the emitted shape.
- **Status**: `status_code=201` on the decorator; `raise HTTPException(status_code=409)` adds a status the spec must list.

## Django REST Framework (Python)
- **Routes**: `urls.py` / routers (`router.register('orders', OrderViewSet)`); or explicit `path('orders/', view)`. `*_views.py`/`views.py` hold the logic.
- **Request/response fields**: the **serializer**: `fields`, `required=`, `allow_null=`, `read_only=` (response-only), `write_only=` (request-only). `read_only` fields belong in the response schema but not the request; `write_only` the reverse.
- **Status**: `Response(data, status=status.HTTP_201_CREATED)`, `ValidationError` → 400. `get_queryset`/`filter_backends` reveal query params (`filterset_fields`, `search_fields`).

## Flask (Python)
- **Routes**: `@app.route('/orders/<int:id>', methods=['GET','POST'])`, blueprints `@bp.route`.
- **Schema**: usually `marshmallow`/`pydantic`/`webargs` (`@use_args(schema)`); the schema class is the request model. `request.args.get('status')` is a query param; `request.get_json()` keys are the body.
- **Status**: `return jsonify(obj), 201`; `abort(404)`.

## Spring Boot (Java/Kotlin)
- **Routes**: `@RestController` + `@GetMapping("/orders/{id}")` / `@PostMapping`; class-level `@RequestMapping` prefix.
- **Params**: `@PathVariable`, `@RequestParam(required=false)`, `@RequestBody OrderRequest`.
- **Schema**: the DTO fields + Bean Validation (`@NotNull`, `@Size`, `@Pattern`, `@Min/@Max`); Jackson annotations (`@JsonProperty(required=…)`, `@JsonInclude`) affect the JSON shape.
- **Status**: `@ResponseStatus(HttpStatus.CREATED)`, `ResponseEntity.status(409)`, thrown `@ResponseStatus`-annotated exceptions.

## Go net/http & Gin
- **Routes**: `mux.HandleFunc("/orders", h)` / `http.HandleFunc`; Gin `r.GET("/orders/:id", h)`, groups via `r.Group("/v1")`.
- **Params**: `r.URL.Query().Get("status")`, `c.Query("status")`, `c.Param("id")`.
- **Schema**: the request struct with `json:` and `binding:`/`validate:` tags (`binding:"required"` → required); `c.ShouldBindJSON(&req)`. Response struct is what is passed to `c.JSON(code, obj)` / `json.NewEncoder(w).Encode(obj)`.
- **Status**: `c.JSON(http.StatusConflict, ...)`, `w.WriteHeader(409)`.

## Rails (Ruby)
- **Routes**: `config/routes.rb` (`resources :orders`, `get '/orders/:id'`); controller actions in `*_controller.rb`.
- **Request fields**: **strong params**: `params.require(:order).permit(:total, :status)` is the accepted request body; a permitted key not in the spec (or vice versa) is drift. Query params via `params[:status]`.
- **Response**: `render json: obj, status: :created`; the serializer (`ActiveModel::Serializer`, `jbuilder`, `blueprinter`) defines the response fields.
- **Status**: `render ..., status: :conflict` / `head :no_content`.

## GraphQL (SDL vs resolvers)
- **Schema (SDL)**: `type Order { id: ID! total: Int status: OrderStatus }`, `input CreateOrderInput { ... }`, `enum OrderStatus { OPEN PAID }`, and field args `orders(status: OrderStatus): [Order!]!`. `!` means non-null.
- **Code side**: resolver signatures and code-first builders, Nexus (`objectType`, `t.nonNull.field`), TypeGraphQL (`@ObjectType`, `@Field`), Strawberry (`@strawberry.type`), gqlgen (generated models + resolvers), graphql-ruby (`field ...`).
- **Drift tells**: a resolver returns a field not in the SDL, an input arg the resolver ignores, or a nullability mismatch (SDL says `Int!`, resolver can return null). GraphQL's own compatibility rules differ from REST, see `breaking-change-rules.md`.

## Cross-framework normalization
- Treat `/users/{id}`, `/users/:id`, `/users/<int:id>`, and `orders(id: ID!)` as the **same** endpoint keyed by its template; never diff raw path strings.
- A request field that is validation-required but spec-optional (or vice versa) is drift even when the field name matches, compare `required` membership, not just presence.
- When a schema is composed at runtime (dynamic route registration, `**kwargs`, `interface{}`, spread DTOs) and cannot be resolved statically, mark the endpoint **unresolved** rather than inferring a shape.
