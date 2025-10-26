<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const baseURL = $derived(() => {
		if (typeof window !== 'undefined') {
			return `${window.location.protocol}//${window.location.host}`;
		}
		return 'http://localhost:3000';
	});

	// Get enabled protocols
	const enabledProtocols = $derived(() => {
		const protocols: string[] = [];
		if (data.object.publishing?.protocols?.rest?.enabled) protocols.push('REST');
		if (data.object.publishing?.protocols?.graphql?.enabled) protocols.push('GraphQL');
		if (data.object.publishing?.protocols?.grpc?.enabled) protocols.push('gRPC');
		if (data.object.publishing?.protocols?.websocket?.enabled) protocols.push('WebSocket');
		if (data.object.publishing?.protocols?.mqtt?.enabled) protocols.push('MQTT');
		if (data.object.publishing?.protocols?.soap?.enabled) protocols.push('SOAP');
		return protocols;
	});

	// Get REST methods
	const restMethods = $derived(() => {
		return data.object.publishing?.protocols?.rest?.methods || [];
	});

	// Get visible fields
	const visibleFields = $derived(() => {
		return (data.object.fields || []).filter((field) => {
			const visibility = data.object.publishing?.fieldVisibility || {};
			return visibility[field.name] !== false; // Show by default if not specified
		});
	});

	// Generate example response
	const exampleResponse = $derived(() => {
		const example: any = {};
		visibleFields().forEach((field) => {
			switch (field.type) {
				case 'string':
					example[field.name] = 'example_value';
					break;
				case 'integer':
					example[field.name] = 123;
					break;
				case 'number':
					example[field.name] = 123.45;
					break;
				case 'boolean':
					example[field.name] = true;
					break;
				case 'date':
					example[field.name] = '2024-01-01';
					break;
				case 'datetime':
					example[field.name] = '2024-01-01T12:00:00Z';
					break;
				case 'array':
					example[field.name] = ['item1', 'item2'];
					break;
				case 'json':
					example[field.name] = { key: 'value' };
					break;
				default:
					example[field.name] = null;
			}
		});
		return example;
	});

	// Copy to clipboard
	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		alert('Copied to clipboard!');
	}
</script>

<svelte:head>
	<title>API Documentation - {data.object.displayName}</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<!-- Header -->
		<div>
			<nav class="flex mb-4 text-sm text-gray-600">
				<a href="/api/v1/docs" class="hover:text-blue-600">API Documentation</a>
				<span class="mx-2">/</span>
				<span class="text-gray-900">{data.object.displayName}</span>
			</nav>

			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">{data.object.displayName} API</h1>
					<p class="text-gray-600 mt-1">API contract and documentation</p>
				</div>
				<div class="flex space-x-2">
					{#if data.object.status === 'enabled'}
						<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
							✓ Published
						</span>
					{:else}
						<span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
							Not Published
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Status Notice -->
		{#if data.object.status !== 'enabled'}
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<div class="flex items-start space-x-3">
					<svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						></path>
					</svg>
					<div class="text-sm text-yellow-800">
						<p class="font-semibold">This object is not published yet.</p>
						<p class="mt-1">
							Enable the object from <a
								href="/objects/direct"
								class="underline hover:text-yellow-900">Direct Objects</a
							> page to publish the API.
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Security Notice -->
		{#if data.object.publishing?.security?.type === 'public'}
			<div class="bg-green-50 border border-green-200 rounded-lg p-4">
				<div class="flex items-start space-x-3">
					<svg class="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						></path>
					</svg>
					<div class="text-sm text-green-800">
						<p class="font-semibold">🌐 Public API</p>
						<p class="mt-1">
							This API is publicly accessible and does not require authentication.
						</p>
					</div>
				</div>
			</div>
		{:else}
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<div class="flex items-start space-x-3">
					<svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
							clip-rule="evenodd"
						></path>
					</svg>
					<div class="text-sm text-yellow-800">
						<p class="font-semibold">🔒 Authenticated API</p>
						<p class="mt-1">
							This API requires authentication. Include your session token in the request.
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Enabled Protocols -->
		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Enabled Protocols</h2>
			{#if enabledProtocols().length > 0}
				<div class="flex gap-2 flex-wrap">
					{#each enabledProtocols() as protocol}
						<span class="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
							{protocol}
						</span>
					{/each}
				</div>
			{:else}
				<p class="text-gray-500 text-sm">No protocols enabled yet.</p>
			{/if}
		</div>

		<!-- REST API Documentation -->
		{#if data.object.publishing?.protocols?.rest?.enabled}
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">REST API Endpoints</h2>

				<div class="space-y-4">
					{#if restMethods().includes('GET')}
						<!-- GET - List all -->
						<div class="border border-gray-200 rounded-lg p-4">
							<div class="flex items-center space-x-3 mb-2">
								<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-mono rounded">
									GET
								</span>
								<code class="text-sm text-gray-700">/api/v1/{data.object.name}</code>
								<button
									onclick={() => copyToClipboard(`${baseURL()}/api/v1/${data.object.name}`)}
									class="text-blue-600 hover:text-blue-800 text-xs"
								>
									Copy URL
								</button>
							</div>
							<p class="text-sm text-gray-600 mb-3">Get all {data.object.displayName} records</p>

							<!-- Query Parameters -->
							<div class="mb-3">
								<div class="text-xs font-semibold text-gray-700 mb-2">Query Parameters:</div>
								<div class="space-y-1 text-xs text-gray-600">
									<div><code class="bg-gray-100 px-1 rounded">?page=1&limit=20</code> - Pagination</div>
									<div><code class="bg-gray-100 px-1 rounded">?sort=-created_at,name</code> - Sorting (- for DESC)</div>
									<div><code class="bg-gray-100 px-1 rounded">?filter[field][operator]=value</code> - Filtering</div>
									<div class="ml-4">Operators: eq, ne, gt, gte, lt, lte, in, like, between</div>
									<div><code class="bg-gray-100 px-1 rounded">?format=csv</code> or <code class="bg-gray-100 px-1 rounded">ndjson</code> - Export format</div>
								</div>
							</div>

							<!-- Examples -->
							<div class="mb-3">
								<div class="text-xs font-semibold text-gray-700 mb-2">Examples:</div>
								<div class="space-y-1">
									<button
										onclick={() => copyToClipboard(`${baseURL()}/api/v1/${data.object.name}?limit=10`)}
										class="block w-full text-left bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded text-xs"
									>
										<code>?limit=10</code> - First 10 records
									</button>
									<button
										onclick={() => copyToClipboard(`${baseURL()}/api/v1/${data.object.name}?format=csv`)}
										class="block w-full text-left bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded text-xs"
									>
										<code>?format=csv</code> - Export as CSV
									</button>
								</div>
							</div>

							<div class="bg-gray-50 rounded p-3">
								<div class="text-xs text-gray-600 mb-1">Example Response:</div>
								<pre class="text-xs overflow-x-auto"><code>{JSON.stringify({
									data: [exampleResponse()],
									metadata: {
										total: 100,
										returned: 20,
										page: 1,
										limit: 20,
										totalPages: 5,
										hasNext: true,
										hasPrev: false
									}
								}, null, 2)}</code></pre>
							</div>
						</div>

						<!-- GET - By ID -->
						<div class="border border-gray-200 rounded-lg p-4">
							<div class="flex items-center space-x-3 mb-2">
								<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-mono rounded">
									GET
								</span>
								<code class="text-sm text-gray-700">/api/v1/{data.object.name}/:id</code>
								<button
									onclick={() => copyToClipboard(`${baseURL()}/api/v1/${data.object.name}/1`)}
									class="text-blue-600 hover:text-blue-800 text-xs"
								>
									Copy URL
								</button>
							</div>
							<p class="text-sm text-gray-600 mb-3">Get single {data.object.displayName} by ID</p>

							<div class="mb-3 text-xs text-gray-600">
								<div class="font-semibold mb-1">Notes:</div>
								<div>• Supports composite keys: <code class="bg-gray-100 px-1 rounded">/api/v1/{data.object.name}/key1/key2/key3</code></div>
								<div>• Returns <code class="bg-gray-100 px-1 rounded">404</code> if record not found</div>
							</div>

							<div class="bg-gray-50 rounded p-3">
								<div class="text-xs text-gray-600 mb-1">Example Response:</div>
								<pre class="text-xs overflow-x-auto"><code>{JSON.stringify({
									data: exampleResponse()
								}, null, 2)}</code></pre>
							</div>
						</div>
					{/if}

					{#if restMethods().includes('POST')}
						<!-- POST - Create -->
						<div class="border border-gray-200 rounded-lg p-4">
							<div class="flex items-center space-x-3 mb-2">
								<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
									POST
								</span>
								<code class="text-sm text-gray-700">/api/v1/{data.object.name}</code>
							</div>
							<p class="text-sm text-gray-600 mb-3">Create new {data.object.displayName}</p>

							<div class="bg-gray-50 rounded p-3 mb-2">
								<div class="text-xs text-gray-600 mb-1">Request Body:</div>
								<pre
									class="text-xs overflow-x-auto"><code>{JSON.stringify(exampleResponse(), null, 2)}</code></pre>
							</div>

							<div class="bg-gray-50 rounded p-3">
								<div class="text-xs text-gray-600 mb-1">Response (201 Created):</div>
								<pre
									class="text-xs overflow-x-auto"><code>{JSON.stringify({ ...exampleResponse(), id: 1 }, null, 2)}</code></pre>
							</div>
						</div>
					{/if}

					{#if restMethods().includes('PUT') || restMethods().includes('PATCH')}
						<!-- PUT/PATCH - Update -->
						<div class="border border-gray-200 rounded-lg p-4">
							<div class="flex items-center space-x-3 mb-2">
								<span
									class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-mono rounded"
								>
									{restMethods().includes('PUT') ? 'PUT' : 'PATCH'}
								</span>
								<code class="text-sm text-gray-700">/api/v1/{data.object.name}/:id</code>
							</div>
							<p class="text-sm text-gray-600 mb-3">Update {data.object.displayName}</p>

							<div class="bg-gray-50 rounded p-3">
								<div class="text-xs text-gray-600 mb-1">Request Body:</div>
								<pre
									class="text-xs overflow-x-auto"><code>{JSON.stringify(exampleResponse(), null, 2)}</code></pre>
							</div>
						</div>
					{/if}

					{#if restMethods().includes('DELETE')}
						<!-- DELETE -->
						<div class="border border-gray-200 rounded-lg p-4">
							<div class="flex items-center space-x-3 mb-2">
								<span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-mono rounded">
									DELETE
								</span>
								<code class="text-sm text-gray-700">/api/v1/{data.object.name}/:id</code>
							</div>
							<p class="text-sm text-gray-600 mb-3">Delete {data.object.displayName}</p>

							<div class="bg-gray-50 rounded p-3">
								<div class="text-xs text-gray-600 mb-1">Response (204 No Content):</div>
								<pre class="text-xs overflow-x-auto"><code>No content returned</code></pre>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Security Info -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Security</h2>

				<div class="space-y-3">
					<div>
						<div class="text-sm font-medium text-gray-700">Authentication Type:</div>
						<div class="text-sm text-gray-600 mt-1">
							{#if data.object.publishing?.security?.type === 'public'}
								<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Public (No Auth)</span>
							{:else if data.object.publishing?.security?.type === 'authenticated'}
								<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded"
									>Authenticated (JWT Required)</span
								>
							{:else if data.object.publishing?.security?.type === 'role_based'}
								<span class="px-2 py-1 bg-purple-100 text-purple-800 rounded">Role-Based</span>
							{:else}
								<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Not configured</span>
							{/if}
						</div>
					</div>

					{#if data.object.publishing?.security?.type === 'role_based' && data.object.publishing?.security?.allowedRoles?.length}
						<div>
							<div class="text-sm font-medium text-gray-700">Allowed Roles:</div>
							<div class="flex gap-2 mt-1">
								{#each data.object.publishing.security.allowedRoles as role}
									<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{role}</span>
								{/each}
							</div>
						</div>
					{/if}

					<div>
						<div class="text-sm font-medium text-gray-700">Rate Limit:</div>
						<div class="text-sm text-gray-600 mt-1">
							{data.object.publishing?.rateLimit?.requestsPerMinute || 1000} requests/minute
							(Burst: {data.object.publishing?.rateLimit?.burstLimit || 100})
						</div>
					</div>
				</div>
			</div>

			<!-- Response Schema -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Response Schema</h2>

				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
								Field
							</th>
							<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
								Type
							</th>
							<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
								Required
							</th>
							<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
								Description
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each visibleFields() as field}
							<tr>
								<td class="px-4 py-2 text-sm font-mono text-gray-900">{field.name}</td>
								<td class="px-4 py-2 text-sm text-gray-600">{field.type}</td>
								<td class="px-4 py-2 text-sm text-gray-600">
									{#if field.required}
										<span class="text-red-600">Yes</span>
									{:else}
										<span class="text-gray-400">No</span>
									{/if}
								</td>
								<td class="px-4 py-2 text-sm text-gray-600">
									{field.description || '-'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
