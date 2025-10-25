import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializePlatform } from '$lib/server/init';

/**
 * Initialize platform endpoint
 * This should only be called once during initial setup
 */
export const POST: RequestHandler = async () => {
	try {
		await initializePlatform();

		return json({
			success: true,
			message: 'Platform initialized successfully'
		});
	} catch (error: any) {
		console.error('Initialization error:', error);
		return json(
			{
				success: false,
				error: error.message || 'Failed to initialize platform'
			},
			{ status: 500 }
		);
	}
};
