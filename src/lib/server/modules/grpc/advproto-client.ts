import { ADVPROTO_GRPC_URL } from '$env/static/private';

/**
 * Client to communicate with advProto gRPC service
 */
export class AdvProtoClient {
	private baseUrl: string;

	constructor() {
		this.baseUrl = ADVPROTO_GRPC_URL || 'http://localhost:50051';
	}

	/**
	 * Send proto file to advProto service for compilation and registration
	 */
	async publishProtoService(request: {
		objectDefinitionId: string;
		protoContent: string;
		serviceName: string;
	}): Promise<{ success: boolean; error?: string; serviceUrl?: string }> {
		try {
			// For now, we'll use HTTP endpoint on advProto to receive proto files
			// Later this will be a gRPC call
			const response = await fetch(`${this.baseUrl.replace(':50051', ':8080')}/api/grpc/publish`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					object_definition_id: request.objectDefinitionId,
					proto_content: request.protoContent,
					service_name: request.serviceName
				})
			});

			if (!response.ok) {
				const error = await response.text();
				return { success: false, error };
			}

			const result = await response.json();
			return {
				success: true,
				serviceUrl: `${this.baseUrl}/${request.serviceName}`
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message || 'Failed to publish gRPC service'
			};
		}
	}

	/**
	 * Get list of published gRPC services
	 */
	async listServices(): Promise<
		Array<{
			name: string;
			objectDefinitionId: string;
			status: 'active' | 'inactive';
			endpoint: string;
		}>
	> {
		try {
			const response = await fetch(`${this.baseUrl.replace(':50051', ':8080')}/api/grpc/services`);

			if (!response.ok) {
				throw new Error('Failed to fetch services');
			}

			const result = await response.json();
			return result.services || [];
		} catch (error) {
			console.error('Failed to list gRPC services:', error);
			return [];
		}
	}

	/**
	 * Unpublish a gRPC service
	 */
	async unpublishService(serviceName: string): Promise<{ success: boolean; error?: string }> {
		try {
			const response = await fetch(
				`${this.baseUrl.replace(':50051', ':8080')}/api/grpc/services/${serviceName}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.text();
				return { success: false, error };
			}

			return { success: true };
		} catch (error: any) {
			return {
				success: false,
				error: error.message || 'Failed to unpublish service'
			};
		}
	}

	/**
	 * Check health of advProto service
	 */
	async healthCheck(): Promise<{ healthy: boolean; version?: string }> {
		try {
			const response = await fetch(`${this.baseUrl.replace(':50051', ':8080')}/health`);

			if (!response.ok) {
				return { healthy: false };
			}

			const result = await response.json();
			return {
				healthy: result.status === 'healthy',
				version: result.version
			};
		} catch (error) {
			return { healthy: false };
		}
	}
}

export const advProtoClient = new AdvProtoClient();
