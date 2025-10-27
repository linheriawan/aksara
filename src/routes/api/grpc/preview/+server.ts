import { json, type RequestHandler } from '@sveltejs/kit';
import { objectService } from '$lib/server/modules/object/object.service';
import { ProtoGenerator } from '$lib/server/modules/grpc/proto-generator';

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

		return json({
			success: true,
			data: {
				protoContent,
				protoFilename,
				serviceName: `${objectDef.name}Service`
			}
		});
	} catch (error: any) {
		console.error('Failed to generate proto preview:', error);
		return json({ error: error.message || 'Internal server error' }, { status: 500 });
	}
};
