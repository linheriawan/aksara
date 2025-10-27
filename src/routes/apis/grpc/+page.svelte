<script lang="ts">
	import { onMount } from 'svelte';

	let services: Array<{
		name: string;
		objectDefinitionId: string;
		status: 'active' | 'inactive';
		endpoint: string;
	}> = [];

	let loading = true;
	let error = '';

	onMount(async () => {
		await loadServices();
	});

	async function loadServices() {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/grpc/services');
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to load services');
			}

			services = result.data || [];
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function unpublishService(serviceName: string) {
		if (!confirm(`Are you sure you want to unpublish ${serviceName}?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/grpc/services/${serviceName}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || 'Failed to unpublish service');
			}

			await loadServices();
		} catch (err: any) {
			alert(`Error: ${err.message}`);
		}
	}
</script>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<!-- Page header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">gRPC Services</h1>
				<p class="mt-1 text-sm text-gray-600">
					Manage your published gRPC services
				</p>
			</div>
			<a
				href="/apis/grpc/publish"
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
			>
				+ Publish New Service
			</a>
		</div>

		{#if error}
			<div class="p-4 bg-red-50 border border-red-200 rounded-md">
				<p class="text-sm text-red-800">❌ {error}</p>
			</div>
		{/if}

		<!-- Services table -->
		<div class="bg-white shadow rounded-lg overflow-hidden">
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div class="flex items-center gap-3">
						<svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span class="text-gray-600">Loading services...</span>
					</div>
				</div>
			{:else if services.length === 0}
				<div class="text-center py-12">
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No gRPC services</h3>
					<p class="mt-1 text-sm text-gray-500">Get started by publishing your first service.</p>
					<div class="mt-6">
						<a
							href="/apis/grpc/publish"
							class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
						>
							+ Publish New Service
						</a>
					</div>
				</div>
			{:else}
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Service Name
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Endpoint
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each services as service}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">{service.name}</div>
									<div class="text-xs text-gray-500">{service.objectDefinitionId}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if service.status === 'active'}
										<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
											Active
										</span>
									{:else}
										<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
											Inactive
										</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<code class="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{service.endpoint}</code>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<button
										on:click={() => unpublishService(service.name)}
										class="text-red-600 hover:text-red-900"
									>
										Unpublish
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
</div>
