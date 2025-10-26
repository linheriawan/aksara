/**
 * API endpoints for Business Objects
 *
 * GET    /api/objects       - List all objects
 * POST   /api/objects       - Create new object
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';

/**
 * List all business objects
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const objects = await objectService.listObjectDefinitions(locals.user.id);

		return json({
			success: true,
			objects: objects.map((obj) => ({
				id: obj.id,
				name: obj.name,
				displayName: obj.displayName,
				description: obj.description,
				version: obj.version,
				primaryDatasourceId: obj.primaryDatasourceId,
				primaryTable: obj.primaryTable,
				fieldCount: obj.fields.length,
				joinCount: obj.joins?.length || 0,
				createdAt: obj.createdAt,
				updatedAt: obj.updatedAt
			}))
		});
	} catch (error: any) {
		console.error('Failed to list objects:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * Create new business object (Phase 3: Multi-Datasource Support)
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Validate required fields
		if (!data.name) {
			return json({ error: 'Object name is required' }, { status: 400 });
		}

		if (!data.displayName) {
			return json({ error: 'Display name is required' }, { status: 400 });
		}

		// PHASE 3: Support both old and new formats
		// New format: datasources array
		// Old format: primaryDatasourceId (for backward compatibility)
		let datasources = data.datasources;

		if (!datasources) {
			// Old format - convert to new format
			if (!data.primaryDatasourceId) {
				return json({ error: 'At least one datasource is required' }, { status: 400 });
			}

			datasources = [
				{
					id: data.primaryDatasourceId,
					alias: 'main_db',
					isDefault: true
				}
			];
		}

		if (!Array.isArray(datasources) || datasources.length === 0) {
			return json({ error: 'At least one datasource is required' }, { status: 400 });
		}

		// Ensure at least one datasource is marked as default
		const hasDefault = datasources.some((ds: any) => ds.isDefault);
		if (!hasDefault) {
			datasources[0].isDefault = true;
		}

		if (!data.primaryTable) {
			return json({ error: 'Primary table is required' }, { status: 400 });
		}

		if (!data.fields || !Array.isArray(data.fields) || data.fields.length === 0) {
			return json({ error: 'At least one field is required' }, { status: 400 });
		}

		// Validate object name format (alphanumeric, underscore only)
		if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(data.name)) {
			return json(
				{ error: 'Object name must be alphanumeric with underscores only' },
				{ status: 400 }
			);
		}

		const object = await objectService.createObjectDefinition(
			{
				name: data.name,
				displayName: data.displayName,
				description: data.description || '',
				version: 1,
				fields: data.fields,
				datasources: datasources,
				primaryTable: data.primaryTable,
				joins: data.joins || [],
				crossDatasourceRelations: data.crossDatasourceRelations || [],
				// Keep for backward compatibility
				primaryDatasourceId: data.primaryDatasourceId,
				createdBy: locals.user.id,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			locals.user.id
		);

		return json(
			{
				success: true,
				object
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Failed to create object:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
