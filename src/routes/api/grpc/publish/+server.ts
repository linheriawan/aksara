import { json, type RequestHandler } from '@sveltejs/kit';
import { objectService } from '$lib/server/modules/object/object.service';
import { ProtoGenerator } from '$lib/server/modules/grpc/proto-generator';
import { advProtoClient } from '$lib/server/modules/grpc/advproto-client';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { objectDefinitionId } = body;

		if (!objectDefinitionId) {
			return json({ error: 'objectDefinitionId is required' }, { status: 400 });
		}

		// Get object definition
		const objectDef = await objectService.getObjectDefinition(objectDefinitionId);
		if (!objectDef) {
			return json({ error: 'Object definition not found' }, { status: 404 });
		}

		// Generate proto file
		const protoContent = ProtoGenerator.generateProto(objectDef);
		const protoFilename = ProtoGenerator.generateProtoFilename(objectDef);
		const serviceName = `${objectDef.name}Service`;

		// Send to advProto service
		const result = await advProtoClient.publishProtoService({
			objectDefinitionId,
			protoContent,
			serviceName
		});

		if (!result.success) {
			return json({ error: result.error || 'Failed to publish gRPC service' }, { status: 500 });
		}

		// Save published service metadata to MongoDB
		await objectService.updateObjectDefinition(
			objectDefinitionId,
			{
				'publishing.protocols.grpc': {
					enabled: true,
					publishedAt: new Date(),
					serviceUrl: result.serviceUrl,
					serviceName,
					protoFilename
				}
			},
			locals.user.id
		);

		return json({
			success: true,
			data: {
				serviceName,
				protoFilename,
				serviceUrl: result.serviceUrl,
				protoContent // Return for preview
			}
		});
	} catch (error: any) {
		console.error('Failed to publish gRPC service:', error);
		return json({ error: error.message || 'Internal server error' }, { status: 500 });
	}
};
