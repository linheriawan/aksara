import type { PageServerLoad } from './$types';
import { objectAutoDiscoveryService } from '$lib/server/modules/object/object-auto-discovery.service';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			objects: [],
			datasources: []
		};
	}

	try {
		// Get all direct objects
		const objects = await objectAutoDiscoveryService.listAllDirectObjects(locals.user.id);

		// Get all datasources for filter dropdown
		const datasources = await datasourceService.list(locals.user.id);

		return {
			objects: objects.map((obj) => ({
				id: obj.id,
				name: obj.name,
				displayName: obj.displayName,
				description: obj.description,
				status: obj.status,
				brokenReason: obj.brokenReason,
				directMapping: obj.directMapping,
				publishing: obj.publishing,
				fields: obj.fields || [], // Include full fields array
				fieldCount: obj.fields?.length || 0,
				createdAt: obj.createdAt?.toISOString(),
				updatedAt: obj.updatedAt?.toISOString()
			})),
			datasources: datasources.map((ds) => ({
				id: ds._id.toString(),
				name: ds.name,
				displayName: ds.displayName || ds.name,
				type: ds.type
			}))
		};
	} catch (error) {
		console.error('Failed to load direct objects:', error);
		return {
			objects: [],
			datasources: []
		};
	}
};
