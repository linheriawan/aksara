import { mongodb } from '$lib/server/database/mongodb';
import type { Connection, DatabaseConnectionConfig, APIConnectionConfig } from '$lib/types';
import type { ConnectionTestResult } from '../datasource/types';
import { ObjectId, type WithId } from 'mongodb';
import {
	encryptConnectionCredentials,
	decryptConnectionCredentials
} from '$lib/server/security/crypto';
import { createDatabaseConnector } from '../datasource/database-connector';
import { createAPIConnector } from '../datasource/api-connector';

export class ConnectionService {
	private collection = mongodb.collection<Connection>('connections');

	/**
	 * Get all connections for a user
	 */
	async list(userId: string): Promise<WithId<Connection>[]> {
		const connections = await this.collection
			.find({ createdBy: userId, deleted: { $ne: true } })
			.sort({ createdAt: -1 })
			.toArray();

		return connections;
	}

	/**
	 * Get a single connection by ID
	 */
	async getById(id: string, userId: string): Promise<WithId<Connection> | null> {
		if (!ObjectId.isValid(id)) {
			return null;
		}

		const connection = await this.collection.findOne({
			_id: new ObjectId(id),
			createdBy: userId,
			deleted: { $ne: true }
		});

		return connection;
	}

	/**
	 * Create a new connection
	 */
	async create(connection: Omit<Connection, 'id'>, userId: string): Promise<WithId<Connection>> {
		const now = new Date();

		// Encrypt sensitive credentials before storing
		const encryptedConfig = encryptConnectionCredentials(connection.config);

		const newConnection: Omit<Connection, 'id'> = {
			...connection,
			config: encryptedConfig,
			createdBy: userId,
			createdAt: now,
			updatedAt: now,
			lastTestedAt: undefined,
			status: 'pending'
		};

		const result = await this.collection.insertOne(newConnection as any);

		const created = await this.collection.findOne({ _id: result.insertedId });
		if (!created) {
			throw new Error('Failed to retrieve created connection');
		}

		return created;
	}

	/**
	 * Update an existing connection
	 */
	async update(
		id: string,
		updates: Partial<Omit<Connection, 'id' | 'createdBy' | 'createdAt'>>,
		userId: string
	): Promise<WithId<Connection> | null> {
		if (!ObjectId.isValid(id)) {
			return null;
		}

		// Encrypt connection config if provided
		const updatesToApply = { ...updates };
		if (updates.config) {
			updatesToApply.config = encryptConnectionCredentials(updates.config);
		}

		const result = await this.collection.findOneAndUpdate(
			{
				_id: new ObjectId(id),
				createdBy: userId,
				deleted: { $ne: true }
			},
			{
				$set: {
					...updatesToApply,
					updatedAt: new Date()
				}
			},
			{ returnDocument: 'after' }
		);

		return result;
	}

	/**
	 * Soft delete a connection
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
	 * Test a connection
	 */
	async testConnection(id: string, userId: string): Promise<ConnectionTestResult> {
		const connection = await this.getById(id, userId);

		if (!connection) {
			return {
				success: false,
				message: 'Connection not found',
				timestamp: new Date()
			};
		}

		return this.testConnectionConfig(connection);
	}

	/**
	 * Test connection with config (before saving)
	 */
	async testConnectionConfig(
		connection: WithId<Connection> | Omit<Connection, 'id'>
	): Promise<ConnectionTestResult> {
		const startTime = Date.now();

		try {
			// Decrypt credentials for testing
			const decryptedConfig = decryptConnectionCredentials(connection.config);

			if (connection.type === 'rest_api') {
				const apiConnector = createAPIConnector(decryptedConfig as APIConnectionConfig);
				const result = await apiConnector.testConnection();

				// Update last tested timestamp if this is a saved connection
				if ('_id' in connection) {
					await this.collection.updateOne(
						{ _id: connection._id },
						{
							$set: {
								lastTestedAt: new Date(),
								status: result.success ? 'active' : 'error'
							}
						}
					);
				}

				// Add responseTime to top level for consistency
				return {
					...result,
					responseTime: result.details?.responseTime || Date.now() - startTime
				};
			} else {
				// For database connections, we need to create a temporary connection with a test database
				const dbConfig = decryptedConfig as DatabaseConnectionConfig;

				// Create a test connection (without specifying a database for the test)
				const testConfig = { ...dbConfig };

				const dbConnector = createDatabaseConnector(connection.type, testConfig);
				const result = await dbConnector.testConnection();

				// Update last tested timestamp if this is a saved connection
				if ('_id' in connection) {
					await this.collection.updateOne(
						{ _id: connection._id },
						{
							$set: {
								lastTestedAt: new Date(),
								status: result.success ? 'active' : 'error'
							}
						}
					);
				}

				// Add responseTime to top level for consistency
				return {
					...result,
					responseTime: result.details?.responseTime || Date.now() - startTime
				};
			}
		} catch (error: any) {
			const responseTime = Date.now() - startTime;

			const result: ConnectionTestResult = {
				success: false,
				message: error.message || 'Connection test failed',
				timestamp: new Date(),
				responseTime
			};

			// Update status if this is a saved connection
			if ('_id' in connection) {
				await this.collection.updateOne(
					{ _id: connection._id },
					{
						$set: {
							lastTestedAt: new Date(),
							status: 'error'
						}
					}
				);
			}

			return result;
		}
	}

	/**
	 * List databases available on this connection
	 */
	async listDatabases(id: string, userId: string): Promise<string[]> {
		const connection = await this.getById(id, userId);

		if (!connection) {
			throw new Error('Connection not found');
		}

		if (connection.type === 'rest_api') {
			throw new Error('REST API connections do not have databases');
		}

		// Decrypt credentials
		const decryptedConfig = decryptConnectionCredentials(
			connection.config
		) as DatabaseConnectionConfig;

		const dbConnector = createDatabaseConnector(connection.type, decryptedConfig);

		try {
			return await dbConnector.listDatabases();
		} catch (error: any) {
			throw new Error(`Failed to list databases: ${error.message}`);
		}
	}
}

export const connectionService = new ConnectionService();
