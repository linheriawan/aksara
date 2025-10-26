import { json, type RequestHandler } from '@sveltejs/kit';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * POST /api/datasources/[id]/databases - Create a new database
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { databaseName } = body;

		if (!databaseName) {
			return json({ error: 'Database name is required' }, { status: 400 });
		}

		const query = `CREATE DATABASE ${databaseName}`;

		// Execute the query
		await datasourceService.executeQuery(params.id, query, undefined, locals.user.id);

		return json({ success: true, message: `Database "${databaseName}" created successfully` });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * DELETE /api/datasources/[id]/databases - Drop a database
 */
export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { databaseName } = body;

		if (!databaseName) {
			return json({ error: 'Database name is required' }, { status: 400 });
		}

		const query = `DROP DATABASE ${databaseName}`;

		// Execute the query
		await datasourceService.executeQuery(params.id, query, undefined, locals.user.id);

		return json({ success: true, message: `Database "${databaseName}" dropped successfully` });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
