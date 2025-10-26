import { json, type RequestHandler } from '@sveltejs/kit';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * POST /api/datasources/[id]/test - Test datasource connection
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await datasourceService.testConnection(params.id, locals.user.id);
		return json(result);
	} catch (error: any) {
		return json(
			{
				success: false,
				message: 'Connection test failed',
				error: error.message
			},
			{ status: 500 }
		);
	}
};
