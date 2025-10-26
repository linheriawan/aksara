/**
 * Authentication helpers for tests
 */

import { TEST_CONFIG } from '../../setup';

interface LoginResponse {
	success: boolean;
	token?: string;
	user?: any;
	error?: string;
}

/**
 * Login and get session cookie
 */
export async function login(
	email: string = TEST_CONFIG.testUser.email,
	password: string = TEST_CONFIG.testUser.password
): Promise<string> {
	const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ email, password })
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Login failed: ${error}`);
	}

	// Extract session cookie
	const setCookie = response.headers.get('set-cookie');
	if (!setCookie) {
		throw new Error('No session cookie received');
	}

	// Parse cookie to get just the session value
	const sessionMatch = setCookie.match(/session=([^;]+)/);
	if (!sessionMatch) {
		throw new Error('Could not parse session cookie');
	}

	return sessionMatch[1];
}

/**
 * Logout and clear session
 */
export async function logout(sessionToken: string): Promise<void> {
	await fetch(`${TEST_CONFIG.baseUrl}/api/auth/logout`, {
		method: 'POST',
		headers: {
			Cookie: `session=${sessionToken}`
		}
	});
}

/**
 * Get auth headers with session cookie
 */
export function getAuthHeaders(sessionToken: string): HeadersInit {
	return {
		Cookie: `session=${sessionToken}`,
		'Content-Type': 'application/json'
	};
}
