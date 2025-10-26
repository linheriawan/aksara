import { json, type RequestHandler } from '@sveltejs/kit';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * GET /api/datasources - List all datasources
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const datasources = await datasourceService.list(locals.user.id);
		return json({ datasources });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * POST /api/datasources - Create a new datasource
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();

		// Validate required fields
		if (!body.name || !body.type || !body.connection) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Validate datasource type
		const validTypes = ['mysql', 'postgresql', 'mongodb', 'rest_api'];
		if (!validTypes.includes(body.type)) {
			return json({ error: 'Invalid datasource type' }, { status: 400 });
		}

		const datasource = await datasourceService.create(
			{
				name: body.name,
				description: body.description,
				type: body.type,
				connection: body.connection,
				tags: body.tags || []
			},
			locals.user.id
		);

		return json({ datasource }, { status: 201 });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
