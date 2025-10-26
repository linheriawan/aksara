import type { PageServerLoad } from './$types';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';
import { connectionService } from '$lib/server/modules/connection/connection.service';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const datasource = await datasourceService.getById(params.id, locals.user.id);

	if (!datasource) {
		throw redirect(302, '/datasources');
	}

	// Get connection info
	const connection = await connectionService.getById(datasource.connectionId, locals.user.id);

	// If datasource type is null, infer it from the connection
	const datasourceType = datasource.type || connection?.type || 'mysql';

	// Get all connections of the same type for the dropdown
	const allConnections = await connectionService.list(locals.user.id);
	const compatibleConnections = allConnections.filter((c) => c.type === datasourceType);

	return {
		datasource: {
			id: datasource._id.toString(),
			name: datasource.name,
			displayName: datasource.displayName || datasource.name,
			type: datasourceType,
			connectionId: datasource.connectionId,
			createdAt: datasource.createdAt.toISOString(),
			updatedAt: datasource.updatedAt.toISOString()
		},
		connection: connection
			? {
					id: connection._id.toString(),
					name: connection.name,
					type: connection.type,
					status: connection.status
				}
			: null,
		connections: compatibleConnections.map((c) => ({
			id: c._id.toString(),
			name: c.name,
			type: c.type
		}))
	};
};
