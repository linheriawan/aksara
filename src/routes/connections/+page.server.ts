import type { PageServerLoad } from './$types';
import { connectionService } from '$lib/server/modules/connection/connection.service';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { connections: [] };
	}

	try {
		const connections = await connectionService.list(locals.user.id);

		// Get child datasources for each connection
		const connectionsWithDatasources = await Promise.all(
			connections.map(async (conn) => {
				try {
					const datasources = await datasourceService.listByConnection(
						conn._id.toString(),
						locals.user.id
					);
					return {
						_id: conn._id.toString(),
						id: conn._id.toString(),
						name: conn.name,
						description: conn.description,
						type: conn.type,
						status: conn.status,
						createdAt: conn.createdAt.toISOString(),
						updatedAt: conn.updatedAt.toISOString(),
						lastTestedAt: conn.lastTestedAt?.toISOString(),
						datasources: datasources.map((ds) => ({
							id: ds._id.toString(),
							name: ds.name,
							displayName: ds.displayName || ds.name,
							type: ds.type
						})),
						datasourceCount: datasources.length
					};
				} catch (error) {
					return {
						_id: conn._id.toString(),
						id: conn._id.toString(),
						name: conn.name,
						description: conn.description,
						type: conn.type,
						status: conn.status,
						createdAt: conn.createdAt.toISOString(),
						updatedAt: conn.updatedAt.toISOString(),
						lastTestedAt: conn.lastTestedAt?.toISOString(),
						datasources: [],
						datasourceCount: 0
					};
				}
			})
		);

		return {
			connections: connectionsWithDatasources
		};
	} catch (error: any) {
		console.error('Failed to load connections:', error);
		return {
			connections: [],
			error: error.message
		};
	}
};
