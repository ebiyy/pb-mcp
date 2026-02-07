#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createPbMcpServer } from './server.js';

export { createPbMcpServer } from './server.js';

const token = process.env.PRODUCTBOARD_API_TOKEN;
if (!token) {
	process.stderr.write('Error: PRODUCTBOARD_API_TOKEN environment variable is required\n');
	process.exit(1);
}

const { callTool, listTools } = createPbMcpServer(token);

const server = new Server({ name: 'pb-mcp', version: '0.1.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: listTools(),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { content } = await callTool(request.params.name, request.params.arguments ?? {});
	return { content };
});

const transport = new StdioServerTransport();
await server.connect(transport);
