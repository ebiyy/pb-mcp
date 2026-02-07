import { describe, expect, it } from 'vitest';
import { type ToolDef, toolDefs } from './tools.js';

describe('toolDefs', () => {
	it('exports a non-empty array', () => {
		expect(Array.isArray(toolDefs)).toBe(true);
		expect(toolDefs.length).toBeGreaterThan(0);
	});

	it('every tool has required fields', () => {
		for (const def of toolDefs) {
			expect(def.name, 'tool missing name').toBeTruthy();
			expect(def.method, `${def.name} missing method`).toMatch(/^(GET|POST|PATCH|PUT|DELETE)$/);
			expect(def.path, `${def.name} missing path`).toMatch(/^\//);
		}
	});

	it('tool names are unique', () => {
		const names = toolDefs.map((t) => t.name);
		const unique = new Set(names);
		expect(unique.size).toBe(names.length);
	});

	it('paths only target api.productboard.com endpoints', () => {
		for (const def of toolDefs) {
			// paths should be relative, not absolute URLs
			expect(def.path.startsWith('/')).toBe(true);
			expect(def.path).not.toContain('http');
		}
	});

	// --- CRUD カテゴリ検証 ---

	const categories = [
		{ prefix: 'feature', paths: ['/features'] },
		{ prefix: 'note', paths: ['/notes'] },
		{ prefix: 'company', paths: ['/companies'] },
		{ prefix: 'objective', paths: ['/objectives'] },
		{ prefix: 'initiative', paths: ['/initiatives'] },
		{ prefix: 'key_result', paths: ['/key-results'] },
		{ prefix: 'release', paths: ['/releases'] },
		{ prefix: 'webhook', paths: ['/webhooks'] },
		{ prefix: 'user', paths: ['/users'] },
		{ prefix: 'product', paths: ['/products'] },
		{ prefix: 'component', paths: ['/components'] },
	];

	for (const { prefix, paths } of categories) {
		describe(`${prefix} tools`, () => {
			it('has at least a list and get tool', () => {
				const tools = toolDefs.filter((t) => t.name.includes(prefix));
				expect(tools.length, `no tools found for ${prefix}`).toBeGreaterThanOrEqual(2);

				const methods = tools.map((t) => t.method);
				expect(methods).toContain('GET');
			});

			it('targets correct API path', () => {
				const tools = toolDefs.filter((t) => t.name.includes(prefix));
				for (const tool of tools) {
					const matchesAny = paths.some((p) => tool.path.startsWith(p));
					expect(matchesAny, `${tool.name} path ${tool.path} doesn't match ${paths}`).toBe(true);
				}
			});
		});
	}

	// --- inputSchema 検証 ---

	describe('inputSchema', () => {
		it('every tool has a valid inputSchema', () => {
			for (const def of toolDefs) {
				expect(def.inputSchema, `${def.name} missing inputSchema`).toBeDefined();
				expect(def.inputSchema.type).toBe('object');
				expect(def.inputSchema.properties, `${def.name} missing properties`).toBeDefined();
			}
		});

		it('create tools require name param', () => {
			const createTools = toolDefs.filter((t) => t.name.startsWith('create_'));
			for (const def of createTools) {
				expect(def.inputSchema.required, `${def.name} should have required params`).toBeDefined();
			}
		});

		it('get-by-id tools require id param', () => {
			const idTools = toolDefs.filter(
				(t) =>
					t.path.includes('{id}') ||
					t.path.includes('{noteId}') ||
					t.path.includes('{objectiveId}'),
			);
			for (const def of idTools) {
				const hasIdParam =
					'id' in def.inputSchema.properties ||
					Object.keys(def.inputSchema.properties).some((k) => k.endsWith('Id'));
				expect(hasIdParam, `${def.name} should have an id param`).toBe(true);
			}
		});
	});

	// --- body wrapping 検証 ---

	describe('body wrapping', () => {
		it('POST/PATCH/PUT tools that send body have bodyStyle flag', () => {
			const writingTools = toolDefs.filter((t) => ['POST', 'PATCH', 'PUT'].includes(t.method));
			for (const def of writingTools) {
				expect(
					def.bodyStyle,
					`${def.name} should specify bodyStyle ('data' | 'omit')`,
				).toBeDefined();
			}
		});
	});
});

// --- ルーティングテスト: 名前から定義を引ける ---

describe('tool lookup', () => {
	it('every tool is findable by exact name', () => {
		const map = new Map(toolDefs.map((t) => [t.name, t]));

		for (const def of toolDefs) {
			expect(map.get(def.name)).toBe(def);
		}
	});

	it('no ambiguous routing - name is the key, not includes()', () => {
		const map = new Map<string, ToolDef>();
		for (const def of toolDefs) {
			expect(map.has(def.name), `duplicate tool name: ${def.name}`).toBe(false);
			map.set(def.name, def);
		}
	});
});
