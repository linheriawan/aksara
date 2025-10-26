/**
 * Authentication API endpoint tests
 */

import { describe, test, expect } from 'bun:test';
import { api } from './helpers/request';
import { TEST_CONFIG } from '../setup';
import { assertSuccess, assertError } from './helpers/assertions';

describe('Authentication API', () => {
	describe('Login', () => {
		test('POST /api/auth/login with valid credentials should succeed', async () => {
			const response = await api.post<{ success: boolean; user: any }>(
				'/api/auth/login',
				{
					email: TEST_CONFIG.testUser.email,
					password: TEST_CONFIG.testUser.password
				}
			);

			assertSuccess(response);
			expect(response.data).toHaveProperty('success');
			expect(response.data?.success).toBe(true);
			expect(response.data).toHaveProperty('user');

			// Should have set cookie
			const setCookie = response.headers.get('set-cookie');
			expect(setCookie).toBeTruthy();
			expect(setCookie).toContain('session=');
		});

		test('POST /api/auth/login with invalid credentials should fail', async () => {
			const response = await api.post('/api/auth/login', {
				email: 'wrong@example.com',
				password: 'wrongpassword'
			});

			expect(response.ok).toBe(false);
			expect(response.status).toBe(401);
		});

		test('POST /api/auth/login with missing email should fail', async () => {
			const response = await api.post('/api/auth/login', {
				password: 'password123'
			});

			expect(response.ok).toBe(false);
			expect(response.status).toBe(400);
		});

		test('POST /api/auth/login with missing password should fail', async () => {
			const response = await api.post('/api/auth/login', {
				email: 'test@example.com'
			});

			expect(response.ok).toBe(false);
			expect(response.status).toBe(400);
		});
	});

	describe('Logout', () => {
		test('POST /api/auth/logout should clear session', async () => {
			// First login
			const loginResponse = await api.post('/api/auth/login', {
				email: TEST_CONFIG.testUser.email,
				password: TEST_CONFIG.testUser.password
			});

			const setCookie = loginResponse.headers.get('set-cookie');
			const sessionMatch = setCookie?.match(/session=([^;]+)/);
			const sessionToken = sessionMatch?.[1];

			expect(sessionToken).toBeTruthy();

			// Then logout
			const logoutResponse = await api.post('/api/auth/logout', {}, sessionToken);

			assertSuccess(logoutResponse);

			// Session cookie should be cleared
			const logoutCookie = logoutResponse.headers.get('set-cookie');
			expect(logoutCookie).toBeTruthy();
			// Cookie should be expired or empty
			expect(logoutCookie).toMatch(/session=;|Max-Age=0/);
		});
	});

	describe('Session Validation', () => {
		test('Valid session should allow access to protected routes', async () => {
			// Login
			const loginResponse = await api.post('/api/auth/login', {
				email: TEST_CONFIG.testUser.email,
				password: TEST_CONFIG.testUser.password
			});

			const setCookie = loginResponse.headers.get('set-cookie');
			const sessionMatch = setCookie?.match(/session=([^;]+)/);
			const sessionToken = sessionMatch?.[1];

			// Try accessing protected route
			const response = await api.get('/api/connections', sessionToken);

			assertSuccess(response);
		});

		test('Invalid session should deny access to protected routes', async () => {
			const response = await api.get('/api/connections', 'invalid_session_token');

			expect(response.ok).toBe(false);
			expect(response.status).toBe(401);
		});

		test('Missing session should deny access to protected routes', async () => {
			const response = await api.get('/api/connections');

			expect(response.ok).toBe(false);
			expect(response.status).toBe(401);
		});
	});
});
