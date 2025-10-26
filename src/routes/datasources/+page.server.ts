import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';
import { connectionService } from '$lib/server/modules/connection/connection.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const datasources = await datasourceService.list(locals.user.id);
	const connections = await connectionService.list(locals.user.id);

	// Get connection info for each datasource
	const datasourcesWithConnection = await Promise.all(
		datasources.map(async (ds) => {
			try {
				const connection = await connectionService.getById(ds.connectionId, locals.user.id);
				return {
					id: ds._id.toString(),
					name: ds.name,
					displayName: ds.displayName || ds.name,
					type: ds.type,
					connectionId: ds.connectionId,
					connectionName: connection?.name || 'Unknown',
					createdAt: ds.createdAt.toISOString()
				};
			} catch (error) {
				return {
					id: ds._id.toString(),
					name: ds.name,
					displayName: ds.displayName || ds.name,
					type: ds.type,
					connectionId: ds.connectionId,
					connectionName: 'Unknown',
					createdAt: ds.createdAt.toISOString()
				};
			}
		})
	);

	return {
		datasources: datasourcesWithConnection,
		connections: connections.map((conn) => ({
			id: conn._id.toString(),
			name: conn.name,
			type: conn.type
		}))
	};
};
