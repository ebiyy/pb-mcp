import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from './client.js';
import { type ToolDef, toolDefs } from './tools.js';

const PATH_PARAM_RE = /\{(\w+)\}/g;

interface McpContent {
	type: 'text';
	text: string;
}

interface McpToolResponse {
	content: McpContent[];
}

interface McpToolInfo {
	name: string;
	description: string;
	inputSchema: ToolDef['inputSchema'];
}

export function createPbMcpServer(token: string, options?: { fetch?: typeof fetch }) {
	const client = options?.fetch
		? createClient(token, { fetch: options.fetch })
		: createClient(token);
	const toolMap = new Map<string, ToolDef>(toolDefs.map((t) => [t.name, t]));

	async function callTool(name: string, args: Record<string, unknown>): Promise<McpToolResponse> {
		const def = toolMap.get(name);
		if (!def) {
			throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
		}

		const remaining = { ...args };

		const path = def.path.replace(PATH_PARAM_RE, (_, param: string) => {
			const value = remaining[param];
			delete remaining[param];
			return String(value);
		});

		try {
			let data: unknown;
			switch (def.method) {
				case 'GET':
					data = await client.get(path, remaining);
					break;
				case 'POST':
					data = await client.post(path, remaining);
					break;
				case 'PATCH':
					data = await client.patch(path, remaining);
					break;
				case 'PUT':
					data = await client.post(path, remaining);
					break;
				case 'DELETE':
					data = await client.delete(path);
					break;
			}

			return {
				content: [{ type: 'text', text: JSON.stringify(data) }],
			};
		} catch (error: unknown) {
			if (error instanceof McpError) throw error;
			const status =
				error instanceof Error && 'status' in error
					? (error as Error & { status: number }).status
					: undefined;
			throw new McpError(
				status === 404 ? ErrorCode.InvalidRequest : ErrorCode.InternalError,
				error instanceof Error ? error.message : String(error),
			);
		}
	}

	function listTools(): McpToolInfo[] {
		return toolDefs.map((t) => ({
			name: t.name,
			description: t.description,
			inputSchema: t.inputSchema,
		}));
	}

	return { callTool, listTools };
}
