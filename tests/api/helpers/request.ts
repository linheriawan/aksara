/**
 * Consistent HTTP request helper for tests
 */

import { TEST_CONFIG } from '../../setup';

export interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	body?: any;
	headers?: HeadersInit;
	sessionToken?: string;
}

export interface ApiResponse<T = any> {
	ok: boolean;
	status: number;
	data?: T;
	error?: string;
	headers: Headers;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
	path: string,
	options: RequestOptions = {}
): Promise<ApiResponse<T>> {
	const { method = 'GET', body, headers = {}, sessionToken } = options;

	const url = path.startsWith('http') ? path : `${TEST_CONFIG.baseUrl}${path}`;

	const requestHeaders: HeadersInit = {
		'Content-Type': 'application/json',
		...headers
	};

	// Add session cookie if provided
	if (sessionToken) {
		requestHeaders['Cookie'] = `session=${sessionToken}`;
	}

	const requestOptions: RequestInit = {
		method,
		headers: requestHeaders
	};

	if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
		requestOptions.body = JSON.stringify(body);
	}

	try {
		const response = await fetch(url, requestOptions);

		let data: T | undefined;
		let error: string | undefined;

		const contentType = response.headers.get('content-type');
		if (contentType?.includes('application/json')) {
			const json = await response.json();
			if (response.ok) {
				data = json;
			} else {
				error = json.error || json.message || 'Unknown error';
			}
		} else {
			const text = await response.text();
			if (response.ok) {
				data = text as any;
			} else {
				error = text;
			}
		}

		return {
			ok: response.ok,
			status: response.status,
			data,
			error,
			headers: response.headers
		};
	} catch (err: any) {
		return {
			ok: false,
			status: 0,
			error: err.message,
			headers: new Headers()
		};
	}
}

/**
 * Convenience methods
 */
export const api = {
	get: <T = any>(path: string, sessionToken?: string) =>
		apiRequest<T>(path, { method: 'GET', sessionToken }),

	post: <T = any>(path: string, body: any, sessionToken?: string) =>
		apiRequest<T>(path, { method: 'POST', body, sessionToken }),

	put: <T = any>(path: string, body: any, sessionToken?: string) =>
		apiRequest<T>(path, { method: 'PUT', body, sessionToken }),

	delete: <T = any>(path: string, sessionToken?: string) =>
		apiRequest<T>(path, { method: 'DELETE', sessionToken }),

	patch: <T = any>(path: string, body: any, sessionToken?: string) =>
		apiRequest<T>(path, { method: 'PATCH', body, sessionToken })
};
