import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from './client.js';

function mockFetch(status: number, body: unknown, headers?: Record<string, string>) {
	return vi.fn<typeof fetch>().mockResolvedValue(
		new Response(status === 204 ? null : JSON.stringify(body), {
			status,
			headers: { 'content-type': 'application/json', ...headers },
		}),
	);
}

describe('createClient', () => {
	const TOKEN = 'pb_test_token_123';
	let client: ReturnType<typeof createClient>;

	beforeEach(() => {
		client = createClient(TOKEN);
	});

	// --- 正常系 ---

	it('GET request sends correct headers', async () => {
		const fetch = mockFetch(200, { data: [] });
		client = createClient(TOKEN, { fetch });

		await client.get('/features');

		expect(fetch).toHaveBeenCalledOnce();
		const [url, init] = fetch.mock.calls[0]!;
		expect(url).toBe('https://api.productboard.com/features');
		expect(init?.method).toBe('GET');
		expect(init?.headers).toMatchObject({
			Authorization: `Bearer ${TOKEN}`,
			'Content-Type': 'application/json',
			'X-Version': '1',
		});
		expect(init?.body).toBeUndefined();
	});

	it('POST request sends JSON body wrapped in data', async () => {
		const fetch = mockFetch(201, { data: { id: '1' } });
		client = createClient(TOKEN, { fetch });

		await client.post('/features', { name: 'My Feature' });

		const [, init] = fetch.mock.calls[0]!;
		expect(init?.method).toBe('POST');
		expect(JSON.parse(init?.body as string)).toEqual({
			data: { name: 'My Feature' },
		});
	});

	it('PATCH request sends JSON body wrapped in data', async () => {
		const fetch = mockFetch(200, { data: { id: '1' } });
		client = createClient(TOKEN, { fetch });

		await client.patch('/features/abc', { name: 'Updated' });

		const [url, init] = fetch.mock.calls[0]!;
		expect(url).toBe('https://api.productboard.com/features/abc');
		expect(init?.method).toBe('PATCH');
		expect(JSON.parse(init?.body as string)).toEqual({
			data: { name: 'Updated' },
		});
	});

	it('PUT request sends JSON body wrapped in data', async () => {
		const fetch = mockFetch(200, { data: { id: '1' } });
		client = createClient(TOKEN, { fetch });

		await client.put('/features/abc', { name: 'Replaced' });

		const [url, init] = fetch.mock.calls[0]!;
		expect(url).toBe('https://api.productboard.com/features/abc');
		expect(init?.method).toBe('PUT');
		expect(JSON.parse(init?.body as string)).toEqual({
			data: { name: 'Replaced' },
		});
	});

	it('POST without body sends no body', async () => {
		const fetch = mockFetch(200, { data: {} });
		client = createClient(TOKEN, { fetch });

		await client.post('/notes/n1/tags/t1');

		const [, init] = fetch.mock.calls[0]!;
		expect(init?.method).toBe('POST');
		expect(init?.body).toBeUndefined();
	});

	it('DELETE request sends no body', async () => {
		const fetch = mockFetch(204, null);
		client = createClient(TOKEN, { fetch });

		await client.delete('/features/abc');

		const [, init] = fetch.mock.calls[0]!;
		expect(init?.method).toBe('DELETE');
		expect(init?.body).toBeUndefined();
	});

	it('GET with query params appends to URL', async () => {
		const fetch = mockFetch(200, { data: [] });
		client = createClient(TOKEN, { fetch });

		await client.get('/features', { pageLimit: 10, archived: true });

		const [url] = fetch.mock.calls[0]!;
		const parsed = new URL(url as string);
		expect(parsed.searchParams.get('pageLimit')).toBe('10');
		expect(parsed.searchParams.get('archived')).toBe('true');
	});

	it('returns parsed JSON body on success', async () => {
		const body = { data: [{ id: '1', name: 'Feature A' }] };
		const fetch = mockFetch(200, body);
		client = createClient(TOKEN, { fetch });

		const result = await client.get('/features');
		expect(result).toEqual(body);
	});

	// --- エラー系 ---

	it('401 throws authentication error', async () => {
		const fetch = mockFetch(401, { message: 'Unauthorized' });
		client = createClient(TOKEN, { fetch });

		await expect(client.get('/features')).rejects.toMatchObject({
			status: 401,
		});
	});

	it('403 throws access denied error', async () => {
		const fetch = mockFetch(403, { message: 'Forbidden' });
		client = createClient(TOKEN, { fetch });

		await expect(client.get('/features')).rejects.toMatchObject({
			status: 403,
		});
	});

	it('404 throws not found error', async () => {
		const fetch = mockFetch(404, { message: 'Not found' });
		client = createClient(TOKEN, { fetch });

		await expect(client.get('/features/nonexistent')).rejects.toMatchObject({
			status: 404,
		});
	});

	it('429 throws rate limit error with retry-after', async () => {
		const fetch = mockFetch(429, { message: 'Too many requests' }, { 'retry-after': '30' });
		client = createClient(TOKEN, { fetch });

		await expect(client.get('/features')).rejects.toMatchObject({
			status: 429,
			retryAfter: 30,
		});
	});

	it('500 throws server error', async () => {
		const fetch = mockFetch(500, { message: 'Internal server error' });
		client = createClient(TOKEN, { fetch });

		await expect(client.get('/features')).rejects.toMatchObject({
			status: 500,
		});
	});

	it('network error (fetch rejects) propagates', async () => {
		const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'));
		client = createClient(TOKEN, { fetch: fetchFn });

		await expect(client.get('/features')).rejects.toThrow('fetch failed');
	});

	// --- baseUrl制限 ---

	it('rejects non-productboard baseUrl', () => {
		expect(() => createClient(TOKEN, { baseUrl: 'https://evil.com' })).toThrow();
	});

	it('accepts valid productboard baseUrl', () => {
		expect(() => createClient(TOKEN, { baseUrl: 'https://api.productboard.com' })).not.toThrow();
	});
});
