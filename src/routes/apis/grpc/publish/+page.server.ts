import type { PageServerLoad } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { objects: [] };
	}

	try {
		const objects = await objectService.listObjectDefinitions(locals.user.id);

		return {
			objects: objects.map((obj) => ({
				id: obj._id.toString(),
				name: obj.name,
				displayName: obj.displayName,
				description: obj.description,
				fieldCount: obj.fields?.length || 0
			}))
		};
	} catch (error) {
		console.error('Failed to load objects:', error);
		return { objects: [] };
	}
};
