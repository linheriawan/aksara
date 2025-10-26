import { json, type RequestHandler } from '@sveltejs/kit';
import { connectionService } from '$lib/server/modules/connection/connection.service';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * GET /api/connections/[id]/databases - List databases available on this connection
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const databases = await connectionService.listDatabases(params.id, locals.user.id);
		return json({ databases });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * POST /api/connections/[id]/databases - Create a new datasource (register existing database)
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, displayName } = body;

		if (!name) {
			return json({ error: 'Database name is required' }, { status: 400 });
		}

		// Get connection to determine type
		const connection = await connectionService.getById(params.id, locals.user.id);
		if (!connection) {
			return json({ error: 'Connection not found' }, { status: 404 });
		}

		// Create datasource
		const datasource = await datasourceService.create(
			{
				connectionId: params.id,
				name,
				displayName: displayName || name,
				type: connection.type,
				createdBy: locals.user.id,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			locals.user.id
		);

		return json(datasource, { status: 201 });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
