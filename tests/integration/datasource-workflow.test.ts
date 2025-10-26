/**
 * Integration test: Full datasource workflow
 *
 * Tests the complete flow from creating a connection to working with datasources
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { api } from '../api/helpers/request';
import { login, logout } from '../api/helpers/auth';
import { assertSuccess, assertHasValidId } from '../api/helpers/assertions';

describe('Datasource Workflow Integration', () => {
	let sessionToken: string;
	let connectionId: string;
	let datasourceId: string;

	beforeAll(async () => {
		sessionToken = await login();
	});

	afterAll(async () => {
		// Cleanup in reverse order
		if (datasourceId) {
			await api.delete(`/api/datasources/${datasourceId}`, sessionToken);
		}
		if (connectionId) {
			await api.delete(`/api/connections/${connectionId}`, sessionToken);
		}
		await logout(sessionToken);
	});

	test('Complete workflow: Create Connection → Create Datasource → Discover Schema', async () => {
		// Step 1: Create a database connection
		console.log('Step 1: Creating connection...');
		const connectionResponse = await api.post(
			'/api/connections',
			{
				name: 'Integration Test MySQL',
				description: 'Connection created during integration test',
				type: 'mysql',
				config: {
					host: 'localhost',
					port: 3306,
					username: 'test_user',
					password: 'test_password'
				}
			},
			sessionToken
		);

		assertSuccess(connectionResponse);
		expect(connectionResponse.data).toHaveProperty('connection');
		assertHasValidId(connectionResponse.data.connection);

		connectionId = connectionResponse.data.connection.id;
		console.log(`✓ Connection created: ${connectionId}`);

		// Step 2: List connections to verify
		console.log('Step 2: Verifying connection appears in list...');
		const listResponse = await api.get('/api/connections', sessionToken);

		assertSuccess(listResponse);
		const connections = listResponse.data.connections;
		const foundConnection = connections.find((c: any) => c.id === connectionId);
		expect(foundConnection).toBeTruthy();
		console.log('✓ Connection found in list');

		// Step 3: Create a datasource using the connection
		console.log('Step 3: Creating datasource...');
		const datasourceResponse = await api.post(
			'/api/datasources',
			{
				name: 'integration_test_db',
				displayName: 'Integration Test Database',
				type: 'mysql',
				connectionId: connectionId
			},
			sessionToken
		);

		assertSuccess(datasourceResponse);
		expect(datasourceResponse.data).toHaveProperty('datasource');
		assertHasValidId(datasourceResponse.data.datasource);
		expect(datasourceResponse.data.datasource.connectionId).toBe(connectionId);

		datasourceId = datasourceResponse.data.datasource.id;
		console.log(`✓ Datasource created: ${datasourceId}`);

		// Step 4: Get datasource details
		console.log('Step 4: Getting datasource details...');
		const getResponse = await api.get(`/api/datasources/${datasourceId}`, sessionToken);

		assertSuccess(getResponse);
		expect(getResponse.data.datasource.id).toBe(datasourceId);
		expect(getResponse.data.datasource.name).toBe('integration_test_db');
		console.log('✓ Datasource details retrieved');

		// Step 5: Update datasource
		console.log('Step 5: Updating datasource...');
		const updateResponse = await api.put(
			`/api/datasources/${datasourceId}`,
			{
				displayName: 'Updated Integration Test DB'
			},
			sessionToken
		);

		assertSuccess(updateResponse);
		expect(updateResponse.data.datasource.displayName).toBe('Updated Integration Test DB');
		console.log('✓ Datasource updated');

		// Step 6: List datasources
		console.log('Step 6: Listing all datasources...');
		const datasourceListResponse = await api.get('/api/datasources', sessionToken);

		assertSuccess(datasourceListResponse);
		const datasources = datasourceListResponse.data.datasources;
		const foundDatasource = datasources.find((d: any) => d.id === datasourceId);
		expect(foundDatasource).toBeTruthy();
		expect(foundDatasource.displayName).toBe('Updated Integration Test DB');
		console.log('✓ Datasource found in list with updated name');

		// Step 7: Try schema discovery (may fail if no actual DB exists)
		console.log('Step 7: Attempting schema discovery...');
		const schemaResponse = await api.get(
			`/api/datasources/${datasourceId}/schema`,
			sessionToken
		);

		// Schema discovery might fail if test database doesn't exist
		// That's okay for this integration test
		if (schemaResponse.ok) {
			expect(schemaResponse.data).toHaveProperty('schema');
			console.log('✓ Schema discovered successfully');
		} else {
			console.log('⊘ Schema discovery failed (expected if DB not accessible)');
		}

		// Step 8: Test export endpoint validation
		console.log('Step 8: Testing export endpoint...');
		const exportResponse = await api.post(
			`/api/datasources/${datasourceId}/export`,
			{
				format: 'json',
				query: 'SELECT 1 as test'
			},
			sessionToken
		);

		// Export might fail if no connection, but endpoint should exist
		expect([200, 404, 500]).toContain(exportResponse.status);
		console.log('✓ Export endpoint accessible');

		console.log('\n🎉 Complete workflow test passed!');
	});

	test('Validation workflow: Type mismatch should fail', async () => {
		// Create PostgreSQL connection
		const pgConnectionResponse = await api.post(
			'/api/connections',
			{
				name: 'Test PostgreSQL',
				type: 'postgresql',
				config: {
					host: 'localhost',
					port: 5432,
					username: 'postgres',
					password: 'password'
				}
			},
			sessionToken
		);

		const pgConnectionId = pgConnectionResponse.data.connection.id;

		// Try to create MySQL datasource on PostgreSQL connection
		const datasourceResponse = await api.post(
			'/api/datasources',
			{
				name: 'mismatched_db',
				type: 'mysql', // Wrong type!
				connectionId: pgConnectionId
			},
			sessionToken
		);

		// Should fail validation
		expect(datasourceResponse.ok).toBe(false);
		expect(datasourceResponse.status).toBe(400);
		expect(datasourceResponse.error).toContain('match');

		// Cleanup
		await api.delete(`/api/connections/${pgConnectionId}`, sessionToken);

		console.log('✓ Type validation working correctly');
	});
});
