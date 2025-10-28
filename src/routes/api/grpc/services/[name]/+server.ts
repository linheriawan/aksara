import { json, type RequestHandler } from '@sveltejs/kit';
import { advProtoClient } from '$lib/server/modules/grpc/advproto-client';
import { objectService } from '$lib/server/modules/object/object.service';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { name } = params;

	if (!name) {
		return json({ error: 'Service name is required' }, { status: 400 });
	}

	let advProtoHealthy = false;
	let advProtoError = null;

	try {
		// Check if advProto service is running
		console.log(`[Unpublish] Checking advProto health for service: ${name}`);
		const healthCheck = await advProtoClient.healthCheck();
		advProtoHealthy = healthCheck.healthy;

		if (!advProtoHealthy) {
			console.warn('[Unpublish] advProto service not running, will update MongoDB only');
		} else {
			// Try to unpublish from advProto
			console.log(`[Unpublish] Unpublishing from advProto: ${name}`);
			const result = await advProtoClient.unpublishService(name);

			if (!result.success) {
				console.error('[Unpublish] advProto unpublish failed:', result.error);
				advProtoError = result.error;
				// Continue to update MongoDB anyway
			} else {
				console.log('[Unpublish] ✓ Unpublished from advProto successfully');
			}
		}
	} catch (error: any) {
		console.error('[Unpublish] Error communicating with advProto:', error);
		advProtoError = error.message;
		// Continue to update MongoDB
	}

	// Update MongoDB regardless of advProto status
	try {
		console.log(`[Unpublish] Updating MongoDB for service: ${name}`);

		// Find and update the object in MongoDB to set enabled: false
		const objects = await objectService.listObjectDefinitions(locals.user.id);

		// Debug: log all gRPC enabled objects
		const grpcObjects = objects.filter(obj => obj.publishing?.protocols?.grpc?.enabled);
		console.log(`[Unpublish] Found ${grpcObjects.length} gRPC-enabled objects:`);
		grpcObjects.forEach(obj => {
			console.log(`  - ${obj.name}: serviceName="${obj.publishing?.protocols?.grpc?.serviceName || 'NOT SET'}"`);
		});

		// Try to find by serviceName first
		let objectToUpdate = objects.find(
			(obj) => obj.publishing?.protocols?.grpc?.serviceName === name
		);

		// If not found by serviceName, try matching by expected service name pattern
		// ServiceName = {ObjectName}Service
		if (!objectToUpdate) {
			console.log(`[Unpublish] Not found by serviceName, trying pattern match...`);
			const expectedObjectName = name.replace(/Service$/, ''); // Remove "Service" suffix
			objectToUpdate = objects.find(
				(obj) => obj.name === expectedObjectName && obj.publishing?.protocols?.grpc?.enabled
			);
			if (objectToUpdate) {
				console.log(`[Unpublish] ✓ Found by pattern: ${objectToUpdate.name}`);
			}
		}

		// If still not found, try any object with gRPC enabled (last resort)
		if (!objectToUpdate && grpcObjects.length === 1) {
			console.log(`[Unpublish] Only one gRPC object found, using it: ${grpcObjects[0].name}`);
			objectToUpdate = grpcObjects[0];
		}

		if (objectToUpdate) {
			await objectService.updateObjectDefinition(
				objectToUpdate._id.toString(),
				{
					'publishing.protocols.grpc.enabled': false,
					'publishing.protocols.grpc.unpublishedAt': new Date()
				},
				locals.user.id
			);
			console.log(`[Unpublish] ✓ Object ${objectToUpdate.name} unpublished in MongoDB`);
		} else {
			console.error(`[Unpublish] ❌ Could not find object with serviceName: ${name}`);
			console.error(`[Unpublish] Available gRPC services:`, grpcObjects.map(o => ({
				name: o.name,
				serviceName: o.publishing?.protocols?.grpc?.serviceName
			})));
			return json(
				{
					error: `Service "${name}" not found in database. Available services: ${grpcObjects.map(o => o.name).join(', ') || 'none'}`
				},
				{ status: 404 }
			);
		}

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
		console.error('[Unpublish] MongoDB update failed:', error);
		return json(
			{
				error: `Failed to update database: ${error.message}`
			},
			{ status: 500 }
		);
	}
};
