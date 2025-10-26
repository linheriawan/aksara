import { json, type RequestHandler } from '@sveltejs/kit';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * GET /api/datasources/[id] - Get a single datasource
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

		return json({ datasource });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * PUT /api/datasources/[id] - Update a datasource
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();

		// Validate datasource type if provided
		if (body.type) {
			const validTypes = ['mysql', 'postgresql', 'mongodb', 'rest_api'];
			if (!validTypes.includes(body.type)) {
				return json({ error: 'Invalid datasource type' }, { status: 400 });
			}
		}

		const datasource = await datasourceService.update(
			params.id,
			{
				name: body.name,
				displayName: body.displayName,
				type: body.type,
				connectionId: body.connectionId
			},
			locals.user.id
		);

		if (!datasource) {
			return json({ error: 'Datasource not found' }, { status: 404 });
		}

		return json({ datasource });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * DELETE /api/datasources/[id] - Delete a datasource
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const deleted = await datasourceService.delete(params.id, locals.user.id);

		if (!deleted) {
			return json({ error: 'Datasource not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
