import type { RequestHandler } from './$types';
import { connectionService } from '$lib/server/modules/connection/connection.service';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { type, config } = await request.json();

		if (!type || !config) {
			return json({ error: 'Type and config are required' }, { status: 400 });
		}

		// Create a temporary connection object for testing
		const tempConnection = {
			name: 'Test Connection',
			type,
			config,
			createdBy: locals.user.id,
			createdAt: new Date(),
			updatedAt: new Date(),
			status: 'pending' as const
		};

		// Test the connection without saving it
		const result = await connectionService.testConnectionConfig(tempConnection);

		return json(result);
	} catch (error: any) {
		console.error('Test connection error:', error);
		return json(
			{
				success: false,
				message: error.message || 'Failed to test connection'
			},
			{ status: 500 }
		);
	}
};
