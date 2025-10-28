<script lang="ts">
	import type { PageData } from '../../../routes/objects/[id]/api-docs/$types';

	let { data }: { data: PageData['object'] } = $props();

	const baseURL = $derived(() => {
		if (typeof window !== 'undefined') {
			return `${window.location.protocol}//${window.location.host}`;
		}
		return 'http://localhost:3000';
	});

	const restMethods = $derived(() => {
		return data.publishing?.protocols?.rest?.methods || [];
	});

	const visibleFields = $derived(() => {
		return (data.fields || []).filter((field) => {
			const visibility = data.publishing?.fieldVisibility || {};
			return visibility[field.name] !== false;
		});
	});

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

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		alert('Copied to clipboard!');
	}
</script>

<div class="space-y-6">
	<h2 class="text-xl font-semibold text-gray-900">REST API Endpoints</h2>

	<div class="space-y-4">
		{#if restMethods().includes('GET')}
			<!-- GET - List all -->
			<div class="border border-gray-200 rounded-lg p-4">
				<div class="flex items-center space-x-3 mb-2">
					<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-mono rounded">
						GET
					</span>
					<code class="text-sm text-gray-700">/api/v1/{data.name}</code>
					<button
						onclick={() => copyToClipboard(`${baseURL()}/api/v1/${data.name}`)}
						class="text-blue-600 hover:text-blue-800 text-xs"
					>
						Copy URL
					</button>
				</div>
				<p class="text-sm text-gray-600 mb-3">Get all {data.displayName} records</p>

				<div class="mb-3">
					<div class="text-xs font-semibold text-gray-700 mb-2">Query Parameters:</div>
					<div class="space-y-1 text-xs text-gray-600">
						<div><code class="bg-gray-100 px-1 rounded">?page=1&limit=20</code> - Pagination</div>
						<div><code class="bg-gray-100 px-1 rounded">?sort=-created_at,name</code> - Sorting</div>
						<div><code class="bg-gray-100 px-1 rounded">?filter[field][operator]=value</code> - Filtering</div>
						<div><code class="bg-gray-100 px-1 rounded">?format=csv</code> - Export format</div>
					</div>
				</div>

				<div class="bg-gray-50 rounded p-3">
					<div class="text-xs text-gray-600 mb-1">Example Response:</div>
					<pre class="text-xs overflow-x-auto"><code>{JSON.stringify(
							{
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
							},
							null,
							2
						)}</code></pre>
				</div>
			</div>

			<!-- GET - By ID -->
			<div class="border border-gray-200 rounded-lg p-4">
				<div class="flex items-center space-x-3 mb-2">
					<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-mono rounded">
						GET
					</span>
					<code class="text-sm text-gray-700">/api/v1/{data.name}/:id</code>
					<button
						onclick={() => copyToClipboard(`${baseURL()}/api/v1/${data.name}/1`)}
						class="text-blue-600 hover:text-blue-800 text-xs"
					>
						Copy URL
					</button>
				</div>
				<p class="text-sm text-gray-600 mb-3">Get single {data.displayName} by ID</p>

				<div class="bg-gray-50 rounded p-3">
					<div class="text-xs text-gray-600 mb-1">Example Response:</div>
					<pre class="text-xs overflow-x-auto"><code>{JSON.stringify(
							{
								data: exampleResponse()
							},
							null,
							2
						)}</code></pre>
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
					<code class="text-sm text-gray-700">/api/v1/{data.name}</code>
				</div>
				<p class="text-sm text-gray-600 mb-3">Create new {data.displayName}</p>

				<div class="bg-gray-50 rounded p-3 mb-2">
					<div class="text-xs text-gray-600 mb-1">Request Body:</div>
					<pre class="text-xs overflow-x-auto"><code>{JSON.stringify(
							exampleResponse(),
							null,
							2
						)}</code></pre>
				</div>

				<div class="bg-gray-50 rounded p-3">
					<div class="text-xs text-gray-600 mb-1">Response (201 Created):</div>
					<pre class="text-xs overflow-x-auto"><code>{JSON.stringify(
							{ ...exampleResponse(), id: 1 },
							null,
							2
						)}</code></pre>
				</div>
			</div>
		{/if}

		{#if restMethods().includes('PUT') || restMethods().includes('PATCH')}
			<!-- PUT/PATCH - Update -->
			<div class="border border-gray-200 rounded-lg p-4">
				<div class="flex items-center space-x-3 mb-2">
					<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-mono rounded">
						{restMethods().includes('PUT') ? 'PUT' : 'PATCH'}
					</span>
					<code class="text-sm text-gray-700">/api/v1/{data.name}/:id</code>
				</div>
				<p class="text-sm text-gray-600 mb-3">Update {data.displayName}</p>

				<div class="bg-gray-50 rounded p-3">
					<div class="text-xs text-gray-600 mb-1">Request Body:</div>
					<pre class="text-xs overflow-x-auto"><code>{JSON.stringify(
							exampleResponse(),
							null,
							2
						)}</code></pre>
				</div>
			</div>
		{/if}

		{#if restMethods().includes('DELETE')}
			<!-- DELETE -->
			<div class="border border-gray-200 rounded-lg p-4">
				<div class="flex items-center space-x-3 mb-2">
					<span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-mono rounded"> DELETE </span>
					<code class="text-sm text-gray-700">/api/v1/{data.name}/:id</code>
				</div>
				<p class="text-sm text-gray-600 mb-3">Delete {data.displayName}</p>

				<div class="bg-gray-50 rounded p-3">
					<div class="text-xs text-gray-600 mb-1">Response (204 No Content):</div>
					<pre class="text-xs overflow-x-auto"><code>No content returned</code></pre>
				</div>
			</div>
		{/if}
	</div>

	<!-- Security Info -->
	<div class="mt-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Security</h3>

		<div class="space-y-3">
			<div>
				<div class="text-sm font-medium text-gray-700">Authentication Type:</div>
				<div class="text-sm text-gray-600 mt-1">
					{#if data.publishing?.security?.type === 'public'}
						<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Public (No Auth)</span>
					{:else if data.publishing?.security?.type === 'authenticated'}
						<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded"
							>Authenticated (JWT Required)</span
						>
					{:else if data.publishing?.security?.type === 'role_based'}
						<span class="px-2 py-1 bg-purple-100 text-purple-800 rounded">Role-Based</span>
					{:else}
						<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Not configured</span>
					{/if}
				</div>
			</div>

			{#if data.publishing?.security?.type === 'role_based' && data.publishing?.security?.allowedRoles?.length}
				<div>
					<div class="text-sm font-medium text-gray-700">Allowed Roles:</div>
					<div class="flex gap-2 mt-1">
						{#each data.publishing.security.allowedRoles as role}
							<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{role}</span>
						{/each}
					</div>
				</div>
			{/if}

			<div>
				<div class="text-sm font-medium text-gray-700">Rate Limit:</div>
				<div class="text-sm text-gray-600 mt-1">
					{data.publishing?.rateLimit?.requestsPerMinute || 1000} requests/minute (Burst: {data
						.publishing?.rateLimit?.burstLimit || 100})
				</div>
			</div>
		</div>
	</div>

	<!-- Response Schema -->
	<div class="mt-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Response Schema</h3>

		<table
			class="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden"
		>
			<thead class="bg-gray-50">
				<tr>
					<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"> Field </th>
					<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"> Type </th>
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
</div>
