/**
 * Dynamic REST API Endpoint - API v1 Collection Level
 * Handles: GET /api/v1/{objectName} and POST /api/v1/{objectName}
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { objectService } from '$lib/server/modules/object/object.service';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';
import {
	parseQueryParams,
	buildWhereClause,
	buildOrderByClause,
	buildLimitClause,
	calculatePaginationMeta
} from '$lib/server/modules/object/query-parser';
import {
	detectStreamFormat,
	getContentType,
	createNDJSONStream,
	createCSVStream
} from '$lib/server/modules/object/streaming';

/**
 * GET - List all records
 */
export const GET: RequestHandler = async ({ request, url, locals, params }) => {
	try {
		const objectName = params.objectName;
		const requestPath = `/api/v1/${objectName}`;

		// Find object by name or custom path (for public APIs, we need to check all objects)
		const allObjects = locals.user
			? await objectService.listObjectDefinitions(locals.user.id)
			: await objectService.listAllPublicObjectDefinitions();

		let object = allObjects.find(
			(o) => o.publishing?.protocols?.rest?.customPath === requestPath
		);

		// Fallback to name matching
		if (!object) {
			object = allObjects.find((o) => o.name === objectName);
		}

		if (!object) {
			return json({ error: 'Object not found' }, { status: 404 });
		}

		// Check if enabled
		if (object.status !== 'enabled') {
			return json({ error: 'Object not published' }, { status: 404 });
		}

		// Check if REST is enabled
		if (!object.publishing?.protocols?.rest?.enabled) {
			return json({ error: 'REST API not enabled for this object' }, { status: 404 });
		}

		// Check if GET method is allowed
		if (!object.publishing.protocols.rest.methods.includes('GET')) {
			return json({ error: 'GET method not allowed' }, { status: 405 });
		}

		// Check authentication based on security type
		const securityType = object.publishing?.security?.type || 'authenticated';
		console.log('Security check:', {
			objectName,
			securityType,
			hasUser: !!locals.user,
			publishingSecurity: object.publishing?.security
		});

		if (securityType === 'authenticated' && !locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get datasource connection for direct objects
		if (object.objectType === 'direct' && object.directMapping) {
			const datasourceId = object.directMapping.datasourceId;
			const tableName = object.directMapping.table;

			// Parse query parameters
			const queryOptions = parseQueryParams(url.searchParams);
			const restConfig = object.publishing.protocols.rest;

			console.log('API Debug:', {
				objectName,
				datasourceId,
				tableName,
				queryOptions
			});

			// Get visible fields
			const visibleFields = object.fields?.filter((field) => {
				const visibility = object.publishing?.fieldVisibility || {};
				return visibility[field.name] !== false;
			}).map(f => f.name) || [];

			const selectFields = visibleFields.length > 0 ? visibleFields.join(', ') : '*';

			// Build WHERE clause
			const whereClause = buildWhereClause(
				queryOptions.filters || [],
				restConfig.filtering?.allowedFields,
				restConfig.filtering?.allowedOperators
			);

			// Build ORDER BY clause
			const orderByClause = buildOrderByClause(
				queryOptions.sort || [],
				restConfig.sorting?.allowedFields,
				restConfig.sorting?.defaultSort
			);

			// Build LIMIT clause
			const limitClause = buildLimitClause(
				queryOptions.pagination,
				restConfig.maxPageSize,
				restConfig.defaultLimit
			);

			// Build final query
			const queryParts = [
				`SELECT ${selectFields} FROM ${tableName}`,
				whereClause.clause,
				orderByClause,
				limitClause.clause
			].filter(Boolean);

			const query = queryParts.join(' ');
			const params = [...whereClause.params, ...limitClause.params];

			console.log('Executing query:', { query, params });

			// Execute query (use object owner's ID for public APIs)
			const userId = locals.user?.id || object.createdBy;
			const rows = await datasourceService.executeQuery(
				datasourceId,
				query,
				params,
				userId
			);

			console.log('Query result:', { rowCount: rows?.length });

			if (!rows || !Array.isArray(rows)) {
				return json({
					error: 'Failed to execute query',
					debug: { datasourceId, tableName, query }
				}, { status: 500 });
			}

			// Get total count (if pagination is used)
			let totalCount = rows.length;
			if (queryOptions.pagination) {
				const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause.clause}`;
				const countResult = await datasourceService.executeQuery(
					datasourceId,
					countQuery,
					whereClause.params,
					userId
				);
				totalCount = countResult[0]?.total || 0;
			}

			// Detect requested format (JSON, NDJSON, CSV)
			const format = detectStreamFormat(
				request.headers.get('accept'),
				url.searchParams.get('format')
			);

			// Handle streaming formats
			if (format === 'ndjson') {
				const stream = createNDJSONStream(rows);
				return new Response(stream, {
					headers: {
						'Content-Type': getContentType('ndjson'),
						'Content-Disposition': `attachment; filename="${objectName}.ndjson"`
					}
				});
			}

			if (format === 'csv') {
				const stream = createCSVStream(rows, visibleFields.length > 0 ? visibleFields : Object.keys(rows[0] || {}));
				return new Response(stream, {
					headers: {
						'Content-Type': getContentType('csv'),
						'Content-Disposition': `attachment; filename="${objectName}.csv"`
					}
				});
			}

			// Default JSON response with metadata
			const metadata = calculatePaginationMeta(
				totalCount,
				queryOptions.pagination,
				restConfig.defaultLimit
			);

			return json({
				data: rows,
				metadata
			});
		}

		// TODO: Handle custom objects with joins

		return json({
			data: [],
			metadata: {
				total: 0,
				returned: 0,
				message: 'Custom objects not yet implemented'
			}
		});
	} catch (error: any) {
		console.error('API Error:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * POST - Create new record
 */
export const POST: RequestHandler = async ({ request, params, locals }) => {
	try {
		const objectName = params.objectName;
		const requestPath = `/api/v1/${objectName}`;

		// Find object (for public APIs, we need to check all objects)
		const allObjects = locals.user
			? await objectService.listObjectDefinitions(locals.user.id)
			: await objectService.listAllPublicObjectDefinitions();

		let object = allObjects.find(
			(o) => o.publishing?.protocols?.rest?.customPath === requestPath || o.name === objectName
		);

		if (!object || object.status !== 'enabled' || !object.publishing?.protocols?.rest?.enabled) {
			return json({ error: 'Object not found or not published' }, { status: 404 });
		}

		// Check if POST method is allowed
		if (!object.publishing.protocols.rest.methods.includes('POST')) {
			return json({ error: 'POST method not allowed' }, { status: 405 });
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

			// Get visible fields (only allow setting visible fields)
			const visibleFields = object.fields?.filter((field) => {
				const visibility = object.publishing?.fieldVisibility || {};
				return visibility[field.name] !== false;
			}) || [];

			// Validate: only accept fields that exist and are visible
			const allowedFieldNames = visibleFields.map(f => f.name);
			const invalidFields = Object.keys(data).filter(key => !allowedFieldNames.includes(key));

			if (invalidFields.length > 0) {
				return json({
					error: 'Invalid fields',
					details: `Fields not allowed: ${invalidFields.join(', ')}`
				}, { status: 400 });
			}

			// Build INSERT query
			const fields = Object.keys(data);
			const values = Object.values(data);

			if (fields.length === 0) {
				return json({ error: 'No data provided' }, { status: 400 });
			}

			const fieldList = fields.join(', ');
			const placeholders = fields.map(() => '?').join(', ');
			const insertQuery = `INSERT INTO ${tableName} (${fieldList}) VALUES (${placeholders})`;

			console.log('Executing INSERT:', { query: insertQuery, values });

			// Execute INSERT (use object owner's ID for public APIs)
			const userId = locals.user?.id || object.createdBy;
			await datasourceService.executeQuery(
				datasourceId,
				insertQuery,
				values,
				userId
			);

			// Get the inserted record (using LAST_INSERT_ID for MySQL)
			// TODO: Handle different databases (PostgreSQL uses RETURNING, MongoDB uses insertedId)
			const selectQuery = `SELECT * FROM ${tableName} WHERE id = LAST_INSERT_ID()`;
			const insertedRows = await datasourceService.executeQuery(
				datasourceId,
				selectQuery,
				[],
				userId
			);

			const insertedRecord = insertedRows[0] || { ...data };

			return json(
				{
					data: insertedRecord,
					metadata: {
						message: 'Record created successfully'
					}
				},
				{ status: 201 }
			);
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
