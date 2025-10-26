/**
 * API endpoints for Direct Objects (auto-discovered from datasources)
 *
 * GET /api/objects/direct - List all direct objects
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { objectAutoDiscoveryService } from '$lib/server/modules/object/object-auto-discovery.service';

/**
 * List all direct objects for the current user
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const datasourceId = url.searchParams.get('datasourceId');

		let objects;
		if (datasourceId) {
			// Filter by specific datasource
			objects = await objectAutoDiscoveryService.listDirectObjects(datasourceId);
		} else {
			// Get all direct objects for this user
			objects = await objectAutoDiscoveryService.listAllDirectObjects(locals.user.id);
		}

		return json({
			success: true,
			objects: objects.map((obj) => ({
				id: obj.id,
				name: obj.name,
				displayName: obj.displayName,
				description: obj.description,
				objectType: obj.objectType,
				status: obj.status,
				brokenReason: obj.brokenReason,
				directMapping: obj.directMapping,
				publishing: obj.publishing,
				fieldCount: obj.fields?.length || 0,
				createdAt: obj.createdAt,
				updatedAt: obj.updatedAt
			}))
		});
	} catch (error: any) {
		console.error('Failed to list direct objects:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
