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

		// Check if advProto service is healthy
		const healthCheck = await advProtoClient.healthCheck();
		if (!healthCheck.healthy) {
			return json(
				{
					error: 'advProto service is not running. Please start it with: cd advProto && go run cmd/server/main.go'
				},
				{ status: 503 }
			);
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
			// Do NOT set enabled flag if publish failed
			return json({ error: result.error || 'Failed to publish gRPC service to advProto' }, { status: 500 });
		}

		// Only save to MongoDB if advProto publish succeeded
		// Preserve existing operations configuration
		const existingGrpcConfig = objectDef.publishing?.protocols?.grpc;
		const operations = existingGrpcConfig?.operations !== undefined
			? existingGrpcConfig.operations
			: ['Create', 'Get', 'List', 'Update', 'Delete'];

		await objectService.updateObjectDefinition(
			objectDefinitionId,
			{
				'publishing.protocols.grpc': {
					enabled: true,
					publishedAt: new Date(),
					serviceUrl: result.serviceUrl,
					serviceName,
					protoFilename,
					operations // ✅ Preserve operations configuration
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

		// Check if it's a network error (advProto not running)
		if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
			return json(
				{
					error: '❌ Cannot connect to advProto service. Is it running? Start it with: cd advProto && go run cmd/server/main.go'
				},
				{ status: 503 }
			);
		}

		return json({ error: error.message || 'Internal server error' }, { status: 500 });
	}
};
