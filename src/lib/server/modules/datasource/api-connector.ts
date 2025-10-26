import type {
	APIConnectorConfig,
	APIEndpointInfo,
	APIParameterInfo,
	ConnectionTestResult
} from './types';

export class APIConnector {
	private config: APIConnectorConfig;

	constructor(config: APIConnectorConfig) {
		this.config = config;
	}

	async testConnection(): Promise<ConnectionTestResult> {
		const start = Date.now();
		try {
			const headers = this.buildHeaders();

			// Test connection by making a simple GET request to the base URL
			const response = await fetch(this.config.baseUrl, {
				method: 'GET',
				headers
			});

			const responseTime = Date.now() - start;

			if (!response.ok && response.status !== 404) {
				// 404 is acceptable for base URL if API requires specific endpoints
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return {
				success: true,
				message: 'Successfully connected to API endpoint',
				details: {
					host: new URL(this.config.baseUrl).host,
					responseTime
				}
			};
		} catch (error: any) {
			return {
				success: false,
				message: 'Failed to connect to API endpoint',
				error: error.message
			};
		}
	}

	async discoverEndpoints(openApiUrl?: string): Promise<APIEndpointInfo[]> {
		if (openApiUrl) {
			return this.discoverFromOpenAPI(openApiUrl);
		}

		// If no OpenAPI spec provided, return empty array
		// User will need to manually define endpoints
		return [];
	}

	async executeRequest(
		endpoint: string,
		method: string = 'GET',
		params?: {
			query?: Record<string, any>;
			path?: Record<string, any>;
			body?: any;
			headers?: Record<string, string>;
		}
	): Promise<any> {
		try {
			let url = this.config.baseUrl + endpoint;

			// Replace path parameters
			if (params?.path) {
				Object.keys(params.path).forEach((key) => {
					url = url.replace(`{${key}}`, encodeURIComponent(params.path![key]));
				});
			}

			// Add query parameters
			if (params?.query) {
				const queryString = new URLSearchParams(
					Object.entries(params.query).reduce(
						(acc, [key, value]) => {
							acc[key] = String(value);
							return acc;
						},
						{} as Record<string, string>
					)
				).toString();
				url += `?${queryString}`;
			}

			const headers = this.buildHeaders(params?.headers);

			const options: RequestInit = {
				method,
				headers
			};

			if (params?.body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
				options.body = JSON.stringify(params.body);
			}

			const response = await fetch(url, options);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const contentType = response.headers.get('content-type');
			if (contentType?.includes('application/json')) {
				return await response.json();
			}

			return await response.text();
		} catch (error: any) {
			throw new Error(`API request failed: ${error.message}`);
		}
	}

	private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...this.config.headers
		};

		// Add authentication headers
		if (this.config.authType === 'bearer' && this.config.authConfig?.token) {
			headers['Authorization'] = `Bearer ${this.config.authConfig.token}`;
		} else if (this.config.authType === 'api_key' && this.config.authConfig?.apiKey) {
			const keyName = this.config.authConfig.keyName || 'X-API-Key';
			headers[keyName] = this.config.authConfig.apiKey;
		}

		// Merge with additional headers
		if (additionalHeaders) {
			Object.assign(headers, additionalHeaders);
		}

		return headers;
	}

	private async discoverFromOpenAPI(openApiUrl: string): Promise<APIEndpointInfo[]> {
		try {
			const response = await fetch(openApiUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
			}

			const spec = await response.json();
			const endpoints: APIEndpointInfo[] = [];

			// Parse OpenAPI 3.0 spec
			if (spec.openapi && spec.paths) {
				Object.keys(spec.paths).forEach((path) => {
					const pathItem = spec.paths[path];

					Object.keys(pathItem).forEach((method) => {
						if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
							const operation = pathItem[method];

							const parameters: APIParameterInfo[] = [];

							// Parse parameters
							if (operation.parameters) {
								operation.parameters.forEach((param: any) => {
									parameters.push({
										name: param.name,
										in: param.in,
										required: param.required || false,
										type: param.schema?.type || 'string',
										description: param.description
									});
								});
							}

							// Parse request body
							if (operation.requestBody) {
								const content = operation.requestBody.content?.['application/json'];
								if (content?.schema) {
									parameters.push({
										name: 'body',
										in: 'body',
										required: operation.requestBody.required || false,
										type: 'object',
										description: operation.requestBody.description
									});
								}
							}

							endpoints.push({
								path,
								method: method.toUpperCase(),
								description: operation.summary || operation.description,
								parameters,
								responseSchema: operation.responses?.['200']?.content?.['application/json']?.schema
							});
						}
					});
				});
			}
			// Parse Swagger 2.0 spec
			else if (spec.swagger && spec.paths) {
				Object.keys(spec.paths).forEach((path) => {
					const pathItem = spec.paths[path];

					Object.keys(pathItem).forEach((method) => {
						if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
							const operation = pathItem[method];

							const parameters: APIParameterInfo[] = [];

							if (operation.parameters) {
								operation.parameters.forEach((param: any) => {
									parameters.push({
										name: param.name,
										in: param.in,
										required: param.required || false,
										type: param.type || 'string',
										description: param.description
									});
								});
							}

							endpoints.push({
								path,
								method: method.toUpperCase(),
								description: operation.summary || operation.description,
								parameters,
								responseSchema: operation.responses?.['200']?.schema
							});
						}
					});
				});
			}

			return endpoints;
		} catch (error: any) {
			throw new Error(`Failed to discover endpoints from OpenAPI spec: ${error.message}`);
		}
	}
}

export function createAPIConnector(config: APIConnectorConfig): APIConnector {
	return new APIConnector(config);
}
