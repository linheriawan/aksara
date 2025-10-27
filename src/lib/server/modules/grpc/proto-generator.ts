import type { ObjectDefinition, FieldDefinition } from '$lib/server/modules/object/types';

/**
 * Generates a .proto file from an ObjectDefinition
 */
export class ProtoGenerator {
	/**
	 * Generate proto file content from object definition
	 */
	static generateProto(objectDef: ObjectDefinition): string {
		const packageName = this.sanitizePackageName(objectDef.name);
		const serviceName = this.toServiceName(objectDef.name);
		const messageName = this.toMessageName(objectDef.name);

		const parts: string[] = [];

		// Header
		parts.push('syntax = "proto3";');
		parts.push('');
		parts.push(`package aksara.${packageName}.v1;`);
		parts.push('');
		parts.push(
			`option go_package = "github.com/linheriawan/aksara-advproto/proto/gen/${packageName}/v1;${packageName}v1";`
		);
		parts.push('');
		parts.push('import "google/protobuf/timestamp.proto";');
		parts.push('import "google/protobuf/struct.proto";');
		parts.push('');

		// Get enabled operations from gRPC publishing config
		const grpcConfig = objectDef.publishing?.protocols?.grpc;
		const operations = grpcConfig?.operations || ['Create', 'Get', 'List', 'Update', 'Delete'];
		const enabledOps = {
			create: operations.includes('Create'),
			get: operations.includes('Get'),
			list: operations.includes('List'),
			update: operations.includes('Update'),
			delete: operations.includes('Delete')
		};

		// Service definition
		parts.push(`// ${serviceName} provides operations for ${objectDef.displayName || objectDef.name}`);
		parts.push(`service ${serviceName} {`);

		if (enabledOps.create) {
			parts.push(`  // Create a new ${objectDef.displayName || objectDef.name}`);
			parts.push(`  rpc Create${messageName}(Create${messageName}Request) returns (Create${messageName}Response);`);
			parts.push('');
		}

		if (enabledOps.get) {
			parts.push(`  // Get ${objectDef.displayName || objectDef.name} by ID`);
			parts.push(`  rpc Get${messageName}(Get${messageName}Request) returns (Get${messageName}Response);`);
			parts.push('');
		}

		if (enabledOps.list) {
			parts.push(`  // List ${objectDef.displayName || objectDef.name}s with pagination`);
			parts.push(`  rpc List${messageName}s(List${messageName}sRequest) returns (List${messageName}sResponse);`);
			parts.push('');
		}

		if (enabledOps.update) {
			parts.push(`  // Update ${objectDef.displayName || objectDef.name}`);
			parts.push(`  rpc Update${messageName}(Update${messageName}Request) returns (Update${messageName}Response);`);
			parts.push('');
		}

		if (enabledOps.delete) {
			parts.push(`  // Delete ${objectDef.displayName || objectDef.name}`);
			parts.push(`  rpc Delete${messageName}(Delete${messageName}Request) returns (Delete${messageName}Response);`);
			parts.push('');
		}

		parts.push('}');
		parts.push('');

		// Main message
		parts.push(`// ${messageName} represents ${objectDef.displayName || objectDef.name}`);
		parts.push(`message ${messageName} {`);
		parts.push('  string id = 1;');

		let fieldNumber = 2;
		for (const field of objectDef.fields) {
			const protoType = this.mapFieldTypeToProto(field);
			const fieldName = this.toSnakeCase(field.name);
			const comment = field.description ? `  // ${field.description}` : '';

			if (comment) parts.push(comment);
			parts.push(`  ${protoType} ${fieldName} = ${fieldNumber};`);
			fieldNumber++;
		}

		// Metadata fields
		parts.push('');
		parts.push('  // Metadata');
		parts.push(`  google.protobuf.Timestamp created_at = ${fieldNumber++};`);
		parts.push(`  google.protobuf.Timestamp updated_at = ${fieldNumber++};`);
		parts.push(`  string created_by = ${fieldNumber++};`);
		parts.push(`  string updated_by = ${fieldNumber++};`);
		parts.push('}');
		parts.push('');

		// Request/Response messages (only for enabled operations)
		if (enabledOps.create) {
			parts.push(this.generateCreateMessages(messageName, objectDef));
		}
		if (enabledOps.get) {
			parts.push(this.generateGetMessages(messageName));
		}
		if (enabledOps.list) {
			parts.push(this.generateListMessages(messageName));
		}
		if (enabledOps.update) {
			parts.push(this.generateUpdateMessages(messageName, objectDef));
		}
		if (enabledOps.delete) {
			parts.push(this.generateDeleteMessages(messageName));
		}

		// Common messages (always include if any list operation is enabled)
		if (enabledOps.list || enabledOps.create || enabledOps.update) {
			parts.push(this.generateCommonMessages());
		}

		return parts.join('\n');
	}

	/**
	 * Map ObjectDefinition field type to protobuf type
	 */
	private static mapFieldTypeToProto(field: FieldDefinition): string {
		const baseType = this.getProtoBaseType(field);

		if (field.isArray) {
			return `repeated ${baseType}`;
		}

		if (!field.required && !field.isArray) {
			// Optional fields in proto3
			return `optional ${baseType}`;
		}

		return baseType;
	}

	private static getProtoBaseType(field: FieldDefinition): string {
		switch (field.type) {
			case 'string':
			case 'text':
			case 'email':
			case 'url':
			case 'phone':
				return 'string';

			case 'integer':
			case 'int32':
				return 'int32';

			case 'long':
			case 'int64':
				return 'int64';

			case 'float':
				return 'float';

			case 'double':
			case 'decimal':
				return 'double';

			case 'boolean':
				return 'bool';

			case 'date':
			case 'datetime':
			case 'timestamp':
				return 'google.protobuf.Timestamp';

			case 'json':
			case 'object':
				return 'google.protobuf.Struct';

			case 'bytes':
			case 'binary':
				return 'bytes';

			default:
				return 'string'; // Default fallback
		}
	}

	private static generateCreateMessages(messageName: string, objectDef: ObjectDefinition): string {
		const parts: string[] = [];

		parts.push(`// Create ${messageName} Request/Response`);
		parts.push(`message Create${messageName}Request {`);

		let fieldNumber = 1;
		for (const field of objectDef.fields) {
			if (field.autoGenerated) continue; // Skip auto-generated fields like ID

			const protoType = this.mapFieldTypeToProto(field);
			const fieldName = this.toSnakeCase(field.name);

			parts.push(`  ${protoType} ${fieldName} = ${fieldNumber++};`);
		}

		parts.push('}');
		parts.push('');
		parts.push(`message Create${messageName}Response {`);
		parts.push(`  ${messageName} data = 1;`);
		parts.push('  repeated ValidationError errors = 2;');
		parts.push('}');
		parts.push('');

		return parts.join('\n');
	}

	private static generateGetMessages(messageName: string): string {
		return `// Get ${messageName} Request/Response
message Get${messageName}Request {
  string id = 1;
}

message Get${messageName}Response {
  ${messageName} data = 1;
}
`;
	}

	private static generateListMessages(messageName: string): string {
		return `// List ${messageName}s Request/Response
message List${messageName}sRequest {
  int32 page = 1;
  int32 page_size = 2;
  google.protobuf.Struct filters = 3;
  repeated string sort = 4;
}

message List${messageName}sResponse {
  repeated ${messageName} items = 1;
  PaginationInfo pagination = 2;
}
`;
	}

	private static generateUpdateMessages(messageName: string, objectDef: ObjectDefinition): string {
		const parts: string[] = [];

		parts.push(`// Update ${messageName} Request/Response`);
		parts.push(`message Update${messageName}Request {`);
		parts.push('  string id = 1;');

		let fieldNumber = 2;
		for (const field of objectDef.fields) {
			if (field.autoGenerated) continue;

			const protoType = this.mapFieldTypeToProto(field);
			const fieldName = this.toSnakeCase(field.name);

			parts.push(`  ${protoType} ${fieldName} = ${fieldNumber++};`);
		}

		parts.push('}');
		parts.push('');
		parts.push(`message Update${messageName}Response {`);
		parts.push(`  ${messageName} data = 1;`);
		parts.push('  repeated ValidationError errors = 2;');
		parts.push('}');
		parts.push('');

		return parts.join('\n');
	}

	private static generateDeleteMessages(messageName: string): string {
		return `// Delete ${messageName} Request/Response
message Delete${messageName}Request {
  string id = 1;
  bool hard_delete = 2;
}

message Delete${messageName}Response {
  bool success = 1;
}
`;
	}

	private static generateCommonMessages(): string {
		return `// Common Messages
message PaginationInfo {
  int32 page = 1;
  int32 page_size = 2;
  int32 total_items = 3;
  int32 total_pages = 4;
  bool has_next = 5;
  bool has_prev = 6;
}

message ValidationError {
  string field = 1;
  string message = 2;
  string code = 3;
}
`;
	}

	// Utility functions
	private static sanitizePackageName(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '_')
			.replace(/_+/g, '_')
			.replace(/^_|_$/g, '');
	}

	private static toServiceName(name: string): string {
		return this.toPascalCase(name) + 'Service';
	}

	private static toMessageName(name: string): string {
		return this.toPascalCase(name);
	}

	private static toPascalCase(str: string): string {
		return str
			.replace(/[^a-zA-Z0-9]/g, ' ')
			.split(' ')
			.filter((s) => s.length > 0)
			.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
			.join('');
	}

	private static toSnakeCase(str: string): string {
		return str
			.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
			.replace(/^_/, '')
			.replace(/[^a-z0-9]/g, '_')
			.replace(/_+/g, '_');
	}

	/**
	 * Generate filename for proto file
	 */
	static generateProtoFilename(objectDef: ObjectDefinition): string {
		return `${this.sanitizePackageName(objectDef.name)}.proto`;
	}
}
