/**
 * Health check endpoint tests
 */

import { describe, test, expect } from 'bun:test';
import { api } from './helpers/request';
import { assertSuccess } from './helpers/assertions';

describe('Health Check API', () => {
	test('GET /api/health should return 200', async () => {
		const response = await api.get('/api/health');

		assertSuccess(response);
		expect(response.status).toBe(200);
	});

	test('GET /api/health should return status healthy', async () => {
		const response = await api.get<{ status: string }>('/api/health');

		assertSuccess(response);
		expect(response.data).toHaveProperty('status');
		expect(response.data?.status).toBe('healthy');
	});
});
