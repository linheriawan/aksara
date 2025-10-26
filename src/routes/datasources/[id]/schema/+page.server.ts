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
	try {
		schema = await datasourceService.discoverSchema(params.id, locals.user.id);
	} catch (err: any) {
		console.error('Failed to discover schema:', err);
	}

	return {
		datasource: {
			id: datasource._id.toString(),
			name: datasource.name,
			type: datasource.type,
			status: datasource.status
		},
		schema
	};
};
