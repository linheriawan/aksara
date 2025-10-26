import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const datasource = await datasourceService.getById(params.id, locals.user.id);

	if (!datasource) {
		throw error(404, 'Datasource not found');
	}

	// Get schema information
	let schema: any = null;
	let tableInfo: any = null;

	try {
		schema = await datasourceService.discoverSchema(params.id, locals.user.id);

		// Find the specific table
		if (schema?.tables) {
			tableInfo = schema.tables.find((t: any) => t.name === params.table);
		}

		if (!tableInfo) {
			throw error(404, `Table "${params.table}" not found`);
		}
	} catch (err: any) {
		console.error('Failed to get table info:', err);
		throw error(500, err.message || 'Failed to load table information');
	}

	return {
		datasource: {
			id: datasource._id.toString(),
			name: datasource.name,
			type: datasource.type,
			status: datasource.status
		},
		table: tableInfo,
		tableName: params.table
	};
};
