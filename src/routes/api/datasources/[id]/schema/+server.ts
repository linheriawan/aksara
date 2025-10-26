import { json, type RequestHandler } from '@sveltejs/kit';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * GET /api/datasources/[id]/schema - Discover datasource schema
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const schema = await datasourceService.discoverSchema(params.id, locals.user.id);

		if (!schema) {
			return json({ error: 'Datasource not found' }, { status: 404 });
		}

		return json({ schema });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
