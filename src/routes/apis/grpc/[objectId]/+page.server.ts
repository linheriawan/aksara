import type { PageServerLoad } from './$types';
import { objectService } from '$lib/server/modules/object/object.service';
import { ProtoGenerator } from '$lib/server/modules/grpc/proto-generator';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { objectId } = params;

	// Get object definition
	const objectDef = await objectService.getObjectDefinition(objectId);
	if (!objectDef) {
		throw error(404, 'Object not found');
	}

	// Generate proto preview
	const protoContent = ProtoGenerator.generateProto(objectDef);
	const protoFilename = ProtoGenerator.generateProtoFilename(objectDef);
	const serviceName = `${objectDef.name}Service`;

	// Check if already published
	const isPublished = objectDef.publishing?.protocols?.grpc?.enabled || false;

	return {
		object: {
			id: objectDef._id.toString(),
			name: objectDef.name,
			displayName: objectDef.displayName,
			description: objectDef.description,
			fieldCount: objectDef.fields?.length || 0
		},
		proto: {
			content: protoContent,
			filename: protoFilename,
			serviceName
		},
		isPublished
	};
};
