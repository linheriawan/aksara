import type { PageServerLoad } from './$types';
import { connectionService } from '$lib/server/modules/connection/connection.service';
import { decryptConnectionCredentials } from '$lib/server/security/crypto';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const id = url.searchParams.get('id');

	// If no ID, this is create mode
	if (!id) {
		return {
			mode: 'create',
			connection: null
		};
	}

	// Edit mode - load existing connection
	const connection = await connectionService.getById(id, locals.user.id);

	if (!connection) {
		throw redirect(302, '/connections');
	}

	// Decrypt config for editing
	const decryptedConfig = decryptConnectionCredentials(connection.config);

	return {
		mode: 'edit',
		connection: {
			_id: connection._id.toString(),
			id: connection._id.toString(),
			name: connection.name,
			description: connection.description,
			type: connection.type,
			status: connection.status,
			config: decryptedConfig,
			createdAt: connection.createdAt.toISOString(),
			updatedAt: connection.updatedAt.toISOString(),
			lastTestedAt: connection.lastTestedAt?.toISOString()
		}
	};
};
