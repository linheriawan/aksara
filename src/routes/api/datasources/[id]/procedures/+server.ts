import { json, type RequestHandler } from '@sveltejs/kit';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * GET /api/datasources/[id]/procedures
 * List all stored procedures in the datasource (MySQL and PostgreSQL only)
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const datasource = await datasourceService.getById(params.id, locals.user.id);
		if (!datasource) {
			return json({ error: 'Datasource not found' }, { status: 404 });
		}

		const connection = await datasourceService.getConnection(params.id, locals.user.id);
		const datasourceType = datasource.type || connection.type;

		// MongoDB doesn't support stored procedures
		if (datasourceType === 'mongodb') {
			return json({ error: 'Stored procedures not supported for MongoDB' }, { status: 400 });
		}

		let procedures: any[] = [];

		if (datasourceType === 'mysql') {
			// List procedures in MySQL
			const result = await datasourceService.executeQuery(
				params.id,
				`SELECT ROUTINE_NAME as name, ROUTINE_DEFINITION as definition, ROUTINE_TYPE as type
         FROM information_schema.ROUTINES
         WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE'`,
				undefined,
				locals.user.id
			);
			procedures = result;
		} else if (datasourceType === 'postgresql') {
			// List functions in PostgreSQL (includes procedures)
			const result = await datasourceService.executeQuery(
				params.id,
				`SELECT proname as name, pg_get_functiondef(oid) as definition
         FROM pg_proc
         WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`,
				undefined,
				locals.user.id
			);
			procedures = result;
		}

		return json({ procedures });
	} catch (error: any) {
		console.error('Failed to list procedures:', error);
		return json({ error: error.message || 'Failed to list procedures' }, { status: 500 });
	}
};

/**
 * POST /api/datasources/[id]/procedures
 * Create a new stored procedure
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { name, definition, parameters } = await request.json();

		if (!name || !definition) {
			return json(
				{ error: 'Procedure name and definition are required' },
				{ status: 400 }
			);
		}

		const datasource = await datasourceService.getById(params.id, locals.user.id);
		if (!datasource) {
			return json({ error: 'Datasource not found' }, { status: 404 });
		}

		const connection = await datasourceService.getConnection(params.id, locals.user.id);
		const datasourceType = datasource.type || connection.type;

		if (datasourceType === 'mongodb') {
			return json({ error: 'Stored procedures not supported for MongoDB' }, { status: 400 });
		}

		// Execute the CREATE PROCEDURE statement
		// User should provide the full CREATE PROCEDURE syntax
		await datasourceService.executeQuery(params.id, definition, undefined, locals.user.id);

		return json({
			success: true,
			message: `Procedure '${name}' created successfully`,
			procedure: { name, definition }
		});
	} catch (error: any) {
		console.error('Failed to create procedure:', error);
		return json({ error: error.message || 'Failed to create procedure' }, { status: 500 });
	}
};

/**
 * PUT /api/datasources/[id]/procedures
 * Update (replace) a stored procedure
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { name, definition } = await request.json();

		if (!name || !definition) {
			return json(
				{ error: 'Procedure name and definition are required' },
				{ status: 400 }
			);
		}

		const datasource = await datasourceService.getById(params.id, locals.user.id);
		if (!datasource) {
			return json({ error: 'Datasource not found' }, { status: 404 });
		}

		const connection = await datasourceService.getConnection(params.id, locals.user.id);
		const datasourceType = datasource.type || connection.type;

		if (datasourceType === 'mongodb') {
			return json({ error: 'Stored procedures not supported for MongoDB' }, { status: 400 });
		}

		// Drop existing procedure first
		const dropSQL =
			datasourceType === 'mysql'
				? `DROP PROCEDURE IF EXISTS ${name}`
				: `DROP FUNCTION IF EXISTS ${name}`;

		await datasourceService.executeQuery(params.id, dropSQL, undefined, locals.user.id);

		// Create new version
		await datasourceService.executeQuery(params.id, definition, undefined, locals.user.id);

		return json({
			success: true,
			message: `Procedure '${name}' updated successfully`,
			procedure: { name, definition }
		});
	} catch (error: any) {
		console.error('Failed to update procedure:', error);
		return json({ error: error.message || 'Failed to update procedure' }, { status: 500 });
	}
};

/**
 * DELETE /api/datasources/[id]/procedures
 * Drop a stored procedure
 */
export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { name } = await request.json();

		if (!name) {
			return json({ error: 'Procedure name is required' }, { status: 400 });
		}

		const datasource = await datasourceService.getById(params.id, locals.user.id);
		if (!datasource) {
			return json({ error: 'Datasource not found' }, { status: 404 });
		}

		const connection = await datasourceService.getConnection(params.id, locals.user.id);
		const datasourceType = datasource.type || connection.type;

		if (datasourceType === 'mongodb') {
			return json({ error: 'Stored procedures not supported for MongoDB' }, { status: 400 });
		}

		const dropSQL =
			datasourceType === 'mysql'
				? `DROP PROCEDURE IF EXISTS ${name}`
				: `DROP FUNCTION IF EXISTS ${name}`;

		await datasourceService.executeQuery(params.id, dropSQL, undefined, locals.user.id);

		return json({
			success: true,
			message: `Procedure '${name}' dropped successfully`
		});
	} catch (error: any) {
		console.error('Failed to drop procedure:', error);
		return json({ error: error.message || 'Failed to drop procedure' }, { status: 500 });
	}
};
