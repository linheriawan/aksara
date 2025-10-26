/**
 * API endpoint for updating object publishing configuration
 *
 * PUT /api/objects/[id]/publishing - Update publishing config
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';

/**
 * Update publishing configuration for an object
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Validate publishing config
		if (!data.publishing) {
			return json({ error: 'Publishing configuration is required' }, { status: 400 });
		}

		// Update object
		const updated = await objectService.updateObjectDefinition(
			params.id,
			{
				publishing: data.publishing
			},
			locals.user.id
		);

		if (!updated) {
			return json({ error: 'Object not found' }, { status: 404 });
		}

		return json({
			success: true,
			object: {
				id: updated.id,
				name: updated.name,
				displayName: updated.displayName,
				publishing: updated.publishing,
				status: updated.status
			}
		});
	} catch (error: any) {
		console.error('Failed to update publishing config:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
