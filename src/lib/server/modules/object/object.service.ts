/**
 * Object Service
 *
 * Handles CRUD operations for Business Objects and their instances
 */

import { ObjectId } from 'mongodb';
import { db } from '$lib/server/database/mongodb';
import type {
	BusinessObject,
	ObjectData,
	ObjectOperationOptions,
	ValidationResult
} from './types';
import { ValidationEngine } from './validation-engine';
import { TransformationEngine } from './transformation-engine';
import { QueryBuilder, type QueryOptions } from './query-builder';
import { FieldMapper } from './field-mapper';
import { createDatabaseConnector } from '../datasource/database-connector';
import type { Connection } from '../connection/types';

export class ObjectService {
	private validationEngine: ValidationEngine;
	private transformationEngine: TransformationEngine;
	private queryBuilder: QueryBuilder;
	private fieldMapper: FieldMapper;

	constructor() {
		this.validationEngine = new ValidationEngine();
		this.transformationEngine = new TransformationEngine();
		this.queryBuilder = new QueryBuilder();
		this.fieldMapper = new FieldMapper();
	}

	/**
	 * PHASE 3: Migrate old single-datasource objects to new multi-datasource format
	 * Ensures backward compatibility with existing objects
	 */
	private migrateLegacyObject(obj: any): BusinessObject {
		// If object already has datasources array, return as-is
		if (obj.datasources && Array.isArray(obj.datasources)) {
			return obj as BusinessObject;
		}

		// Migrate old primaryDatasourceId to new datasources array
		if (obj.primaryDatasourceId) {
			return {
				...obj,
				datasources: [
					{
						id: obj.primaryDatasourceId,
						alias: 'main_db',
						isDefault: true
					}
				],
				// Keep old field for backward compatibility
				primaryDatasourceId: obj.primaryDatasourceId
			} as BusinessObject;
		}

		// No datasource specified (shouldn't happen, but handle gracefully)
		return obj as BusinessObject;
	}

	/**
	 * PHASE 3: Get default datasource from object definition
	 */
	private getDefaultDatasource(objectDef: BusinessObject): string {
		const defaultDs = objectDef.datasources?.find((ds) => ds.isDefault);
		return defaultDs?.id || objectDef.primaryDatasourceId || '';
	}

	/**
	 * Create a new business object definition
	 */
	async createObjectDefinition(
		objectDef: Omit<BusinessObject, 'id' | 'createdAt' | 'updatedAt'>,
		userId: string
	): Promise<BusinessObject> {
		const database = db();

		// Validate field mappings
		const mappingErrors = this.fieldMapper.validateMappings(objectDef as BusinessObject);
		if (mappingErrors.length > 0) {
			throw new Error(`Invalid field mappings: ${mappingErrors.join(', ')}`);
		}

		// Check if object name already exists
		const existing = await database.collection('objects').findOne({ name: objectDef.name });
		if (existing) {
			throw new Error(`Object with name '${objectDef.name}' already exists`);
		}

		const now = new Date();
		const object: BusinessObject = {
			...objectDef,
			version: objectDef.version || 1,
			createdBy: userId,
			createdAt: now,
			updatedAt: now
		} as BusinessObject;

		const result = await database.collection('objects').insertOne(object);

		return {
			...object,
			id: result.insertedId.toString()
		};
	}

	/**
	 * Get object definition by ID (with Phase 3 migration support)
	 */
	async getObjectDefinition(objectId: string): Promise<BusinessObject | null> {
		const database = db();

		const object = await database.collection('objects').findOne({ _id: new ObjectId(objectId) });

		if (!object) {
			return null;
		}

		const migratedObject = this.migrateLegacyObject(object);

		return {
			...migratedObject,
			id: object._id.toString()
		} as BusinessObject;
	}

	/**
	 * Get object definition by name (with Phase 3 migration support)
	 */
	async getObjectDefinitionByName(name: string): Promise<BusinessObject | null> {
		const database = db();

		const object = await database.collection('objects').findOne({ name });

		if (!object) {
			return null;
		}

		const migratedObject = this.migrateLegacyObject(object);

		return {
			...migratedObject,
			id: object._id.toString()
		} as BusinessObject;
	}

	/**
	 * List all object definitions (with Phase 3 migration support)
	 */
	async listObjectDefinitions(userId: string): Promise<BusinessObject[]> {
		const database = db();

		const objects = await database
			.collection('objects')
			.find({ deleted: { $ne: true } })
			.sort({ createdAt: -1 })
			.toArray();

		return objects.map((obj) => {
			const migratedObj = this.migrateLegacyObject(obj);
			return {
				...migratedObj,
				id: obj._id.toString()
			};
		}) as BusinessObject[];
	}

	/**
	 * List all public object definitions (for unauthenticated access)
	 */
	async listAllPublicObjectDefinitions(): Promise<BusinessObject[]> {
		const database = db();

		const objects = await database
			.collection('objects')
			.find({
				deleted: { $ne: true },
				status: 'enabled',
				'publishing.protocols.rest.enabled': true,
				'publishing.security.type': 'public'
			})
			.sort({ createdAt: -1 })
			.toArray();

		return objects.map((obj) => {
			const migratedObj = this.migrateLegacyObject(obj);
			return {
				...migratedObj,
				id: obj._id.toString()
			};
		}) as BusinessObject[];
	}

	/**
	 * Update object definition
	 */
	async updateObjectDefinition(
		objectId: string,
		updates: Partial<BusinessObject>,
		userId: string
	): Promise<BusinessObject> {
		const database = db();

		// Get existing object
		const existing = await this.getObjectDefinition(objectId);
		if (!existing) {
			throw new Error('Object not found');
		}

		// If fields or mappings changed, validate
		if (updates.fields) {
			const updatedObject = { ...existing, ...updates } as BusinessObject;
			const mappingErrors = this.fieldMapper.validateMappings(updatedObject);
			if (mappingErrors.length > 0) {
				throw new Error(`Invalid field mappings: ${mappingErrors.join(', ')}`);
			}
		}

		// Increment version if fields changed
		const version = updates.fields ? existing.version + 1 : existing.version;

		const result = await database.collection('objects').findOneAndUpdate(
			{ _id: new ObjectId(objectId) },
			{
				$set: {
					...updates,
					version,
					updatedAt: new Date()
				}
			},
			{ returnDocument: 'after' }
		);

		if (!result) {
			throw new Error('Failed to update object');
		}

		return {
			...result,
			id: result._id.toString()
		} as BusinessObject;
	}

	/**
	 * Delete object definition (soft delete)
	 */
	async deleteObjectDefinition(objectId: string, userId: string): Promise<void> {
		const database = db();

		await database.collection('objects').updateOne(
			{ _id: new ObjectId(objectId) },
			{
				$set: {
					deleted: true,
					deletedAt: new Date()
				}
			}
		);
	}

	/**
	 * Get connection for datasource
	 */
	private async getConnection(datasourceId: string): Promise<Connection> {
		const database = db();

		const datasource = await database
			.collection('datasources')
			.findOne({ _id: new ObjectId(datasourceId) });

		if (!datasource) {
			throw new Error('Datasource not found');
		}

		const connection = await database
			.collection('connections')
			.findOne({ _id: new ObjectId(datasource.connectionId) });

		if (!connection) {
			throw new Error('Connection not found');
		}

		return {
			...connection,
			id: connection._id.toString()
		} as Connection;
	}

	/**
	 * Create object instance (data row)
	 */
	async createObjectInstance(
		objectId: string,
		data: ObjectData,
		options: ObjectOperationOptions
	): Promise<ObjectData> {
		const objectDef = await this.getObjectDefinition(objectId);
		if (!objectDef) {
			throw new Error('Object not found');
		}

		// Validate if requested
		if (options.validate !== false) {
			const validation = this.validationEngine.validate(data, objectDef);
			if (!validation.valid) {
				throw new Error(
					`Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`
				);
			}
		}

		// Transform if requested
		let processedData = data;
		if (options.transform !== false) {
			processedData = this.transformationEngine.transformForCreate(data, objectDef);
		}

		// Build INSERT query
		const queryPlan = this.queryBuilder.buildInsertQuery(objectDef, processedData);

		// Get connection and execute
		const connection = await this.getConnection(objectDef.primaryDatasourceId);
		const connector = createDatabaseConnector(connection);

		// Adjust query syntax for PostgreSQL
		let finalQuery = queryPlan;
		if (connection.type === 'postgresql') {
			finalQuery = this.queryBuilder.toPostgreSQLSyntax(queryPlan);
		}

		const result = await connector.executeQuery(finalQuery.sql, finalQuery.params);

		// Return created object (ideally with generated ID)
		return {
			...processedData,
			id: result.insertId
		};
	}

	/**
	 * Get object instance by ID
	 */
	async getObjectInstance(
		objectId: string,
		instanceId: any,
		options: ObjectOperationOptions
	): Promise<ObjectData | null> {
		const objectDef = await this.getObjectDefinition(objectId);
		if (!objectDef) {
			throw new Error('Object not found');
		}

		// Build SELECT query
		const queryPlan = this.queryBuilder.buildSelectByIdQuery(objectDef, instanceId);

		// Get connection and execute
		const connection = await this.getConnection(objectDef.primaryDatasourceId);
		const connector = createDatabaseConnector(connection);

		// Adjust query syntax for PostgreSQL
		let finalQuery = queryPlan;
		if (connection.type === 'postgresql') {
			finalQuery = this.queryBuilder.toPostgreSQLSyntax(queryPlan);
		}

		const result = await connector.executeQuery(finalQuery.sql, finalQuery.params);

		if (!result.data || result.data.length === 0) {
			return null;
		}

		let instanceData = result.data[0];

		// Transform if requested
		if (options.transform !== false) {
			instanceData = this.transformationEngine.transformForRead(instanceData, objectDef);
		}

		return instanceData;
	}

	/**
	 * List object instances with filtering and pagination
	 */
	async listObjectInstances(
		objectId: string,
		queryOptions: QueryOptions,
		options: ObjectOperationOptions
	): Promise<{ data: ObjectData[]; total: number }> {
		const objectDef = await this.getObjectDefinition(objectId);
		if (!objectDef) {
			throw new Error('Object not found');
		}

		// Get connection
		const connection = await this.getConnection(objectDef.primaryDatasourceId);
		const connector = createDatabaseConnector(connection);

		// Build SELECT query
		const queryPlan = this.queryBuilder.buildSelectQuery(objectDef, queryOptions);

		// Adjust query syntax for PostgreSQL
		let finalQuery = queryPlan;
		if (connection.type === 'postgresql') {
			finalQuery = this.queryBuilder.toPostgreSQLSyntax(queryPlan);
		}

		// Execute query
		const result = await connector.executeQuery(finalQuery.sql, finalQuery.params);

		let data = result.data || [];

		// Transform if requested
		if (options.transform !== false) {
			data = data.map((row: ObjectData) =>
				this.transformationEngine.transformForRead(row, objectDef)
			);
		}

		// Get total count
		const countPlan = this.queryBuilder.buildCountQuery(objectDef, queryOptions);
		let finalCountQuery = countPlan;
		if (connection.type === 'postgresql') {
			finalCountQuery = this.queryBuilder.toPostgreSQLSyntax(countPlan);
		}

		const countResult = await connector.executeQuery(
			finalCountQuery.sql,
			finalCountQuery.params
		);
		const total = countResult.data?.[0]?.count || 0;

		return { data, total };
	}

	/**
	 * Update object instance
	 */
	async updateObjectInstance(
		objectId: string,
		instanceId: any,
		data: ObjectData,
		options: ObjectOperationOptions
	): Promise<ObjectData> {
		const objectDef = await this.getObjectDefinition(objectId);
		if (!objectDef) {
			throw new Error('Object not found');
		}

		// Validate if requested
		if (options.validate !== false) {
			const validation = this.validationEngine.validate(data, objectDef);
			if (!validation.valid) {
				throw new Error(
					`Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`
				);
			}
		}

		// Transform if requested
		let processedData = data;
		if (options.transform !== false) {
			processedData = this.transformationEngine.transformForUpdate(data, objectDef);
		}

		// Build UPDATE query
		const queryPlan = this.queryBuilder.buildUpdateQuery(objectDef, instanceId, processedData);

		// Get connection and execute
		const connection = await this.getConnection(objectDef.primaryDatasourceId);
		const connector = createDatabaseConnector(connection);

		// Adjust query syntax for PostgreSQL
		let finalQuery = queryPlan;
		if (connection.type === 'postgresql') {
			finalQuery = this.queryBuilder.toPostgreSQLSyntax(queryPlan);
		}

		await connector.executeQuery(finalQuery.sql, finalQuery.params);

		// Return updated instance
		return await this.getObjectInstance(objectId, instanceId, options) || processedData;
	}

	/**
	 * Delete object instance
	 */
	async deleteObjectInstance(
		objectId: string,
		instanceId: any,
		options: ObjectOperationOptions
	): Promise<void> {
		const objectDef = await this.getObjectDefinition(objectId);
		if (!objectDef) {
			throw new Error('Object not found');
		}

		// Build DELETE query
		const queryPlan = this.queryBuilder.buildDeleteQuery(objectDef, instanceId);

		// Get connection and execute
		const connection = await this.getConnection(objectDef.primaryDatasourceId);
		const connector = createDatabaseConnector(connection);

		// Adjust query syntax for PostgreSQL
		let finalQuery = queryPlan;
		if (connection.type === 'postgresql') {
			finalQuery = this.queryBuilder.toPostgreSQLSyntax(queryPlan);
		}

		await connector.executeQuery(finalQuery.sql, finalQuery.params);
	}
}

export const objectService = new ObjectService();
