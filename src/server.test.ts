import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPbMcpServer } from './server.js';
import { toolDefs } from './tools.js';

// MCP SDK types
interface McpToolCall {
	name: string;
	arguments?: Record<string, unknown>;
}

interface McpResponse {
	content: Array<{ type: string; text: string }>;
}

function mockFetch(status: number, body: unknown) {
	return vi.fn<typeof fetch>().mockResolvedValue(
		new Response(status === 204 ? null : JSON.stringify(body), {
			status,
			headers: { 'content-type': 'application/json' },
		}),
	);
}

describe('createPbMcpServer', () => {
	const TOKEN = 'pb_test_token';

	it('creates a server instance', () => {
		const server = createPbMcpServer(TOKEN);
		expect(server).toBeDefined();
	});

	it('lists all tools from toolDefs', async () => {
		const server = createPbMcpServer(TOKEN);
		const tools = await server.listTools();

		expect(tools.length).toBe(toolDefs.length);
		for (const def of toolDefs) {
			const found = tools.find((t: { name: string }) => t.name === def.name);
			expect(found, `tool ${def.name} not listed`).toBeDefined();
		}
	});

	it('tool list includes name, description, inputSchema', async () => {
		const server = createPbMcpServer(TOKEN);
		const tools = await server.listTools();

		for (const tool of tools) {
			expect(tool.name).toBeTruthy();
			expect(tool.description).toBeTruthy();
			expect(tool.inputSchema).toBeDefined();
		}
	});
});

describe('tool execution', () => {
	const TOKEN = 'pb_test_token';

	// --- GET ツール ---

	it('get_features calls GET /features and returns MCP response', async () => {
		const apiResponse = { data: [{ id: '1', name: 'Feature A' }] };
		const fetch = mockFetch(200, apiResponse);
		const server = createPbMcpServer(TOKEN, { fetch });

		const result = await server.callTool('get_features', {});

		expect(fetch).toHaveBeenCalledOnce();
		const [url, init] = fetch.mock.calls[0]!;
		expect(url).toContain('/features');
		expect(init?.method).toBe('GET');

		expect(result.content).toHaveLength(1);
		expect(result.content[0]!.type).toBe('text');
		const parsed = JSON.parse(result.content[0]!.text);
		expect(parsed.data).toEqual(apiResponse.data);
	});

	it('get_feature calls GET /features/{id}', async () => {
		const apiResponse = { data: { id: 'abc', name: 'Feature B' } };
		const fetch = mockFetch(200, apiResponse);
		const server = createPbMcpServer(TOKEN, { fetch });

		const result = await server.callTool('get_feature', { id: 'abc' });

		const [url] = fetch.mock.calls[0]!;
		expect(url).toContain('/features/abc');
	});

	// --- POST ツール ---

	it('create_feature calls POST /features with body', async () => {
		const apiResponse = { data: { id: '2', name: 'New Feature' } };
		const fetch = mockFetch(201, apiResponse);
		const server = createPbMcpServer(TOKEN, { fetch });

		const result = await server.callTool('create_feature', {
			name: 'New Feature',
			status: { id: 's1', name: 'new' },
		});

		const [url, init] = fetch.mock.calls[0]!;
		expect(url).toContain('/features');
		expect(init?.method).toBe('POST');

		const body = JSON.parse(init?.body as string);
		expect(body.data.name).toBe('New Feature');

		expect(result.content[0]!.type).toBe('text');
	});

	// --- PATCH ツール ---

	it('update_feature calls PATCH /features/{id}', async () => {
		const apiResponse = { data: { id: 'abc', name: 'Updated' } };
		const fetch = mockFetch(200, apiResponse);
		const server = createPbMcpServer(TOKEN, { fetch });

		await server.callTool('update_feature', { id: 'abc', name: 'Updated' });

		const [url, init] = fetch.mock.calls[0]!;
		expect(url).toContain('/features/abc');
		expect(init?.method).toBe('PATCH');
	});

	// --- DELETE ツール ---

	it('delete_feature calls DELETE /features/{id}', async () => {
		const fetch = mockFetch(204, null);
		const server = createPbMcpServer(TOKEN, { fetch });

		await server.callTool('delete_feature', { id: 'abc' });

		const [url, init] = fetch.mock.calls[0]!;
		expect(url).toContain('/features/abc');
		expect(init?.method).toBe('DELETE');
	});

	// --- bodyStyle: 'omit' (ボディなし POST) ---

	it('add_note_tag (bodyStyle: omit) sends POST without body', async () => {
		const fetch = mockFetch(200, { data: {} });
		const server = createPbMcpServer(TOKEN, { fetch });

		await server.callTool('add_note_tag', { noteId: 'n1', tagName: 'urgent' });

		const [url, init] = fetch.mock.calls[0]!;
		expect(url).toContain('/notes/n1/tags/urgent');
		expect(init?.method).toBe('POST');
		expect(init?.body).toBeUndefined();
	});

	// --- エラーハンドリング ---

	it('API error returns MCP error response', async () => {
		const fetch = mockFetch(404, { message: 'Not found' });
		const server = createPbMcpServer(TOKEN, { fetch });

		await expect(server.callTool('get_feature', { id: 'bad' })).rejects.toMatchObject({
			code: expect.any(Number),
		});
	});

	it('unknown tool name throws MethodNotFound', async () => {
		const server = createPbMcpServer(TOKEN);

		await expect(server.callTool('nonexistent_tool', {})).rejects.toMatchObject({
			code: expect.any(Number),
		});
	});

	// --- レスポンス形式 ---

	it('all responses follow MCP content format', async () => {
		const fetch = mockFetch(200, { data: [] });
		const server = createPbMcpServer(TOKEN, { fetch });

		const result = await server.callTool('get_features', {});

		expect(result).toHaveProperty('content');
		expect(Array.isArray(result.content)).toBe(true);
		for (const item of result.content) {
			expect(item).toHaveProperty('type', 'text');
			expect(item).toHaveProperty('text');
			expect(typeof item.text).toBe('string');
			// text must be valid JSON
			expect(() => JSON.parse(item.text)).not.toThrow();
		}
	});

	// --- path パラメータ置換 ---

	it('replaces {id} in path with args.id', async () => {
		const fetch = mockFetch(200, { data: {} });
		const server = createPbMcpServer(TOKEN, { fetch });

		await server.callTool('get_objective', { id: 'obj-123' });

		const [url] = fetch.mock.calls[0]!;
		expect(url).toContain('/objectives/obj-123');
		expect(url).not.toContain('{id}');
	});

	it('replaces {noteId} in nested path', async () => {
		const fetch = mockFetch(200, { data: [] });
		const server = createPbMcpServer(TOKEN, { fetch });

		await server.callTool('list_note_tags', { noteId: 'note-456' });

		const [url] = fetch.mock.calls[0]!;
		expect(url).toContain('/notes/note-456/tags');
	});
});
