/**
 * API endpoints for single Business Object
 *
 * GET    /api/objects/:id   - Get object definition
 * PUT    /api/objects/:id   - Update object definition
 * DELETE /api/objects/:id   - Delete object definition
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';

/**
 * Get object definition by ID
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const object = await objectService.getObjectDefinition(params.id);

		if (!object) {
			return json({ error: 'Object not found' }, { status: 404 });
		}

		return json({
			success: true,
			object
		});
	} catch (error: any) {
		console.error('Failed to get object:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * Update object definition
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Validate if name is being updated
		if (data.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(data.name)) {
			return json(
				{ error: 'Object name must be alphanumeric with underscores only' },
				{ status: 400 }
			);
		}

		const object = await objectService.updateObjectDefinition(
			params.id,
			data,
			locals.user.id
		);

		return json({
			success: true,
			object
		});
	} catch (error: any) {
		console.error('Failed to update object:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * Delete object definition (soft delete)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		await objectService.deleteObjectDefinition(params.id, locals.user.id);

		return json({
			success: true,
			message: 'Object deleted successfully'
		});
	} catch (error: any) {
		console.error('Failed to delete object:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
