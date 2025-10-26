import { json, type RequestHandler } from '@sveltejs/kit';
import { connectionService } from '$lib/server/modules/connection/connection.service';

/**
 * GET /api/connections/[id] - Get a single connection
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const connection = await connectionService.getById(params.id, locals.user.id);

		if (!connection) {
			return json({ error: 'Connection not found' }, { status: 404 });
		}

		return json(connection);
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * PUT /api/connections/[id] - Update a connection
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, description, type, config } = body;

		const updates: any = {};
		if (name !== undefined) updates.name = name;
		if (description !== undefined) updates.description = description;
		if (type !== undefined) updates.type = type;
		if (config !== undefined) updates.config = config;

		const connection = await connectionService.update(params.id, updates, locals.user.id);

		if (!connection) {
			return json({ error: 'Connection not found' }, { status: 404 });
		}

		return json(connection);
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * DELETE /api/connections/[id] - Delete a connection
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const success = await connectionService.delete(params.id, locals.user.id);

		if (!success) {
			return json({ error: 'Connection not found or already deleted' }, { status: 404 });
		}

		return json({ success: true, message: 'Connection deleted successfully' });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
