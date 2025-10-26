import type { PageServerLoad } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		// Get all public APIs
		const publicObjects = await objectService.listAllPublicObjectDefinitions();

		// Get user's private APIs if authenticated
		const privateObjects = locals.user
			? await objectService.listObjectDefinitions(locals.user.id)
			: [];

		// Filter out objects that don't have REST enabled
		const publicApis = publicObjects.filter((obj) => obj.publishing?.protocols?.rest?.enabled);
		const privateApis = privateObjects.filter(
			(obj) =>
				obj.publishing?.protocols?.rest?.enabled &&
				obj.publishing?.security?.type !== 'public'
		);

		return {
			publicApis: publicApis.map((obj) => ({
				name: obj.name,
				displayName: obj.displayName,
				description: obj.description,
				status: obj.status,
				methods: obj.publishing?.protocols?.rest?.methods || []
			})),
			privateApis: privateApis.map((obj) => ({
				name: obj.name,
				displayName: obj.displayName,
				description: obj.description,
				status: obj.status,
				methods: obj.publishing?.protocols?.rest?.methods || []
			})),
			isAuthenticated: !!locals.user
		};
	} catch (error) {
		console.error('Failed to load API list:', error);
		return {
			publicApis: [],
			privateApis: [],
			isAuthenticated: !!locals.user
		};
	}
};
