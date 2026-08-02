# Tool schema patterns

## A well-designed tool (TypeScript, SDK + zod)
One powerful search tool, variation via parameters, full descriptions, honest annotations, bounded output.
```ts
server.registerTool(
  "search_orders",
  {
    title: "Search orders",
    description:
      "Search orders by any combination of status, customer, and date. " +
      "Returns at most `limit` orders, newest first, with a cursor for the next page.",
    inputSchema: {
      status: z.enum(["open", "paid", "shipped", "cancelled"]).optional()
        .describe("Filter to this order status. Omit for all statuses."),
      customerId: z.string().optional().describe("Exact customer id to filter by."),
      since: z.string().datetime().optional()
        .describe("ISO-8601 instant; only orders created on or after it."),
      limit: z.number().int().min(1).max(100).default(20)
        .describe("Max orders to return (1-100)."),
      cursor: z.string().optional().describe("Opaque cursor from a previous page."),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  },
  async (args) => {
    try {
      const page = await orders.search(args);       // returns { items, nextCursor }
      return { content: [{ type: "text", text: JSON.stringify(page) }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: `search failed: ${safeMessage(e)}` }] };
    }
  },
);
```
Notes: closed set → `enum`; `limit` bounded; every field `.describe()`d; result paginated via `cursor`/`nextCursor`; error is structured and `safeMessage` strips internals.

## A destructive tool, annotated honestly
```ts
server.registerTool(
  "cancel_order",
  {
    title: "Cancel order",
    description: "Cancel an order that is not yet shipped. Irreversible.",
    inputSchema: { orderId: z.string().describe("Order id to cancel.") },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  async ({ orderId }) => { /* ... */ },
);
```
`destructiveHint: true` lets the host require user confirmation. Marking this `readOnlyHint` would be a critical design bug.

## Python (FastMCP)
```python
from typing import Literal, Optional

@mcp.tool(annotations={"readOnlyHint": True, "idempotentHint": True})
def search_docs(
    query: str,                                   # described via docstring/args below
    section: Optional[Literal["guide", "api", "faq"]] = None,
    limit: int = 20,
) -> dict:
    """Search documentation. `query` is full-text; `section` filters to one area;
    `limit` is 1-100. Returns {items, nextCursor}."""
    if not 1 <= limit <= 100:
        return {"isError": True, "message": "limit must be between 1 and 100"}
    return docs.search(query=query, section=section, limit=limit)
```

## Annotation matrix
| Tool kind | readOnlyHint | destructiveHint | idempotentHint |
|---|---|---|---|
| search / get / list | true | false | true |
| create (new resource) | false | false | false |
| update / upsert | false | false | true |
| delete / cancel / charge | false | **true** | true |
| trigger external job | false | depends | depends |

## Structured error shape
```json
{ "isError": true, "content": [{ "type": "text", "text": "order 123 not found" }] }
```
- Clean message the model can act on. No stack trace, SQL, credentials, internal hostnames, or file paths.
- `safeMessage(e)` should map known errors to friendly text and collapse everything else to a generic "internal error" + a server-side log id, never the raw exception.

## Smells to flag in an audit
- Ten tools that are one tool with a filter (`list_open_orders`, `list_paid_orders`, …).
- A parameter with no `description`, or no `enum` for an obviously closed set.
- `additionalProperties` left open on a strict tool.
- A destructive tool with `readOnlyHint: true` or no annotations.
- Unbounded results (no `limit`/pagination) or prose dumps of large data.
- Error results containing stack traces, SQL text, or secrets.
