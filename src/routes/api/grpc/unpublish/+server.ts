import { json, type RequestHandler } from '@sveltejs/kit';
import { advProtoClient } from '$lib/server/modules/grpc/advproto-client';
import { objectService } from '$lib/server/modules/object/object.service';

/**
 * Unpublish gRPC service by objectId (more reliable than by serviceName)
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { objectId } = body;

		if (!objectId) {
			return json({ error: 'objectId is required' }, { status: 400 });
		}

		console.log(`[Unpublish] Starting unpublish for objectId: ${objectId}`);

		// Get the object from MongoDB
		const objectDef = await objectService.getObjectDefinition(objectId);
		if (!objectDef) {
			return json({ error: 'Object not found' }, { status: 404 });
		}

		if (!objectDef.publishing?.protocols?.grpc?.enabled) {
			return json({ error: 'Object does not have gRPC enabled' }, { status: 400 });
		}

		const serviceName = objectDef.publishing.protocols.grpc.serviceName || `${objectDef.name}Service`;
		console.log(`[Unpublish] Found object: ${objectDef.name}, serviceName: ${serviceName}`);

		let advProtoHealthy = false;
		let advProtoError = null;

		// Try to unpublish from advProto
		try {
			const healthCheck = await advProtoClient.healthCheck();
			advProtoHealthy = healthCheck.healthy;

			if (!advProtoHealthy) {
				console.warn('[Unpublish] advProto service not running');
			} else {
				console.log(`[Unpublish] Unpublishing from advProto: ${serviceName}`);
				const result = await advProtoClient.unpublishService(serviceName);

				if (!result.success) {
					console.error('[Unpublish] advProto unpublish failed:', result.error);
					advProtoError = result.error;
				} else {
					console.log('[Unpublish] ✓ Unpublished from advProto');
				}
			}
		} catch (error: any) {
			console.error('[Unpublish] Error with advProto:', error);
			advProtoError = error.message;
		}

		// Update MongoDB
		await objectService.updateObjectDefinition(
			objectId,
			{
				'publishing.protocols.grpc.enabled': false,
				'publishing.protocols.grpc.unpublishedAt': new Date()
			},
			locals.user.id
		);

		console.log(`[Unpublish] ✓ Object ${objectDef.name} unpublished in MongoDB`);

		// Return success with warning if advProto was not available
		if (!advProtoHealthy || advProtoError) {
			return json({
				success: true,
				warning: true,
				error: `⚠️  advProto service was not running. Service unpublished from database only.`,
				message: 'Service unpublished successfully from database'
			});
		}

		return json({
			success: true,
			message: 'Service unpublished successfully'
		});
	} catch (error: any) {
		console.error('[Unpublish] Failed:', error);
		return json(
			{
				error: error.message || 'Internal server error'
			},
			{ status: 500 }
		);
	}
};
