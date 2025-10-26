import { mongodb } from '$lib/server/database/mongodb';
import type { Datasource, DatabaseConnectionConfig, APIConnectionConfig } from '$lib/types';
import type { ConnectionTestResult, SchemaInfo } from './types';
import { createDatabaseConnector } from './database-connector';
import { createAPIConnector } from './api-connector';
import { ObjectId, type WithId, type Document } from 'mongodb';
import { connectionService } from '../connection/connection.service';

export class DatasourceService {
	private collection = mongodb.collection<Datasource>('datasources');
	private connections = mongodb.collection('connections');

	/**
	 * Get all datasources for a user or organization
	 */
	async list(userId: string): Promise<WithId<Datasource>[]> {
		const datasources = await this.collection
			.find({ createdBy: userId, deleted: { $ne: true } })
			.sort({ createdAt: -1 })
			.toArray();

		// DEFENSIVE FIX: Backfill missing type fields from parent connections
		const withTypes = await Promise.all(
			datasources.map(async (ds) => {
				// If type is missing or undefined, get it from parent connection
				if (!ds.type) {
					try {
						const connection = await this.connections.findOne({
							_id: new ObjectId(ds.connectionId)
						});

						if (connection?.type) {
							// Backfill type field in database for future queries
							await this.collection.updateOne(
								{ _id: ds._id },
								{ $set: { type: connection.type, updatedAt: new Date() } }
							);

							// Return datasource with corrected type
							return { ...ds, type: connection.type };
						}
					} catch (error) {
						console.error(`Failed to backfill type for datasource ${ds._id}:`, error);
					}
				}
				return ds;
			})
		);

		return withTypes;
	}

	/**
	 * Get all datasources for a specific connection
	 */
	async listByConnection(connectionId: string, userId: string): Promise<WithId<Datasource>[]> {
		if (!ObjectId.isValid(connectionId)) {
			return [];
		}

		const datasources = await this.collection
			.find({
				connectionId: connectionId,
				createdBy: userId,
				deleted: { $ne: true }
			})
			.sort({ createdAt: -1 })
			.toArray();

		return datasources;
	}

	/**
	 * Get a single datasource by ID
	 */
	async getById(id: string, userId: string): Promise<WithId<Datasource> | null> {
		if (!ObjectId.isValid(id)) {
			return null;
		}

		const datasource = await this.collection.findOne({
			_id: new ObjectId(id),
			createdBy: userId,
			deleted: { $ne: true }
		});

		return datasource;
	}

	/**
	 * Get the connection for a datasource
	 */
	async getConnection(datasourceId: string, userId: string) {
		const datasource = await this.getById(datasourceId, userId);
		if (!datasource) {
			throw new Error('Datasource not found');
		}

		const connection = await connectionService.getById(datasource.connectionId, userId);
		if (!connection) {
			throw new Error('Connection not found');
		}

		return connection;
	}

	/**
	 * Create a new datasource
	 */
	async create(datasource: Omit<Datasource, 'id'>, userId: string): Promise<WithId<Datasource>> {
		const now = new Date();

		// Validate that connection exists
		const connection = await connectionService.getById(datasource.connectionId, userId);
		if (!connection) {
			throw new Error('Connection not found');
		}

		// Type should match connection type
		if (datasource.type !== connection.type) {
			throw new Error('Datasource type must match connection type');
		}

		const newDatasource: Omit<Datasource, 'id'> = {
			...datasource,
			createdBy: userId,
			createdAt: now,
			updatedAt: now
		};

		const result = await this.collection.insertOne(newDatasource as any);

		const created = await this.collection.findOne({ _id: result.insertedId });
		if (!created) {
			throw new Error('Failed to retrieve created datasource');
		}

		return created;
	}

	/**
	 * Update an existing datasource
	 */
	async update(
		id: string,
		updates: Partial<Omit<Datasource, 'id' | 'createdBy' | 'createdAt'>>,
		userId: string
	): Promise<WithId<Datasource> | null> {
		if (!ObjectId.isValid(id)) {
			return null;
		}

		// If updating connectionId, validate it exists
		if (updates.connectionId) {
			const connection = await connectionService.getById(updates.connectionId, userId);
			if (!connection) {
				throw new Error('Connection not found');
			}
		}

		const result = await this.collection.findOneAndUpdate(
			{
				_id: new ObjectId(id),
				createdBy: userId,
				deleted: { $ne: true }
			},
			{
				$set: {
					...updates,
					updatedAt: new Date()
				}
			},
			{ returnDocument: 'after' }
		);

		return result;
	}

	/**
	 * Delete a datasource (soft delete)
	 */
	async delete(id: string, userId: string): Promise<boolean> {
		if (!ObjectId.isValid(id)) {
			return false;
		}

		const result = await this.collection.updateOne(
			{
				_id: new ObjectId(id),
				createdBy: userId,
				deleted: { $ne: true }
			},
			{
				$set: {
					deleted: true,
					deletedAt: new Date(),
					updatedAt: new Date()
				}
			}
		);

		return result.modifiedCount > 0;
	}

	/**
	 * Discover schema from a datasource
	 */
	async discoverSchema(id: string, userId: string): Promise<SchemaInfo | null> {
		const datasource = await this.getById(id, userId);
		if (!datasource) {
			return null;
		}

		if (datasource.type === 'rest_api') {
			// For REST APIs, we don't discover schema automatically
			// User needs to provide OpenAPI spec URL
			return { tables: [] };
		}

		// Get connection config from Connection service
		const connection = await this.getConnection(id, userId);

		// If datasource type is null, infer it from the connection
		const datasourceType = datasource.type || connection.type;

		if (!datasourceType) {
			throw new Error('Cannot determine datasource type');
		}

		// Import decryptConnectionCredentials for getting config
		const { decryptConnectionCredentials } = await import('$lib/server/security/crypto');
		const config = decryptConnectionCredentials(connection.config) as DatabaseConnectionConfig;

		// Add database name to config for schema discovery
		const configWithDb = {
			...config,
			database: datasource.name
		};

		const connector = createDatabaseConnector(
			datasourceType as 'mysql' | 'postgresql' | 'mongodb',
			configWithDb as any
		);

		try {
			const schema = await connector.discoverSchema();
			await connector.close();

			// AUTO-DISCOVERY: Create/update direct objects from schema
			const { objectAutoDiscoveryService } = await import(
				'../object/object-auto-discovery.service'
			);
			await objectAutoDiscoveryService.syncDirectObjects(
				id,
				datasource.name,
				schema,
				userId
			);

			return schema;
		} catch (error) {
			await connector.close();
			throw error;
		}
	}

	/**
	 * Execute a query on a datasource
	 */
	async executeQuery(
		id: string,
		query: string,
		params: any[] | undefined,
		userId: string
	): Promise<any[]> {
		const datasource = await this.getById(id, userId);
		if (!datasource) {
			throw new Error('Datasource not found');
		}

		// Get connection config from Connection service
		const connection = await this.getConnection(id, userId);

		// If datasource type is null, infer it from the connection
		const datasourceType = datasource.type || connection.type;

		if (!datasourceType) {
			throw new Error('Cannot determine datasource type');
		}

		if (datasourceType === 'rest_api') {
			throw new Error('Use executeAPIRequest for REST API datasources');
		}

		const { decryptConnectionCredentials } = await import('$lib/server/security/crypto');
		const config = decryptConnectionCredentials(connection.config) as DatabaseConnectionConfig;

		// Add database name to config
		const configWithDb = {
			...config,
			database: datasource.name
		};

		const connector = createDatabaseConnector(
			datasourceType as 'mysql' | 'postgresql' | 'mongodb',
			configWithDb as any
		);

		try {
			const results = await connector.executeQuery(query, params);
			await connector.close();
			return results;
		} catch (error) {
			await connector.close();
			throw error;
		}
	}

	/**
	 * Execute an API request
	 */
	async executeAPIRequest(
		id: string,
		endpoint: string,
		method: string,
		params: any,
		userId: string
	): Promise<any> {
		const datasource = await this.getById(id, userId);
		if (!datasource) {
			throw new Error('Datasource not found');
		}

		if (datasource.type !== 'rest_api') {
			throw new Error('Use executeQuery for database datasources');
		}

		// Get connection config from Connection service
		const connection = await this.getConnection(id, userId);
		const { decryptConnectionCredentials } = await import('$lib/server/security/crypto');
		const config = decryptConnectionCredentials(connection.config) as APIConnectionConfig;

		const connector = createAPIConnector(config);
		return await connector.executeRequest(endpoint, method, params);
	}
}

export const datasourceService = new DatasourceService();
