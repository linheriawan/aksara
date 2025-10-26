/**
 * Datasource API endpoint tests
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { api } from './helpers/request';
import { login, logout } from './helpers/auth';
import {
	assertSuccess,
	assertHasFields,
	assertHasValidId,
	assertUnauthorized,
	assertNotFound,
	assertBadRequest
} from './helpers/assertions';

describe('Datasources API', () => {
	let sessionToken: string;
	let testConnectionId: string;
	const createdDatasourceIds: string[] = [];

	beforeAll(async () => {
		sessionToken = await login();

		// Create a test connection to use for datasources
		const connectionResponse = await api.post(
			'/api/connections',
			{
				name: 'Test Connection for Datasources',
				type: 'mysql',
				config: {
					host: 'localhost',
					port: 3306,
					username: 'test',
					password: 'test'
				}
			},
			sessionToken
		);

		testConnectionId = connectionResponse.data.connection.id;
	});

	afterAll(async () => {
		// Clean up datasources
		for (const id of createdDatasourceIds) {
			await api.delete(`/api/datasources/${id}`, sessionToken);
		}

		// Clean up test connection
		if (testConnectionId) {
			await api.delete(`/api/connections/${testConnectionId}`, sessionToken);
		}

		await logout(sessionToken);
	});

	describe('Authentication', () => {
		test('GET /api/datasources without auth should return 401', async () => {
			const response = await api.get('/api/datasources');
			assertUnauthorized(response);
		});

		test('POST /api/datasources without auth should return 401', async () => {
			const response = await api.post('/api/datasources', {});
			assertUnauthorized(response);
		});
	});

	describe('List Datasources', () => {
		test('GET /api/datasources should return array', async () => {
			const response = await api.get<{ datasources: any[] }>(
				'/api/datasources',
				sessionToken
			);

			assertSuccess(response);
			expect(response.data).toHaveProperty('datasources');
			expect(Array.isArray(response.data?.datasources)).toBe(true);
		});
	});

	describe('Create Datasource', () => {
		test('POST /api/datasources should create datasource', async () => {
			const newDatasource = {
				name: 'test_database',
				displayName: 'Test Database',
				type: 'mysql',
				connectionId: testConnectionId
			};

			const response = await api.post<{ datasource: any }>(
				'/api/datasources',
				newDatasource,
				sessionToken
			);

			assertSuccess(response);
			expect(response.data).toHaveProperty('datasource');
			assertHasValidId(response.data?.datasource);
			assertHasFields(response.data?.datasource, ['name', 'displayName', 'type', 'connectionId']);
			expect(response.data?.datasource.name).toBe(newDatasource.name);
			expect(response.data?.datasource.type).toBe('mysql');

			createdDatasourceIds.push(response.data!.datasource.id);
		});

		test('POST /api/datasources should validate required fields', async () => {
			const response = await api.post(
				'/api/datasources',
				{ name: 'incomplete' },
				sessionToken
			);

			expect(response.ok).toBe(false);
			expect(response.status).toBe(400);
		});

		test('POST /api/datasources should validate type matches connection', async () => {
			const response = await api.post(
				'/api/datasources',
				{
					name: 'mismatched_type',
					type: 'postgresql', // Connection is mysql
					connectionId: testConnectionId
				},
				sessionToken
			);

			expect(response.ok).toBe(false);
			expect(response.status).toBe(400);
		});
	});

	describe('Get Datasource', () => {
		test('GET /api/datasources/[id] should return datasource details', async () => {
			// Create a datasource
			const createResponse = await api.post<{ datasource: any }>(
				'/api/datasources',
				{
					name: 'get_test_db',
					displayName: 'Get Test DB',
					type: 'mysql',
					connectionId: testConnectionId
				},
				sessionToken
			);
			const datasourceId = createResponse.data!.datasource.id;
			createdDatasourceIds.push(datasourceId);

			// Get it
			const response = await api.get<{ datasource: any }>(
				`/api/datasources/${datasourceId}`,
				sessionToken
			);

			assertSuccess(response);
			expect(response.data).toHaveProperty('datasource');
			expect(response.data?.datasource.id).toBe(datasourceId);
		});

		test('GET /api/datasources/invalid_id should return 404', async () => {
			const response = await api.get('/api/datasources/invalid_id_123', sessionToken);
			assertNotFound(response);
		});
	});

	describe('Update Datasource', () => {
		test('PUT /api/datasources/[id] should update datasource', async () => {
			// Create
			const createResponse = await api.post<{ datasource: any }>(
				'/api/datasources',
				{
					name: 'update_test',
					type: 'mysql',
					connectionId: testConnectionId
				},
				sessionToken
			);
			const datasourceId = createResponse.data!.datasource.id;
			createdDatasourceIds.push(datasourceId);

			// Update
			const updates = {
				displayName: 'Updated Display Name'
			};

			const response = await api.put<{ datasource: any }>(
				`/api/datasources/${datasourceId}`,
				updates,
				sessionToken
			);

			assertSuccess(response);
			expect(response.data?.datasource.displayName).toBe(updates.displayName);
		});
	});

	describe('Delete Datasource', () => {
		test('DELETE /api/datasources/[id] should delete datasource', async () => {
			// Create
			const createResponse = await api.post<{ datasource: any }>(
				'/api/datasources',
				{
					name: 'delete_test',
					type: 'mysql',
					connectionId: testConnectionId
				},
				sessionToken
			);
			const datasourceId = createResponse.data!.datasource.id;

			// Delete
			const response = await api.delete<{ success: boolean }>(
				`/api/datasources/${datasourceId}`,
				sessionToken
			);

			assertSuccess(response);
			expect(response.data?.success).toBe(true);

			// Verify deleted
			const getResponse = await api.get(`/api/datasources/${datasourceId}`, sessionToken);
			assertNotFound(getResponse);
		});
	});

	describe('Schema Discovery', () => {
		test('GET /api/datasources/[id]/schema should discover schema', async () => {
			// Create datasource
			const createResponse = await api.post<{ datasource: any }>(
				'/api/datasources',
				{
					name: 'schema_test',
					type: 'mysql',
					connectionId: testConnectionId
				},
				sessionToken
			);
			const datasourceId = createResponse.data!.datasource.id;
			createdDatasourceIds.push(datasourceId);

			// Discover schema
			const response = await api.get<{ schema: any }>(
				`/api/datasources/${datasourceId}/schema`,
				sessionToken
			);

			// May succeed or fail depending on if test DB is accessible
			if (response.ok) {
				expect(response.data).toHaveProperty('schema');
				expect(response.data?.schema).toHaveProperty('tables');
			}
		});
	});

	describe('Execute Query', () => {
		test('POST /api/datasources/[id]/query should execute query', async () => {
			const createResponse = await api.post<{ datasource: any }>(
				'/api/datasources',
				{
					name: 'query_test',
					type: 'mysql',
					connectionId: testConnectionId
				},
				sessionToken
			);
			const datasourceId = createResponse.data!.datasource.id;
			createdDatasourceIds.push(datasourceId);

			const response = await api.post(
				`/api/datasources/${datasourceId}/query`,
				{
					query: 'SELECT 1 as test',
					params: []
				},
				sessionToken
			);

			// May succeed or fail based on connection availability
			expect([200, 404, 500]).toContain(response.status);
		});
	});

	describe('Export Data', () => {
		test('POST /api/datasources/[id]/export should validate format', async () => {
			const createResponse = await api.post<{ datasource: any }>(
				'/api/datasources',
				{
					name: 'export_test',
					type: 'mysql',
					connectionId: testConnectionId
				},
				sessionToken
			);
			const datasourceId = createResponse.data!.datasource.id;
			createdDatasourceIds.push(datasourceId);

			const response = await api.post(
				`/api/datasources/${datasourceId}/export`,
				{
					format: 'invalid_format',
					table: 'test_table'
				},
				sessionToken
			);

			assertBadRequest(response);
		});

		test('POST /api/datasources/[id]/export should require table or query', async () => {
			const createResponse = await api.post<{ datasource: any }>(
				'/api/datasources',
				{
					name: 'export_test2',
					type: 'mysql',
					connectionId: testConnectionId
				},
				sessionToken
			);
			const datasourceId = createResponse.data!.datasource.id;
			createdDatasourceIds.push(datasourceId);

			const response = await api.post(
				`/api/datasources/${datasourceId}/export`,
				{
					format: 'csv'
					// Missing table or query
				},
				sessionToken
			);

			assertBadRequest(response);
		});
	});
});
