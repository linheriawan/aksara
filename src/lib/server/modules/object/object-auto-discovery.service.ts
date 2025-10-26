/**
 * Object Auto-Discovery Service
 *
 * Automatically creates direct objects from datasource schema discovery
 */

import { ObjectId } from 'mongodb';
import { db } from '$lib/server/database/mongodb';
import type { SchemaInfo, TableInfo } from '../datasource/types';
import type { BusinessObject, FieldType, PublishingConfig } from './types';

export class ObjectAutoDiscoveryService {
	/**
	 * Map database column types to field types
	 */
	private mapDatabaseType(dbType: string): FieldType {
		const typeLower = dbType.toLowerCase();

		// String types
		if (
			typeLower.includes('char') ||
			typeLower.includes('text') ||
			typeLower.includes('varchar') ||
			typeLower.includes('string')
		) {
			return 'string';
		}

		// Integer types
		if (
			typeLower.includes('int') ||
			typeLower.includes('serial') ||
			typeLower.includes('bigint') ||
			typeLower.includes('smallint')
		) {
			return 'integer';
		}

		// Number types
		if (
			typeLower.includes('float') ||
			typeLower.includes('double') ||
			typeLower.includes('decimal') ||
			typeLower.includes('numeric') ||
			typeLower.includes('real')
		) {
			return 'number';
		}

		// Boolean types
		if (typeLower.includes('bool')) {
			return 'boolean';
		}

		// Date types
		if (typeLower.includes('date') && !typeLower.includes('time')) {
			return 'date';
		}

		// DateTime types
		if (typeLower.includes('datetime') || typeLower.includes('timestamp')) {
			return 'datetime';
		}

		// UUID types
		if (typeLower.includes('uuid')) {
			return 'uuid';
		}

		// JSON types
		if (typeLower.includes('json')) {
			return 'json';
		}

		// Binary types
		if (typeLower.includes('blob') || typeLower.includes('binary')) {
			return 'binary';
		}

		// Default to string
		return 'string';
	}

	/**
	 * Generate default publishing configuration with auto-detected primary key
	 */
	private getDefaultPublishingConfig(table: TableInfo): PublishingConfig {
		// Auto-detect primary key from table schema
		const primaryKeys = table.primaryKeys || [];
		const primaryKeyConfig = {
			type: primaryKeys.length === 0 ? 'auto' : primaryKeys.length === 1 ? 'single' : 'composite',
			fields: primaryKeys.length > 0 ? primaryKeys : ['id']
		} as { type: 'auto' | 'single' | 'composite'; fields: string[] };

		return {
			protocols: {
				rest: {
					enabled: false,
					methods: ['GET', 'POST', 'PUT', 'DELETE'],
					customPath: '',
					maxPageSize: 100,
					defaultLimit: 1000,
					filtering: {
						allowedOperators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'like']
					},
					sorting: {
						defaultSort: {
							field: '',
							order: 'asc'
						}
					}
				}
			},
			security: {
				type: 'authenticated'
			},
			rateLimit: {
				requestsPerMinute: 1000,
				burstLimit: 100,
				ipThrottling: true
			},
			primaryKey: primaryKeyConfig
		};
	}

	/**
	 * Find existing direct object for a table
	 */
	private async findDirectObject(
		datasourceId: string,
		tableName: string
	): Promise<BusinessObject | null> {
		const database = db();

		const object = await database.collection('objects').findOne({
			objectType: 'direct',
			'directMapping.datasourceId': datasourceId,
			'directMapping.table': tableName,
			deleted: { $ne: true }
		});

		if (!object) return null;

		return {
			...object,
			id: object._id.toString()
		} as BusinessObject;
	}

	/**
	 * Create a direct object from table schema
	 */
	private async createDirectObject(
		datasourceId: string,
		datasourceName: string,
		table: TableInfo,
		userId: string
	): Promise<void> {
		const database = db();
		const now = new Date();

		// Generate object name (datasource_table)
		const objectName = `${datasourceName}_${table.name}`.replace(/[^a-zA-Z0-9_]/g, '_');

		const object: Omit<BusinessObject, 'id'> = {
			name: objectName,
			displayName: table.name,
			description: `Auto-discovered table from ${datasourceName}`,
			version: 1,
			objectType: 'direct',

			// Direct mapping
			directMapping: {
				datasourceId,
				table: table.name
			},

			// Auto-generate fields from columns
			fields: table.columns.map((col) => ({
				name: col.name,
				type: this.mapDatabaseType(col.type),
				required: !col.nullable,
				description: `Column: ${col.name} (${col.type})`,
				mapping: {
					type: 'direct',
					source: {
						datasourceId,
						table: table.name,
						column: col.name
					}
				}
			})),

			// Default publishing config (disabled) with auto-detected primary key
			publishing: this.getDefaultPublishingConfig(table),

			// Start disabled
			status: 'disabled',

			// Metadata
			createdBy: userId,
			createdAt: now,
			updatedAt: now
		};

		await database.collection('objects').insertOne(object as any);

		console.log(`Created direct object: ${objectName} for table ${table.name}`);
	}

	/**
	 * Update an existing direct object
	 */
	private async updateDirectObject(
		objectId: string,
		table: TableInfo,
		datasourceId: string
	): Promise<void> {
		const database = db();

		// Update fields to match current table schema
		const updatedFields = table.columns.map((col) => ({
			name: col.name,
			type: this.mapDatabaseType(col.type),
			required: !col.nullable,
			description: `Column: ${col.name} (${col.type})`,
			mapping: {
				type: 'direct',
				source: {
					datasourceId,
					table: table.name,
					column: col.name
				}
			}
		}));

		// Auto-detect primary key from updated schema
		const primaryKeys = table.primaryKeys || [];
		const primaryKeyConfig = {
			type: primaryKeys.length === 0 ? 'auto' : primaryKeys.length === 1 ? 'single' : 'composite',
			fields: primaryKeys.length > 0 ? primaryKeys : ['id']
		};

		await database.collection('objects').updateOne(
			{ _id: new ObjectId(objectId) },
			{
				$set: {
					fields: updatedFields,
					updatedAt: new Date(),
					// If object was broken, mark as disabled (not broken) since table exists again
					status: 'disabled',
					brokenReason: null,
					// Update primary key configuration
					'publishing.primaryKey': primaryKeyConfig
				}
			}
		);

		console.log(`Updated direct object: ${objectId} for table ${table.name}`);
	}

	/**
	 * Mark objects as broken if their source table no longer exists
	 */
	private async markBrokenObjects(datasourceId: string, schema: SchemaInfo): Promise<void> {
		const database = db();

		// Get all direct objects for this datasource
		const directObjects = await database
			.collection('objects')
			.find({
				objectType: 'direct',
				'directMapping.datasourceId': datasourceId,
				deleted: { $ne: true }
			})
			.toArray();

		const currentTables = schema.tables.map((t) => t.name);

		// Check each object
		for (const obj of directObjects) {
			const tableName = obj.directMapping?.table;

			if (tableName && !currentTables.includes(tableName)) {
				// Table no longer exists - mark as broken
				await database.collection('objects').updateOne(
					{ _id: obj._id },
					{
						$set: {
							status: 'broken',
							brokenReason: `Source table '${tableName}' no longer exists`,
							updatedAt: new Date()
						}
					}
				);

				console.warn(`Marked object ${obj.name} as broken - table ${tableName} not found`);
			}
		}
	}

	/**
	 * Sync direct objects for a datasource
	 * Called when datasource schema is discovered
	 */
	async syncDirectObjects(
		datasourceId: string,
		datasourceName: string,
		schema: SchemaInfo,
		userId: string
	): Promise<void> {
		console.log(
			`Syncing direct objects for datasource ${datasourceName} (${schema.tables.length} tables)`
		);

		// Create or update objects for each table
		for (const table of schema.tables) {
			const existing = await this.findDirectObject(datasourceId, table.name);

			if (!existing) {
				// Create new direct object
				await this.createDirectObject(datasourceId, datasourceName, table, userId);
			} else {
				// Update existing object (fields may have changed)
				await this.updateDirectObject(existing.id!, table, datasourceId);
			}
		}

		// Mark objects as broken if tables no longer exist
		await this.markBrokenObjects(datasourceId, schema);

		console.log(`Direct objects sync completed for datasource ${datasourceName}`);
	}

	/**
	 * Get all direct objects for a datasource
	 */
	async listDirectObjects(datasourceId: string): Promise<BusinessObject[]> {
		const database = db();

		const objects = await database
			.collection('objects')
			.find({
				objectType: 'direct',
				'directMapping.datasourceId': datasourceId,
				deleted: { $ne: true }
			})
			.sort({ 'directMapping.table': 1 })
			.toArray();

		return objects.map((obj) => ({
			...obj,
			id: obj._id.toString()
		})) as BusinessObject[];
	}

	/**
	 * Get all direct objects (across all datasources)
	 */
	async listAllDirectObjects(userId: string): Promise<BusinessObject[]> {
		const database = db();

		const objects = await database
			.collection('objects')
			.find({
				objectType: 'direct',
				createdBy: userId,
				deleted: { $ne: true }
			})
			.sort({ status: 1, name: 1 })
			.toArray();

		return objects.map((obj) => ({
			...obj,
			id: obj._id.toString()
		})) as BusinessObject[];
	}
}

export const objectAutoDiscoveryService = new ObjectAutoDiscoveryService();
