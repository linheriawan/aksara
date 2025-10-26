/**
 * Connection API endpoint tests
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { api } from './helpers/request';
import { login, logout } from './helpers/auth';
import {
	assertSuccess,
	assertHasFields,
	assertHasValidId,
	assertUnauthorized,
	assertNotFound
} from './helpers/assertions';

describe('Connections API', () => {
	let sessionToken: string;
	const createdConnectionIds: string[] = [];

	beforeAll(async () => {
		sessionToken = await login();
	});

	afterAll(async () => {
		// Clean up created connections
		for (const id of createdConnectionIds) {
			await api.delete(`/api/connections/${id}`, sessionToken);
		}
		await logout(sessionToken);
	});

	describe('Authentication', () => {
		test('GET /api/connections without auth should return 401', async () => {
			const response = await api.get('/api/connections');
			assertUnauthorized(response);
		});

		test('POST /api/connections without auth should return 401', async () => {
			const response = await api.post('/api/connections', {});
			assertUnauthorized(response);
		});
	});

	describe('List Connections', () => {
		test('GET /api/connections should return array', async () => {
			const response = await api.get<{ connections: any[] }>(
				'/api/connections',
				sessionToken
			);

			assertSuccess(response);
			expect(response.data).toHaveProperty('connections');
			expect(Array.isArray(response.data?.connections)).toBe(true);
		});
	});

	describe('Create Connection', () => {
		test('POST /api/connections should create MySQL connection', async () => {
			const newConnection = {
				name: 'Test MySQL Connection',
				description: 'Test connection created by API test',
				type: 'mysql',
				config: {
					host: 'localhost',
					port: 3306,
					username: 'test_user',
					password: 'test_password',
					database: 'test_db'
				}
			};

			const response = await api.post<{ connection: any }>(
				'/api/connections',
				newConnection,
				sessionToken
			);

			assertSuccess(response);
			expect(response.data).toHaveProperty('connection');
			assertHasValidId(response.data?.connection);
			assertHasFields(response.data?.connection, ['name', 'type', 'status']);
			expect(response.data?.connection.name).toBe(newConnection.name);
			expect(response.data?.connection.type).toBe('mysql');

			// Save for cleanup
			createdConnectionIds.push(response.data!.connection.id);
		});

		test('POST /api/connections should validate required fields', async () => {
			const response = await api.post(
				'/api/connections',
				{ name: 'Incomplete' },
				sessionToken
			);

			expect(response.ok).toBe(false);
			expect(response.status).toBe(400);
		});

		test('POST /api/connections should validate connection type', async () => {
			const response = await api.post(
				'/api/connections',
				{
					name: 'Invalid Type',
					type: 'invalid_db_type',
					config: {}
				},
				sessionToken
			);

			expect(response.ok).toBe(false);
			expect(response.status).toBe(400);
		});
	});

	describe('Get Connection', () => {
		test('GET /api/connections/[id] should return connection details', async () => {
			// First create a connection
			const newConnection = {
				name: 'Test PostgreSQL',
				type: 'postgresql',
				config: {
					host: 'localhost',
					port: 5432,
					username: 'postgres',
					password: 'password'
				}
			};

			const createResponse = await api.post<{ connection: any }>(
				'/api/connections',
				newConnection,
				sessionToken
			);
			const connectionId = createResponse.data!.connection.id;
			createdConnectionIds.push(connectionId);

			// Get the connection
			const response = await api.get<{ connection: any }>(
				`/api/connections/${connectionId}`,
				sessionToken
			);

			assertSuccess(response);
			expect(response.data).toHaveProperty('connection');
			expect(response.data?.connection.id).toBe(connectionId);
			expect(response.data?.connection.name).toBe(newConnection.name);
		});

		test('GET /api/connections/invalid_id should return 404', async () => {
			const response = await api.get('/api/connections/invalid_id_123', sessionToken);
			assertNotFound(response);
		});
	});

	describe('Update Connection', () => {
		test('PUT /api/connections/[id] should update connection', async () => {
			// Create a connection
			const createResponse = await api.post<{ connection: any }>(
				'/api/connections',
				{
					name: 'Update Test',
					type: 'mysql',
					config: { host: 'localhost', port: 3306 }
				},
				sessionToken
			);
			const connectionId = createResponse.data!.connection.id;
			createdConnectionIds.push(connectionId);

			// Update it
			const updates = {
				name: 'Updated Name',
				description: 'Updated description'
			};

			const response = await api.put<{ connection: any }>(
				`/api/connections/${connectionId}`,
				updates,
				sessionToken
			);

			assertSuccess(response);
			expect(response.data?.connection.name).toBe(updates.name);
			expect(response.data?.connection.description).toBe(updates.description);
		});
	});

	describe('Delete Connection', () => {
		test('DELETE /api/connections/[id] should delete connection', async () => {
			// Create a connection
			const createResponse = await api.post<{ connection: any }>(
				'/api/connections',
				{
					name: 'Delete Test',
					type: 'mysql',
					config: { host: 'localhost', port: 3306 }
				},
				sessionToken
			);
			const connectionId = createResponse.data!.connection.id;

			// Delete it
			const response = await api.delete<{ success: boolean }>(
				`/api/connections/${connectionId}`,
				sessionToken
			);

			assertSuccess(response);
			expect(response.data?.success).toBe(true);

			// Verify it's deleted
			const getResponse = await api.get(`/api/connections/${connectionId}`, sessionToken);
			assertNotFound(getResponse);
		});
	});

	describe('Test Connection', () => {
		test('POST /api/connections/test should test config without saving', async () => {
			const testConfig = {
				type: 'mysql',
				config: {
					host: 'localhost',
					port: 3306,
					username: 'test',
					password: 'test'
				}
			};

			const response = await api.post<{ success: boolean; message: string }>(
				'/api/connections/test',
				testConfig,
				sessionToken
			);

			// Response can be success or failure depending on if MySQL is available
			expect(response.status).toBeGreaterThanOrEqual(200);
			expect(response.data).toHaveProperty('success');
			expect(response.data).toHaveProperty('message');
		});
	});
});
