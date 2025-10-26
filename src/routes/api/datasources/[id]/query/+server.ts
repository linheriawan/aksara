import { json, type RequestHandler } from '@sveltejs/kit';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * POST /api/datasources/[id]/query - Execute a query
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { query, params: queryParams } = body;

		if (!query) {
			return json({ error: 'Query is required' }, { status: 400 });
		}

		// Execute the query
		const results = await datasourceService.executeQuery(
			params.id,
			query,
			queryParams,
			locals.user.id
		);

		return json({ results, count: results.length });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
