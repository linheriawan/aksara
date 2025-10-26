import { json, type RequestHandler } from '@sveltejs/kit';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * GET /api/datasources/[id]/views
 * List all views in the datasource
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const schema = await datasourceService.discoverSchema(params.id, locals.user.id);

		return json({
			views: schema.views || []
		});
	} catch (error: any) {
		console.error('Failed to list views:', error);
		return json({ error: error.message || 'Failed to list views' }, { status: 500 });
	}
};

/**
 * POST /api/datasources/[id]/views
 * Create a new view
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { name, definition } = await request.json();

		if (!name || !definition) {
			return json({ error: 'View name and definition are required' }, { status: 400 });
		}

		// Create view using raw SQL
		const createSQL = `CREATE VIEW ${name} AS ${definition}`;
		await datasourceService.executeQuery(params.id, createSQL, undefined, locals.user.id);

		return json({
			success: true,
			message: `View '${name}' created successfully`,
			view: { name, definition }
		});
	} catch (error: any) {
		console.error('Failed to create view:', error);
		return json({ error: error.message || 'Failed to create view' }, { status: 500 });
	}
};

/**
 * PUT /api/datasources/[id]/views
 * Update (replace) a view
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { name, definition } = await request.json();

		if (!name || !definition) {
			return json({ error: 'View name and definition are required' }, { status: 400 });
		}

		// Get datasource to determine type
		const datasource = await datasourceService.getById(params.id, locals.user.id);
		if (!datasource) {
			return json({ error: 'Datasource not found' }, { status: 404 });
		}

		const connection = await datasourceService.getConnection(params.id, locals.user.id);
		const datasourceType = datasource.type || connection.type;

		// Create or replace view (syntax varies by database)
		let updateSQL: string;
		if (datasourceType === 'mysql') {
			updateSQL = `CREATE OR REPLACE VIEW ${name} AS ${definition}`;
		} else if (datasourceType === 'postgresql') {
			updateSQL = `CREATE OR REPLACE VIEW ${name} AS ${definition}`;
		} else {
			return json({ error: 'Views not supported for this database type' }, { status: 400 });
		}

		await datasourceService.executeQuery(params.id, updateSQL, undefined, locals.user.id);

		return json({
			success: true,
			message: `View '${name}' updated successfully`,
			view: { name, definition }
		});
	} catch (error: any) {
		console.error('Failed to update view:', error);
		return json({ error: error.message || 'Failed to update view' }, { status: 500 });
	}
};

/**
 * DELETE /api/datasources/[id]/views
 * Drop a view
 */
export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { name } = await request.json();

		if (!name) {
			return json({ error: 'View name is required' }, { status: 400 });
		}

		const dropSQL = `DROP VIEW IF EXISTS ${name}`;
		await datasourceService.executeQuery(params.id, dropSQL, undefined, locals.user.id);

		return json({
			success: true,
			message: `View '${name}' dropped successfully`
		});
	} catch (error: any) {
		console.error('Failed to drop view:', error);
		return json({ error: error.message || 'Failed to drop view' }, { status: 500 });
	}
};
