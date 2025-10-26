/**
 * API endpoints for Object Instance Data (CRUD on actual data)
 *
 * GET    /api/objects/:id/data       - List object instances
 * POST   /api/objects/:id/data       - Create new instance
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';
import type { QueryOptions } from '$lib/server/modules/object/query-builder';

/**
 * List object instances with filtering and pagination
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Parse query parameters
		const queryOptions: QueryOptions = {};

		// Pagination
		const limit = url.searchParams.get('limit');
		const offset = url.searchParams.get('offset');
		if (limit) queryOptions.limit = parseInt(limit);
		if (offset) queryOptions.offset = parseInt(offset);

		// Sorting
		const sortBy = url.searchParams.get('sort');
		const sortDir = url.searchParams.get('dir');
		if (sortBy) {
			queryOptions.sort = [
				{
					field: sortBy,
					direction: sortDir === 'desc' ? 'DESC' : 'ASC'
				}
			];
		}

		// Filtering (simple key=value filters)
		const filters: any[] = [];
		for (const [key, value] of url.searchParams.entries()) {
			if (!['limit', 'offset', 'sort', 'dir'].includes(key)) {
				filters.push({
					field: key,
					operator: 'eq',
					value
				});
			}
		}
		if (filters.length > 0) {
			queryOptions.filters = filters;
		}

		const result = await objectService.listObjectInstances(
			params.id,
			queryOptions,
			{
				validate: false,
				transform: true,
				userId: locals.user.id
			}
		);

		return json({
			success: true,
			data: result.data,
			total: result.total,
			limit: queryOptions.limit,
			offset: queryOptions.offset
		});
	} catch (error: any) {
		console.error('Failed to list object instances:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * Create new object instance
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		const instance = await objectService.createObjectInstance(params.id, data, {
			validate: true,
			transform: true,
			userId: locals.user.id
		});

		return json(
			{
				success: true,
				data: instance
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Failed to create object instance:', error);
		return json({ error: error.message }, { status: 400 });
	}
};
