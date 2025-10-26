import { json, type RequestHandler } from '@sveltejs/kit';
import { connectionService } from '$lib/server/modules/connection/connection.service';

/**
 * GET /api/connections - List all connections
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const connections = await connectionService.list(locals.user.id);
		return json(connections);
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * POST /api/connections - Create a new connection
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, description, type, config } = body;

		if (!name || !type || !config) {
			return json({ error: 'Missing required fields: name, type, config' }, { status: 400 });
		}

		// Validate config based on type
		if (type !== 'rest_api') {
			if (!config.host) {
				return json({ error: 'Database connections require host' }, { status: 400 });
			}
		} else {
			if (!config.baseUrl) {
				return json({ error: 'API connections require baseUrl' }, { status: 400 });
			}
		}

		const connection = await connectionService.create(
			{
				name,
				description,
				type,
				config,
				status: 'pending',
				createdBy: locals.user.id,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			locals.user.id
		);

		return json(connection, { status: 201 });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
