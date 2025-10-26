/**
 * API endpoint to manually trigger direct object sync for all datasources
 *
 * POST /api/objects/sync-direct - Sync all datasources
 * POST /api/objects/sync-direct?datasourceId=xxx - Sync specific datasource
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';
import { objectAutoDiscoveryService } from '$lib/server/modules/object/object-auto-discovery.service';

/**
 * Manually trigger direct object sync
 */
export const POST: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const datasourceId = url.searchParams.get('datasourceId');

		if (datasourceId) {
			// Sync specific datasource
			const datasource = await datasourceService.getById(datasourceId, locals.user.id);
			if (!datasource) {
				return json({ error: 'Datasource not found' }, { status: 404 });
			}

			// Discover schema and sync
			const schema = await datasourceService.discoverSchema(datasourceId, locals.user.id);

			if (!schema) {
				return json({ error: 'Failed to discover schema' }, { status: 500 });
			}

			return json({
				success: true,
				message: `Synced ${schema.tables.length} tables from datasource ${datasource.name}`,
				tablesCount: schema.tables.length
			});
		} else {
			// Sync all datasources
			const datasources = await datasourceService.list(locals.user.id);

			let totalTables = 0;
			let syncedDatasources = 0;
			const errors: string[] = [];

			for (const datasource of datasources) {
				try {
					// Skip REST APIs (no schema to discover)
					if (datasource.type === 'rest_api') {
						continue;
					}

					const schema = await datasourceService.discoverSchema(
						datasource._id.toString(),
						locals.user.id
					);

					if (schema) {
						totalTables += schema.tables.length;
						syncedDatasources++;
					}
				} catch (error: any) {
					console.error(`Failed to sync datasource ${datasource.name}:`, error);
					errors.push(`${datasource.name}: ${error.message}`);
				}
			}

			return json({
				success: true,
				message: `Synced ${totalTables} tables from ${syncedDatasources} datasources`,
				syncedDatasources,
				totalTables,
				errors: errors.length > 0 ? errors : undefined
			});
		}
	} catch (error: any) {
		console.error('Failed to sync direct objects:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
