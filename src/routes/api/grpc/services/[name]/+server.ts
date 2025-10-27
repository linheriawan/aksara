import { json, type RequestHandler } from '@sveltejs/kit';
import { advProtoClient } from '$lib/server/modules/grpc/advproto-client';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { name } = params;

	if (!name) {
		return json({ error: 'Service name is required' }, { status: 400 });
	}

	try {
		const result = await advProtoClient.unpublishService(name);

		if (!result.success) {
			return json({ error: result.error || 'Failed to unpublish service' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error: any) {
		console.error('Failed to unpublish gRPC service:', error);
		return json({ error: error.message || 'Internal server error' }, { status: 500 });
	}
};
