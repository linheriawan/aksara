<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import DirectObjectConfigPanel from '$lib/components/object/DirectObjectConfigPanel.svelte';

	let { data }: { data: PageData } = $props();

	// Filter state
	let selectedDatasource = $state('all');
	let selectedStatus = $state('all');
	let searchQuery = $state('');

	// Selected object for configuration
	let configuringObject = $state<any | null>(null);

	// Sync state
	let isSyncing = $state(false);
	let syncMessage = $state('');

	// Filtered objects
	const filteredObjects = $derived(() => {
		return data.objects.filter((obj) => {
			// Datasource filter
			if (
				selectedDatasource !== 'all' &&
				obj.directMapping?.datasourceId !== selectedDatasource
			) {
				return false;
			}

			// Status filter
			if (selectedStatus !== 'all' && obj.status !== selectedStatus) {
				return false;
			}

			// Search filter
			if (searchQuery && !obj.displayName.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}

			return true;
		});
	});

	// Get datasource display name
	function getDatasourceName(datasourceId: string): string {
		const ds = data.datasources.find((d) => d.id === datasourceId);
		return ds ? `${ds.displayName} (${ds.type?.toUpperCase()})` : 'Unknown';
	}

	// Get status badge color
	function getStatusColor(status: string): string {
		switch (status) {
			case 'enabled':
				return 'bg-green-100 text-green-800';
			case 'disabled':
				return 'bg-gray-100 text-gray-800';
			case 'broken':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	// Get enabled protocols
	function getEnabledProtocols(publishing: any): string[] {
		if (!publishing?.protocols) return [];

		const protocols: string[] = [];
		if (publishing.protocols.rest?.enabled) protocols.push('REST');
		if (publishing.protocols.graphql?.enabled) protocols.push('GraphQL');
		if (publishing.protocols.grpc?.enabled) protocols.push('gRPC');
		if (publishing.protocols.websocket?.enabled) protocols.push('WebSocket');
		if (publishing.protocols.mqtt?.enabled) protocols.push('MQTT');
		if (publishing.protocols.soap?.enabled) protocols.push('SOAP');

		return protocols;
	}

	// Configure object
	function configureObject(object: any) {
		configuringObject = object;
	}

	// Close config panel
	function closeConfig() {
		configuringObject = null;
	}

	// Enable object
	async function enableObject(objectId: string) {
		try {
			const response = await fetch(`/api/objects/${objectId}/enable`, {
				method: 'POST'
			});

			if (response.ok) {
				window.location.reload();
			} else {
				const result = await response.json();
				alert(`Failed to enable: ${result.error}`);
			}
		} catch (error: any) {
			alert(`Error: ${error.message}`);
		}
	}

	// Disable object
	async function disableObject(objectId: string) {
		try {
			const response = await fetch(`/api/objects/${objectId}/disable`, {
				method: 'POST'
			});

			if (response.ok) {
				window.location.reload();
			} else {
				const result = await response.json();
				alert(`Failed to disable: ${result.error}`);
			}
		} catch (error: any) {
			alert(`Error: ${error.message}`);
		}
	}

	// Save configuration
	async function saveConfiguration(config: any) {
		if (!configuringObject) return;

		try {
			const response = await fetch(`/api/objects/${configuringObject.id}/publishing`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(config)
			});

			if (response.ok) {
				window.location.reload();
			} else {
				const result = await response.json();
				throw new Error(result.error || 'Failed to save configuration');
			}
		} catch (error: any) {
			throw error;
		}
	}

	// Sync direct objects from datasources
	async function syncDirectObjects() {
		isSyncing = true;
		syncMessage = '';

		try {
			const response = await fetch('/api/objects/sync-direct', {
				method: 'POST'
			});

			const result = await response.json();

			if (response.ok) {
				syncMessage = result.message;
				// Reload page after 2 seconds to show new objects
				setTimeout(() => {
					window.location.reload();
				}, 2000);
			} else {
				syncMessage = `Error: ${result.error}`;
			}
		} catch (error: any) {
			syncMessage = `Error: ${error.message}`;
		} finally {
			isSyncing = false;
		}
	}
</script>

<svelte:head>
	<title>Direct Objects - Aksara Platform</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<!-- Page Header -->
		<div>
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Direct Objects</h1>
					<p class="text-gray-600 mt-1">
						Auto-discovered objects from datasources (1:1 table mapping)
					</p>
				</div>
				<div class="flex space-x-2">
					<button
						onclick={syncDirectObjects}
						disabled={isSyncing}
						class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSyncing ? 'Syncing...' : '🔄 Sync from Datasources'}
					</button>
					<a
						href="/objects"
						class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
					>
						← All Objects
					</a>
				</div>
			</div>
		</div>

		<!-- Sync Message -->
		{#if syncMessage}
			<div class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
				{syncMessage}
			</div>
		{/if}

		<!-- Filters -->
		<div class="bg-white rounded-lg shadow p-4">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<!-- Search -->
				<div class="md:col-span-2">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search objects..."
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>

				<!-- Datasource filter -->
				<div>
					<select
						bind:value={selectedDatasource}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="all">All Datasources</option>
						{#each data.datasources as ds}
							<option value={ds.id}>{ds.displayName}</option>
						{/each}
					</select>
				</div>

				<!-- Status filter -->
				<div>
					<select
						bind:value={selectedStatus}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="all">All Statuses</option>
						<option value="enabled">Enabled</option>
						<option value="disabled">Disabled</option>
						<option value="broken">Broken</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Objects Table -->
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Object Name
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Datasource
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Table
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Protocols
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Fields
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filteredObjects() as object}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div>
									<div class="text-sm font-medium text-gray-900">{object.displayName}</div>
									<div class="text-xs text-gray-500">{object.name}</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
								{#if object.directMapping}
									{getDatasourceName(object.directMapping.datasourceId)}
								{:else}
									<span class="text-gray-400">-</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
								{object.directMapping?.table || '-'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(object.status)}">
									{object.status}
								</span>
								{#if object.brokenReason}
									<div class="text-xs text-red-600 mt-1">{object.brokenReason}</div>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if getEnabledProtocols(object.publishing).length > 0}
									<div class="flex gap-1 flex-wrap">
										{#each getEnabledProtocols(object.publishing) as protocol}
											<span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
												{protocol}
											</span>
										{/each}
									</div>
								{:else}
									<span class="text-xs text-gray-400">None</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
								{object.fieldCount}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
								<button
									onclick={() => configureObject(object)}
									class="text-blue-600 hover:text-blue-900"
								>
									Configure
								</button>
								<a
									href="/objects/{object.id}/api-docs"
									class="text-purple-600 hover:text-purple-900"
								>
									API Docs
								</a>
								{#if object.status === 'disabled'}
									<button
										onclick={() => enableObject(object.id)}
										class="text-green-600 hover:text-green-900"
									>
										Enable
									</button>
								{:else if object.status === 'enabled'}
									<button
										onclick={() => disableObject(object.id)}
										class="text-gray-600 hover:text-gray-900"
									>
										Disable
									</button>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center">
								<div class="space-y-4">
									<div class="text-gray-500">
										<p class="text-sm font-medium">No direct objects found.</p>
										<p class="text-xs mt-1">
											Direct objects are automatically created when you discover datasource schemas.
										</p>
									</div>

									{#if data.datasources.length > 0}
										<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
											<p class="text-sm text-blue-800 mb-3">
												<strong>You have {data.datasources.length} datasource{data.datasources.length > 1 ? 's' : ''}.</strong>
												<br />
												Click the "Sync from Datasources" button above to auto-generate objects from existing tables.
											</p>
											<button
												onclick={syncDirectObjects}
												disabled={isSyncing}
												class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
											>
												{isSyncing ? 'Syncing...' : '🔄 Sync Now'}
											</button>
										</div>
									{:else}
										<a
											href="/datasources"
											class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
										>
											+ Create Datasource First
										</a>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Summary -->
		<div class="text-sm text-gray-600">
			Showing {filteredObjects().length} of {data.objects.length} objects
		</div>
	</div>
</div>

<!-- Configuration Panel Modal -->
{#if configuringObject}
	<DirectObjectConfigPanel
		object={configuringObject}
		onClose={closeConfig}
		onSave={saveConfiguration}
	/>
{/if}
