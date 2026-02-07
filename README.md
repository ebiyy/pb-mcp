# pb-mcp

A lightweight [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server for the [Productboard REST API](https://developer.productboard.com/).

## Features

- 54 tools covering all core Productboard resources
- Native `fetch` — no HTTP library dependencies
- Declarative tool definitions — tools are data, not code
- Map-based 1:1 routing — no ambiguous `includes()` matching
- Single dependency: `@modelcontextprotocol/sdk`

## Installation

```bash
npm install pb-mcp
```

Or from source:

```bash
git clone https://github.com/ebiyy/pb-mcp.git
cd pb-mcp
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "productboard": {
      "command": "node",
      "args": ["/path/to/pb-mcp/build/index.js"],
      "env": {
        "PRODUCTBOARD_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### API Token

Get your token from **Productboard > Settings > Integrations > Public API**.

## Tools

54 tools organized across 11 resource categories. Each tool maps directly to a [Productboard API](https://developer.productboard.com/) endpoint.

| Category | Tools | Operations |
|---|---|---|
| **Features** | 5 | List, get, create, update, delete |
| **Notes** | 8 | CRUD + tags (list, add, remove) |
| **Companies** | 5 | List, get, create, update, delete |
| **Objectives** | 5 | List, get, create, update, delete |
| **Initiatives** | 5 | List, get, create, update, delete |
| **Key Results** | 5 | List, get, create, update, delete |
| **Releases** | 5 | List, get, create, update, delete |
| **Webhooks** | 4 | List, get, create, delete |
| **Users** | 5 | List, get, create, update, delete |
| **Products** | 3 | List, get, update |
| **Components** | 4 | List, get, create, update |

Full API reference: [developer.productboard.com](https://developer.productboard.com/)

## Architecture

```
src/
├── client.ts    # fetch-based API client (auth, errors, rate limit)
├── tools.ts     # declarative ToolDef[] array
├── server.ts    # MCP server with generic handler
└── index.ts     # entry point
```

**Design decisions:**

- **ToolDef as data** — each tool is a plain object (`{ name, method, path, inputSchema, wrap }`), not a function. Adding a new endpoint means adding one object.
- **Map routing** — `Map<name, ToolDef>` gives O(1) lookup with no ambiguity.
- **Path params from args** — `{id}`, `{noteId}` etc. in paths are replaced from `args`, remaining args become query params (GET) or body (POST/PATCH).
- **McpError directly** — API errors convert straight to `McpError`. No custom error hierarchy.

## Development

```bash
npm test            # run tests
npm run test:watch  # watch mode
npm run typecheck   # tsc --noEmit
npm run check       # biome lint + format check
npm run quality     # typecheck + check + test
```

## Productboard API Quirks

Undocumented behaviors and gotchas discovered through trial and error with the Productboard REST API. These apply to any direct Productboard API usage, not just pb-mcp.

### description requires HTML

The `description` field for Product, Component, Objective, Release, and Feature must be HTML-formatted. Passing plain text causes an `element-only content type` error.

```
// Bad
"description": "This is plain text"

// Good
"description": "<p>This is text wrapped in HTML</p>"
```

For Objectives, omitting the `<p>` tag causes `Element 'body' cannot have character [children]` error.

### `<` `>` in description causes XML parse errors

Using angle brackets like `< 3s` or `> 50%` inside description causes the XML parser to misinterpret them as tags.

```
// Bad
"description": "<p>response < 3s, error rate < 1%</p>"

// Good
"description": "<p>response under 3s, error rate under 1%</p>"
```

### Feature parent format

The documented `{id, type}` format does not work. A nested object format is required.

```
// Bad
"parent": {"id": "xxx", "type": "component"}

// Good
"parent": {"component": {"id": "xxx"}}
// or
"parent": {"product": {"id": "xxx"}}
// or
"parent": {"feature": {"id": "xxx"}}
```

### Feature status accepts either id or name, not both

Specifying both causes `Both status.id and status.name were specified` error.

```
// Bad
"status": {"id": "0c36a91a-...", "name": "In progress"}

// Good
"status": {"id": "0c36a91a-..."}
```

### Release state enum mismatch

The actual API accepts different values than what the documentation or MCP tool definitions specify.

```
// Bad (values from tool definitions)
"state": "in_progress"
"state": "future"

// Good (values the API actually accepts)
"state": "in-progress"
"state": "upcoming"
"state": "completed"
"state": null
```

### create_note always returns Validation error

Even a minimal payload with only title + content returns `Validation error`. Adding optional fields (tags, ownerEmail, sourceOrigin), using HTML content, or ASCII-only content all produce the same result. Root cause unknown — possibly a Pro plan limitation or token permission issue.

```
// Still errors
{"title": "Test", "content": "Hello world"}
```

No workaround available. If Notes CRUD is required, use the Web UI manually or verify your API token permissions.

### Retrieving Feature Status IDs

The `status.id` required for Feature creation must be fetched in advance using `get_feature_statuses`. These are workspace-specific UUIDs that differ per environment.

### Release requires a Release Group first

`releaseGroupId` is required when creating a Release. Create a Release Group with `create_release_group` before creating a Release.

## Observed API Responses

Actual response shapes captured during a Pro plan session (2026-02). Obtained via MCP tool calls. Error responses are MCP-layer representations — raw HTTP status codes were not visible through the MCP layer.

### Successful responses

All successful create/update responses share the `{ data: { ... } }` wrapper.

**create_feature**

```json
{
  "data": {
    "id": "<uuid>",
    "name": "<name>",
    "description": "<p>...</p>\n",
    "type": "feature",
    "status": {
      "id": "<status-uuid>",
      "name": "In progress"
    },
    "parent": {
      "component": {
        "id": "<component-uuid>",
        "links": { "self": "https://api.productboard.com/components/<component-uuid>" }
      }
    },
    "links": {
      "self": "https://api.productboard.com/features/<uuid>",
      "html": "https://<workspace>.productboard.com/entity-detail/features/<uuid>"
    },
    "archived": false,
    "timeframe": { "startDate": "none", "endDate": "none", "granularity": "none" },
    "owner": null,
    "createdAt": "<ISO8601>",
    "updatedAt": "<ISO8601>",
    "lastHealthUpdate": null
  }
}
```

**create_objective** — returns minimal data (id + links only), unlike other entities.

```json
{
  "data": { "id": "<uuid>" },
  "links": {
    "self": "https://api.productboard.com/objectives/<uuid>",
    "html": "https://<workspace>.productboard.com/data/objectives?d=<base64>"
  }
}
```

**create_release**

```json
{
  "data": {
    "id": "<uuid>",
    "name": "<name>",
    "description": "<p>...</p>\n",
    "archived": false,
    "releaseGroup": {
      "id": "<release-group-uuid>",
      "links": { "self": "https://api.productboard.com/release-groups/<release-group-uuid>" }
    },
    "timeframe": { "startDate": "none", "endDate": "none", "granularity": "none" },
    "state": "in-progress",
    "links": { "self": "https://api.productboard.com/releases/<uuid>" }
  }
}
```

**update_product**

```json
{
  "data": {
    "id": "<uuid>",
    "name": "<name>",
    "description": "<p>...</p>\n",
    "links": {
      "self": "https://api.productboard.com/products/<uuid>",
      "html": "https://<workspace>.productboard.com/entity-detail/features/<uuid>"
    },
    "owner": { "email": "<email>" },
    "createdAt": "<ISO8601>",
    "updatedAt": "<ISO8601>"
  }
}
```

**create_component**

```json
{
  "data": {
    "id": "<uuid>",
    "name": "<name>",
    "description": "<p>...</p>\n",
    "links": {
      "self": "https://api.productboard.com/components/<uuid>",
      "html": "https://<workspace>.productboard.com/entity-detail/features/<uuid>"
    },
    "parent": {
      "product": {
        "id": "<product-uuid>",
        "links": { "self": "https://api.productboard.com/products/<product-uuid>" }
      }
    },
    "owner": null,
    "createdAt": "<ISO8601>",
    "updatedAt": "<ISO8601>"
  }
}
```

**create_release_group**

```json
{
  "data": {
    "id": "<uuid>",
    "name": "<name>",
    "description": "<p>...</p>\n",
    "archived": false,
    "links": { "self": "https://api.productboard.com/release-groups/<uuid>" }
  }
}
```

### Error responses (MCP layer)

Raw HTTP error responses were not visible. These are the MCP-level error messages observed:

| Trigger | MCP error code | Message |
|---|---|---|
| Plain text description (Objective) | `-32600` | `Element 'body' cannot have character [children], because the type's content type is element-only.` |
| Both status.id and status.name | `-32603` | `Both status.id an status.name were specified, please specify just one of them.` |
| create_note (any payload) | `-32600` | `Validation error` |

MCP error `-32600` maps to JSON-RPC "Invalid Request". Whether the underlying HTTP status is 400, 422, or something else is unknown — the MCP layer does not expose it.

### What is NOT known

| Item | Status |
|---|---|
| Raw HTTP status codes for errors | Hidden by MCP layer |
| Error response JSON body structure | Hidden by MCP layer |
| API token format | Not examined in this session |
| Root cause of Notes API failure | Pro plan confirmed, but whether it's a plan or token permission issue is unconfirmed |

## License

MIT
