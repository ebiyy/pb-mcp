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

## License

MIT
