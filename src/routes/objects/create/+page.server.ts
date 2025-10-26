/**
 * Server loader for Create Object page
 */

import type { PageServerLoad } from './$types';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			datasources: []
		};
	}

	try {
		// Load datasources for selection - user-scoped query
		const datasources = await datasourceService.list(locals.user.id);

		return {
			datasources: datasources.map((ds) => ({
				id: ds._id.toString(),
				name: ds.name,
				displayName: ds.displayName,
				type: ds.type
			}))
		};
	} catch (error) {
		console.error('Failed to load datasources:', error);
		return {
			datasources: []
		};
	}
};
