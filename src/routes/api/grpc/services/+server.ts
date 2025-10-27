import { json, type RequestHandler } from '@sveltejs/kit';
import { advProtoClient } from '$lib/server/modules/grpc/advproto-client';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const services = await advProtoClient.listServices();

		return json({
			success: true,
			data: services
		});
	} catch (error: any) {
		console.error('Failed to list gRPC services:', error);
		return json({ error: error.message || 'Internal server error' }, { status: 500 });
	}
};
