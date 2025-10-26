/**
 * API endpoints for single Object Instance
 *
 * GET    /api/objects/:id/data/:instanceId   - Get instance by ID
 * PUT    /api/objects/:id/data/:instanceId   - Update instance
 * DELETE /api/objects/:id/data/:instanceId   - Delete instance
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';

/**
 * Get object instance by ID
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const instance = await objectService.getObjectInstance(
			params.id,
			params.instanceId,
			{
				validate: false,
				transform: true,
				userId: locals.user.id
			}
		);

		if (!instance) {
			return json({ error: 'Instance not found' }, { status: 404 });
		}

		return json({
			success: true,
			data: instance
		});
	} catch (error: any) {
		console.error('Failed to get object instance:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * Update object instance
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		const instance = await objectService.updateObjectInstance(
			params.id,
			params.instanceId,
			data,
			{
				validate: true,
				transform: true,
				userId: locals.user.id
			}
		);

		return json({
			success: true,
			data: instance
		});
	} catch (error: any) {
		console.error('Failed to update object instance:', error);
		return json({ error: error.message }, { status: 400 });
	}
};

/**
 * Delete object instance
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		await objectService.deleteObjectInstance(params.id, params.instanceId, {
			validate: false,
			transform: false,
			userId: locals.user.id
		});

		return json({
			success: true,
			message: 'Instance deleted successfully'
		});
	} catch (error: any) {
		console.error('Failed to delete object instance:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
