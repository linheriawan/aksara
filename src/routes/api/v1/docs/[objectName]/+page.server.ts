import type { PageServerLoad } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const objectName = params.objectName;

		// Try to find object by name (first check authenticated user's objects, then public)
		let allObjects = locals.user
			? await objectService.listObjectDefinitions(locals.user.id)
			: [];

		let object = allObjects.find((o) => o.name === objectName);

		// If not found in user's objects, check public objects
		if (!object) {
			const publicObjects = await objectService.listAllPublicObjectDefinitions();
			object = publicObjects.find((o) => o.name === objectName);
		}

		if (!object) {
			throw error(404, 'API not found');
		}

		// Check if object is public or user is authenticated
		const isPublic =
			object.status === 'enabled' &&
			object.publishing?.protocols?.rest?.enabled &&
			object.publishing?.security?.type === 'public';

		if (!isPublic && !locals.user) {
			throw error(
				401,
				'Unauthorized - API documentation is only available for authenticated users or public APIs'
			);
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
		if (err.status) throw err;
		console.error('Failed to load object:', err);
		throw error(500, 'Failed to load API documentation');
	}
};
