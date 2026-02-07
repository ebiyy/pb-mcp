const DEFAULT_BASE_URL = 'https://api.productboard.com';

class ApiError extends Error {
	readonly status: number;
	readonly retryAfter?: number;

	constructor(status: number, message: string, retryAfter?: number) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		if (retryAfter !== undefined) {
			this.retryAfter = retryAfter;
		}
	}
}

interface ClientOptions {
	baseUrl?: string;
	fetch?: typeof fetch;
}

export function createClient(token: string, options?: ClientOptions) {
	const baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
	const fetchFn = options?.fetch ?? globalThis.fetch;

	if (!new URL(baseUrl).hostname.endsWith('productboard.com')) {
		throw new Error('Invalid baseUrl: must be a productboard.com domain');
	}

	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
		'X-Version': '1',
	};

	async function request(
		method: string,
		path: string,
		body?: Record<string, unknown>,
		params?: Record<string, unknown>,
	): Promise<unknown> {
		let url = `${baseUrl}${path}`;

		if (params) {
			const searchParams = new URLSearchParams();
			for (const [key, value] of Object.entries(params)) {
				if (value !== undefined && value !== null) {
					searchParams.set(key, String(value));
				}
			}
			const qs = searchParams.toString();
			if (qs) url += `?${qs}`;
		}

		const init: RequestInit = { method, headers };

		if (body !== undefined) {
			init.body = JSON.stringify({ data: body });
		}

		const response = await fetchFn(url, init);

		if (!response.ok) {
			const retryAfterHeader = response.headers.get('retry-after');
			const errorBody: Record<string, unknown> = (await response
				.json()
				.catch(() => ({}))) as Record<string, unknown>;
			throw new ApiError(
				response.status,
				typeof errorBody.message === 'string' ? errorBody.message : `HTTP ${response.status}`,
				retryAfterHeader ? Number(retryAfterHeader) : undefined,
			);
		}

		if (response.status === 204) {
			return null;
		}

		return response.json();
	}

	return {
		get(path: string, params?: Record<string, unknown>) {
			return request('GET', path, undefined, params);
		},
		post(path: string, body?: Record<string, unknown>) {
			return request('POST', path, body);
		},
		put(path: string, body?: Record<string, unknown>) {
			return request('PUT', path, body);
		},
		patch(path: string, body?: Record<string, unknown>) {
			return request('PATCH', path, body);
		},
		delete(path: string) {
			return request('DELETE', path);
		},
	};
}
