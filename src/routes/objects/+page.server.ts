/**
 * Server loader for Objects list page
 */

import type { PageServerLoad } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			objects: [],
			datasources: []
		};
	}

	try {
		const objects = await objectService.listObjectDefinitions(locals.user.id);
		const datasources = await datasourceService.list(locals.user.id);

		// Serialize for SvelteKit
		return {
			objects: objects.map((obj) => ({
				id: obj.id,
				name: obj.name,
				displayName: obj.displayName,
				description: obj.description,
				version: obj.version,
				objectType: obj.objectType || 'custom', // Default to custom for legacy objects
				status: obj.status || 'enabled',
				brokenReason: obj.brokenReason,
				primaryDatasourceId: obj.primaryDatasourceId || obj.directMapping?.datasourceId,
				primaryTable: obj.primaryTable || obj.directMapping?.table,
				fieldCount: obj.fields?.length || 0,
				joinCount: obj.joins?.length || obj.customMapping?.joins?.length || 0,
				publishing: obj.publishing || {},
				directMapping: obj.directMapping || null,
				createdAt: obj.createdAt.toISOString(),
				updatedAt: obj.updatedAt.toISOString()
			})),
			datasources: datasources.map((ds) => ({
				id: ds._id.toString(),
				name: ds.name,
				displayName: ds.displayName || ds.name,
				type: ds.type
			}))
		};
	} catch (error) {
		console.error('Failed to load objects:', error);
		return {
			objects: [],
			datasources: []
		};
	}
};
