import { json, type RequestHandler } from '@sveltejs/kit';
import { connectionService } from '$lib/server/modules/connection/connection.service';

/**
 * POST /api/connections/[id]/test - Test connection
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await connectionService.testConnection(params.id, locals.user.id);
		return json(result);
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
