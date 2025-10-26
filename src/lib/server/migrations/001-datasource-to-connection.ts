/**
 * Migration: Separate Connection from Datasource
 *
 * This migration:
 * 1. Reads all existing datasources (which currently contain connection + database info)
 * 2. Extracts connection information and creates Connection documents
 * 3. Updates datasources to reference connectionId and only contain database name
 *
 * IMPORTANT: Run this migration before deploying the refactored code
 */

import { mongodb } from '$lib/server/database/mongodb';
import { ObjectId } from 'mongodb';

interface OldDatasource {
	_id: ObjectId;
	name: string;
	type: 'mysql' | 'postgresql' | 'mongodb' | 'rest_api';
	connection: any; // Old connection object (encrypted)
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	deleted?: boolean;
}

interface NewConnection {
	name: string;
	description?: string;
	type: 'mysql' | 'postgresql' | 'mongodb' | 'rest_api';
	config: any; // Connection config (encrypted, same as old connection)
	status: 'active' | 'inactive' | 'error' | 'pending';
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

interface NewDatasource {
	connectionId: string;
	name: string; // Database name
	displayName?: string; // Friendly name (from old datasource name)
	type: 'mysql' | 'postgresql' | 'mongodb' | 'rest_api';
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export async function migrateDataourcesToConnections() {
	console.log('Starting datasource to connection migration...');

	const datasourcesCollection = mongodb.collection<OldDatasource>('datasources');
	const connectionsCollection = mongodb.collection<NewConnection>('connections');

	// Get all non-deleted datasources
	const oldDatasources = await datasourcesCollection
		.find({ deleted: { $ne: true } })
		.toArray();

	console.log(`Found ${oldDatasources.length} datasources to migrate`);

	// Group datasources by connection (same host/port/credentials = same connection)
	const connectionMap = new Map<string, { connection: NewConnection; datasources: OldDatasource[] }>();

	for (const datasource of oldDatasources) {
		// Create a unique key for this connection based on type and config
		// For databases: type + host + port + username
		// For REST APIs: type + baseUrl
		let connectionKey: string;

		if (datasource.type === 'rest_api') {
			const config = datasource.connection as any;
			connectionKey = `${datasource.type}:${config.baseUrl || 'unknown'}`;
		} else {
			const config = datasource.connection as any;
			const host = config.host || config.connectionString || 'unknown';
			const port = config.port || 'default';
			const username = config.username || 'none';
			connectionKey = `${datasource.type}:${host}:${port}:${username}`;
		}

		if (!connectionMap.has(connectionKey)) {
			// Create a new connection
			const connectionName = datasource.type === 'rest_api'
				? `${datasource.type.toUpperCase()} - ${datasource.connection.baseUrl || 'API'}`
				: `${datasource.type.toUpperCase()} - ${datasource.connection.host || 'Server'}`;

			const newConnection: NewConnection = {
				name: connectionName,
				description: `Migrated from datasource: ${datasource.name}`,
				type: datasource.type,
				config: datasource.connection, // Keep encrypted config as-is
				status: 'pending',
				createdBy: datasource.createdBy,
				createdAt: datasource.createdAt,
				updatedAt: new Date()
			};

			connectionMap.set(connectionKey, {
				connection: newConnection,
				datasources: []
			});
		}

		connectionMap.get(connectionKey)!.datasources.push(datasource);
	}

	console.log(`Created ${connectionMap.size} unique connections`);

	// Insert connections and update datasources
	let migratedCount = 0;
	let errorCount = 0;

	for (const [connectionKey, { connection, datasources: dsList }] of connectionMap.entries()) {
		try {
			// Insert connection
			const insertResult = await connectionsCollection.insertOne(connection as any);
			const connectionId = insertResult.insertedId.toString();

			console.log(`Created connection: ${connection.name} (${connectionId})`);

			// Update each datasource to reference this connection
			for (const oldDatasource of dsList) {
				try {
					// For database datasources, extract the database name from connection config
					let databaseName = 'default';

					if (oldDatasource.type !== 'rest_api') {
						const config = oldDatasource.connection as any;
						databaseName = config.database || oldDatasource.name;
					}

					// Update datasource document
					await datasourcesCollection.updateOne(
						{ _id: oldDatasource._id },
						{
							$set: {
								connectionId: connectionId,
								name: databaseName, // Database name
								displayName: oldDatasource.name, // Keep old name as display name
								type: oldDatasource.type,
								updatedAt: new Date()
							},
							$unset: {
								connection: '' // Remove old connection field
							}
						}
					);

					migratedCount++;
					console.log(`  Migrated datasource: ${oldDatasource.name} -> ${databaseName}`);
				} catch (error: any) {
					console.error(`  Failed to migrate datasource ${oldDatasource._id}:`, error.message);
					errorCount++;
				}
			}
		} catch (error: any) {
			console.error(`Failed to create connection for ${connectionKey}:`, error.message);
			errorCount++;
		}
	}

	console.log('\nMigration complete!');
	console.log(`  Connections created: ${connectionMap.size}`);
	console.log(`  Datasources migrated: ${migratedCount}`);
	console.log(`  Errors: ${errorCount}`);

	return {
		connectionsCreated: connectionMap.size,
		datasourcesMigrated: migratedCount,
		errors: errorCount
	};
}

// Rollback function (in case migration needs to be reverted)
export async function rollbackMigration() {
	console.log('Rolling back migration...');
	console.warn('WARNING: Rollback not implemented. Manual database restore required.');
	console.warn('Before running migration, backup your database with: mongodump');
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
	migrateDataourcesToConnections()
		.then((result) => {
			console.log('\nMigration successful:', result);
			process.exit(0);
		})
		.catch((error) => {
			console.error('\nMigration failed:', error);
			process.exit(1);
		});
}
