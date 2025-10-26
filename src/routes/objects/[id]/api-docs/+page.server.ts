import type { PageServerLoad } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const object = await objectService.getObjectDefinition(params.id);

		if (!object) {
			throw error(404, 'Object not found');
		}

		// Check if object is public or user is authenticated
		const isPublic = object.status === 'enabled' &&
			object.publishing?.protocols?.rest?.enabled &&
			object.publishing?.security?.type === 'public';

		if (!isPublic && !locals.user) {
			throw error(401, 'Unauthorized - API documentation is only available for authenticated users or public APIs');
		}

		return {
			object: {
				id: object.id,
				name: object.name,
				displayName: object.displayName,
				description: object.description,
				objectType: object.objectType,
				status: object.status,
				publishing: object.publishing,
				fields: object.fields || [],
				directMapping: object.directMapping,
				customMapping: object.customMapping
			}
		};
	} catch (err: any) {
		console.error('Failed to load object:', err);
		throw error(500, 'Failed to load object');
	}
};
