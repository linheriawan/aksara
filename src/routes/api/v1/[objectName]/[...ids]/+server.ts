/**
 * Dynamic REST API Endpoint - API v1 Single Resource
 * Handles:
 * - GET /api/v1/{objectName}/{id}
 * - GET /api/v1/{objectName}/{key1}/{key2}/{key3} (composite keys)
 * - PUT /api/v1/{objectName}/{id}
 * - PATCH /api/v1/{objectName}/{id}
 * - DELETE /api/v1/{objectName}/{id}
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { objectService } from '$lib/server/modules/object/object.service';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * GET - Get single record by ID(s)
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const objectName = params.objectName;
		const ids = params.ids?.split('/') || [];

		// Find object (for public APIs, we need to check all objects)
		const allObjects = locals.user
			? await objectService.listObjectDefinitions(locals.user.id)
			: await objectService.listAllPublicObjectDefinitions();

		const object = allObjects.find((o) => o.name === objectName);

		if (!object || object.status !== 'enabled' || !object.publishing?.protocols?.rest?.enabled) {
			return json({ error: 'Object not found or not published' }, { status: 404 });
		}

		// Check if GET method is allowed
		if (!object.publishing.protocols.rest.methods.includes('GET')) {
			return json({ error: 'GET method not allowed' }, { status: 405 });
		}

		// Check authentication based on security type
		const securityType = object.publishing?.security?.type || 'authenticated';
		if (securityType === 'authenticated' && !locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Handle direct objects
		if (object.objectType === 'direct' && object.directMapping) {
			const datasourceId = object.directMapping.datasourceId;
			const tableName = object.directMapping.table;

			// Get primary key config
			const pkConfig = object.publishing?.primaryKey || { type: 'auto', fields: ['id'] };
			const pkFields = pkConfig.fields;

			// Build WHERE clause for composite or single key
			const whereConditions: string[] = [];
			const values: any[] = [];

			if (ids.length !== pkFields.length) {
				return json(
					{
						error: `Invalid number of IDs. Expected ${pkFields.length} (${pkFields.join(', ')}), got ${ids.length}`
					},
					{ status: 400 }
				);
			}

			pkFields.forEach((field, index) => {
				whereConditions.push(`${field} = ?`);
				values.push(ids[index]);
			});

			const whereClause = whereConditions.join(' AND ');
			const query = `SELECT * FROM ${tableName} WHERE ${whereClause} LIMIT 1`;

			// Execute query - returns array directly (use object owner's ID for public APIs)
			const userId = locals.user?.id || object.createdBy;
			const rows = await datasourceService.executeQuery(
				datasourceId,
				query,
				values,
				userId
			);

			if (!rows || !Array.isArray(rows) || rows.length === 0) {
				return json({ error: 'Record not found' }, { status: 404 });
			}

			// Filter visible fields
			const visibleFields = object.fields?.filter((field) => {
				const visibility = object.publishing?.fieldVisibility || {};
				return visibility[field.name] !== false;
			}).map(f => f.name) || [];

			const row = rows[0];
			let filteredData: any = row;

			if (visibleFields.length > 0) {
				filteredData = {};
				visibleFields.forEach(field => {
					if (row[field] !== undefined) {
						filteredData[field] = row[field];
					}
				});
			}

			return json({ data: filteredData });
		}

		// TODO: Handle custom objects
		return json(
			{ error: 'Custom objects not yet implemented' },
			{ status: 501 }
		);
	} catch (error: any) {
		console.error('API Error:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * PUT - Replace entire record
 */
export const PUT: RequestHandler = async ({ request, params, locals }) => {
	try {
		const objectName = params.objectName;
		const ids = params.ids?.split('/') || [];

		// Find object (for public APIs, we need to check all objects)
		const allObjects = locals.user
			? await objectService.listObjectDefinitions(locals.user.id)
			: await objectService.listAllPublicObjectDefinitions();

		const object = allObjects.find((o) => o.name === objectName);

		if (!object || object.status !== 'enabled' || !object.publishing?.protocols?.rest?.enabled) {
			return json({ error: 'Object not found or not published' }, { status: 404 });
		}

		// Check if PUT method is allowed
		if (!object.publishing.protocols.rest.methods.includes('PUT')) {
			return json({ error: 'PUT method not allowed' }, { status: 405 });
		}

		// Check authentication based on security type
		const securityType = object.publishing?.security?.type || 'authenticated';
		if (securityType === 'authenticated' && !locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const data = await request.json();

		// Handle direct objects
		if (object.objectType === 'direct' && object.directMapping) {
			const datasourceId = object.directMapping.datasourceId;
			const tableName = object.directMapping.table;

			// Get primary key config
			const pkConfig = object.publishing?.primaryKey || { type: 'auto', fields: ['id'] };
			const pkFields = pkConfig.fields;

			if (ids.length !== pkFields.length) {
				return json({
					error: `Invalid number of IDs. Expected ${pkFields.length} (${pkFields.join(', ')}), got ${ids.length}`
				}, { status: 400 });
			}

			// Get visible fields
			const visibleFields = object.fields?.filter((field) => {
				const visibility = object.publishing?.fieldVisibility || {};
				return visibility[field.name] !== false;
			}) || [];

			const allowedFieldNames = visibleFields.map(f => f.name);
			const invalidFields = Object.keys(data).filter(key => !allowedFieldNames.includes(key));

			if (invalidFields.length > 0) {
				return json({
					error: 'Invalid fields',
					details: `Fields not allowed: ${invalidFields.join(', ')}`
				}, { status: 400 });
			}

			// Build UPDATE query
			const updateFields = Object.keys(data);
			const updateValues = Object.values(data);

			if (updateFields.length === 0) {
				return json({ error: 'No data provided' }, { status: 400 });
			}

			const setClause = updateFields.map(field => `${field} = ?`).join(', ');
			const whereConditions = pkFields.map(field => `${field} = ?`).join(' AND ');

			const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE ${whereConditions}`;
			const params = [...updateValues, ...ids];

			console.log('Executing UPDATE:', { query: updateQuery, params });

			// Execute UPDATE (use object owner's ID for public APIs)
			const userId = locals.user?.id || object.createdBy;
			await datasourceService.executeQuery(
				datasourceId,
				updateQuery,
				params,
				userId
			);

			// Fetch updated record
			const selectQuery = `SELECT * FROM ${tableName} WHERE ${whereConditions}`;
			const updatedRows = await datasourceService.executeQuery(
				datasourceId,
				selectQuery,
				ids,
				userId
			);

			if (!updatedRows || updatedRows.length === 0) {
				return json({ error: 'Record not found after update' }, { status: 404 });
			}

			return json({
				data: updatedRows[0],
				metadata: {
					message: 'Record updated successfully'
				}
			});
		}

		// TODO: Handle custom objects
		return json({ error: 'Custom objects not yet implemented' }, { status: 501 });
	} catch (error: any) {
		console.error('API Error:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * PATCH - Partial update (same implementation as PUT in our case)
 */
export const PATCH: RequestHandler = async (event) => {
	// In our implementation, both PUT and PATCH allow partial updates
	// So we just delegate to PUT
	return PUT(event);
};

/**
 * DELETE - Delete record
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const objectName = params.objectName;
		const ids = params.ids?.split('/') || [];

		// Find object (for public APIs, we need to check all objects)
		const allObjects = locals.user
			? await objectService.listObjectDefinitions(locals.user.id)
			: await objectService.listAllPublicObjectDefinitions();

		const object = allObjects.find((o) => o.name === objectName);

		if (!object || object.status !== 'enabled' || !object.publishing?.protocols?.rest?.enabled) {
			return json({ error: 'Object not found or not published' }, { status: 404 });
		}

		// Check if DELETE method is allowed
		if (!object.publishing.protocols.rest.methods.includes('DELETE')) {
			return json({ error: 'DELETE method not allowed' }, { status: 405 });
		}

		// Check authentication based on security type
		const securityType = object.publishing?.security?.type || 'authenticated';
		if (securityType === 'authenticated' && !locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Handle direct objects
		if (object.objectType === 'direct' && object.directMapping) {
			const datasourceId = object.directMapping.datasourceId;
			const tableName = object.directMapping.table;

			// Get primary key config
			const pkConfig = object.publishing?.primaryKey || { type: 'auto', fields: ['id'] };
			const pkFields = pkConfig.fields;

			if (ids.length !== pkFields.length) {
				return json({
					error: `Invalid number of IDs. Expected ${pkFields.length} (${pkFields.join(', ')}), got ${ids.length}`
				}, { status: 400 });
			}

			// Build DELETE query
			const whereConditions = pkFields.map(field => `${field} = ?`).join(' AND ');
			const deleteQuery = `DELETE FROM ${tableName} WHERE ${whereConditions}`;

			console.log('Executing DELETE:', { query: deleteQuery, params: ids });

			// Execute DELETE (use object owner's ID for public APIs)
			const userId = locals.user?.id || object.createdBy;
			await datasourceService.executeQuery(
				datasourceId,
				deleteQuery,
				ids,
				userId
			);

			// Return 204 No Content (standard for successful DELETE)
			return new Response(null, { status: 204 });
		}

		// TODO: Handle custom objects
		return json({ error: 'Custom objects not yet implemented' }, { status: 501 });
	} catch (error: any) {
		console.error('API Error:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
