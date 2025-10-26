/**
 * API endpoint for enabling an object
 *
 * POST /api/objects/[id]/enable - Enable object (publish with current config)
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';

/**
 * Enable an object (make it available for publishing)
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Update object status to enabled
		const updated = await objectService.updateObjectDefinition(
			params.id,
			{
				status: 'enabled'
			},
			locals.user.id
		);

		if (!updated) {
			return json({ error: 'Object not found' }, { status: 404 });
		}

		// TODO: Actually publish the object to configured protocols
		// This will be implemented in Phase 4-8 (API Publishing)

		return json({
			success: true,
			message: 'Object enabled successfully',
			object: {
				id: updated.id,
				name: updated.name,
				status: updated.status
			}
		});
	} catch (error: any) {
		console.error('Failed to enable object:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
