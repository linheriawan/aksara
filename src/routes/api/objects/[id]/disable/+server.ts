/**
 * API endpoint for disabling an object
 *
 * POST /api/objects/[id]/disable - Disable object (unpublish from all protocols)
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';

/**
 * Disable an object (unpublish from all protocols)
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Update object status to disabled
		const updated = await objectService.updateObjectDefinition(
			params.id,
			{
				status: 'disabled'
			},
			locals.user.id
		);

		if (!updated) {
			return json({ error: 'Object not found' }, { status: 404 });
		}

		// TODO: Actually unpublish the object from all protocols
		// This will be implemented in Phase 4-8 (API Publishing)

		return json({
			success: true,
			message: 'Object disabled successfully',
			object: {
				id: updated.id,
				name: updated.name,
				status: updated.status
			}
		});
	} catch (error: any) {
		console.error('Failed to disable object:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
