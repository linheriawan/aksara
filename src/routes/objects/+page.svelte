<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import DirectObjectConfigPanel from '$lib/components/object/DirectObjectConfigPanel.svelte';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	let selectedType = $state<'all' | 'direct' | 'custom'>('all');
	let selectedDatasource = $state('all');
	let selectedStatus = $state('all');
	let isDeleting = $state(false);
	let isSyncing = $state(false);
	let syncMessage = $state('');
	let configuringObject = $state<any | null>(null);

	// Filter objects by type, datasource, status, and search
	const filteredObjects = $derived(() => {
		return data.objects.filter((obj) => {
			// Type filter
			if (selectedType !== 'all' && obj.objectType !== selectedType) {
				return false;
			}

			// Datasource filter (only affects direct objects, has no effect on custom)
			if (selectedDatasource !== 'all' && obj.objectType === 'direct' && obj.primaryDatasourceId !== selectedDatasource) {
				return false;
			}

			// Status filter
			if (selectedStatus !== 'all' && obj.status !== selectedStatus) {
				return false;
			}

			// Search filter
			if (searchTerm) {
				const search = searchTerm.toLowerCase();
				return (
					obj.name.toLowerCase().includes(search) ||
					obj.displayName.toLowerCase().includes(search) ||
					(obj.description && obj.description.toLowerCase().includes(search))
				);
			}

			return true;
		});
	});

	// Count by type
	const counts = $derived(() => {
		const all = data.objects.length;
		const direct = data.objects.filter((obj) => obj.objectType === 'direct').length;
		const custom = data.objects.filter((obj) => obj.objectType === 'custom').length;
		return { all, direct, custom };
	});

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

	// Get type badge color
	function getTypeColor(type: string): string {
		return type === 'direct' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
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

	// Get datasource display name
	function getDatasourceName(datasourceId: string): string {
		const ds = data.datasources.find((d) => d.id === datasourceId);
		return ds ? `${ds.displayName} (${ds.type?.toUpperCase()})` : 'Unknown';
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

	async function deleteObject(id: string, name: string) {
		if (!confirm(`Are you sure you want to delete object "${name}"?`)) {
			return;
		}

		isDeleting = true;
		try {
			const response = await fetch(`/api/objects/${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				window.location.reload();
			} else {
				const result = await response.json();
				alert(`Failed to delete: ${result.error}`);
			}
		} catch (error: any) {
			alert(`Error: ${error.message}`);
		} finally {
			isDeleting = false;
		}
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

	// Configure object
	function configureObject(object: any) {
		configuringObject = object;
	}

	// Close config panel
	function closeConfig() {
		configuringObject = null;
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
</script>

<svelte:head>
	<title>Business Objects - Aksara Platform</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<!-- Page Header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Business Objects</h1>
				<p class="text-gray-600 mt-1">
					Manage business objects and their data mappings
				</p>
			</div>
			<div class="flex space-x-2">
				{#if selectedType === 'direct'}
					<button
						onclick={syncDirectObjects}
						disabled={isSyncing}
						class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSyncing ? 'Syncing...' : '🔄 Sync from Datasources'}
					</button>
				{/if}
				<a
					href="/objects/create"
					class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
				>
					+ Create Custom
				</a>
			</div>
		</div>

		<!-- Sync Message -->
		{#if syncMessage}
			<div class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
				{syncMessage}
			</div>
		{/if}

		<!-- Type Filter Tabs -->
		<div class="bg-white rounded-lg shadow">
			<div class="border-b border-gray-200">
				<nav class="flex space-x-1 px-6 pt-4">
					<button
						onclick={() => (selectedType = 'all')}
						class="pb-3 px-4 border-b-2 text-sm font-medium transition {selectedType === 'all'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						All Objects
						<span class="ml-2 px-2 py-0.5 text-xs rounded-full {selectedType === 'all'
							? 'bg-blue-100 text-blue-600'
							: 'bg-gray-100 text-gray-600'}">
							{counts().all}
						</span>
					</button>
					<button
						onclick={() => (selectedType = 'direct')}
						class="pb-3 px-4 border-b-2 text-sm font-medium transition {selectedType === 'direct'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Direct
						<span class="ml-2 px-2 py-0.5 text-xs rounded-full {selectedType === 'direct'
							? 'bg-blue-100 text-blue-600'
							: 'bg-gray-100 text-gray-600'}">
							{counts().direct}
						</span>
					</button>
					<button
						onclick={() => (selectedType = 'custom')}
						class="pb-3 px-4 border-b-2 text-sm font-medium transition {selectedType === 'custom'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Custom
						<span class="ml-2 px-2 py-0.5 text-xs rounded-full {selectedType === 'custom'
							? 'bg-blue-100 text-blue-600'
							: 'bg-gray-100 text-gray-600'}">
							{counts().custom}
						</span>
					</button>
				</nav>
			</div>

			<!-- Filters -->
			<div class="px-6 py-4 space-y-3">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Search objects by name or description..."
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>

				{#if data.datasources.length > 0}
					<!-- Datasource Filter (only affects Direct objects) -->
					<select
						bind:value={selectedDatasource}
						class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						disabled={selectedType === 'custom'}
					>
						<option value="all">All Datasources</option>
						{#each data.datasources as ds}
							<option value={ds.id}>{ds.displayName} ({ds.type?.toUpperCase()})</option>
						{/each}
					</select>

					<!-- Status Filter -->
					<select
						bind:value={selectedStatus}
						class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="all">All Status</option>
						<option value="enabled">Enabled</option>
						<option value="disabled">Disabled</option>
						<option value="broken">Broken</option>
					</select>
					
				{/if}
				</div>
			</div>
		</div>

		<!-- Objects Table -->
		<div class="bg-white rounded-lg shadow overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Object Name
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Type
						</th>
						{#if selectedType === 'direct'}
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Datasource
							</th>
						{/if}
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Protocols
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							{selectedType === 'direct' ? 'Table' : 'Source'}
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Fields
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Updated
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filteredObjects() as object}
						<tr class="hover:bg-gray-50">
							<!-- Object Name -->
							<td class="px-6 py-4 whitespace-nowrap">
								<div>
									<div class="text-sm font-medium text-gray-900">{object.displayName}</div>
									<div class="text-xs text-gray-500 font-mono">{object.name}</div>
								</div>
							</td>

							<!-- Type -->
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-medium rounded-full {getTypeColor(object.objectType)}">
									{object.objectType === 'direct' ? 'Direct' : 'Custom'}
								</span>
							</td>

							<!-- Datasource (Direct Objects only) -->
							{#if selectedType === 'direct'}
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
									{#if object.primaryDatasourceId}
										{getDatasourceName(object.primaryDatasourceId)}
									{:else}
										<span class="text-gray-400">-</span>
									{/if}
								</td>
							{/if}

							<!-- Status -->
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(object.status)}">
									{object.status}
								</span>
								{#if object.brokenReason}
									<div class="text-xs text-red-600 mt-1">{object.brokenReason}</div>
								{/if}
							</td>

							<!-- Protocols -->
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

							<!-- Table/Source -->
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-700 font-mono">
									{object.primaryTable || '-'}
								</div>
								{#if object.joinCount > 0}
									<div class="text-xs text-gray-500">
										+{object.joinCount} JOIN{object.joinCount > 1 ? 's' : ''}
									</div>
								{/if}
							</td>

							<!-- Fields -->
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
								{object.fieldCount}
							</td>

							<!-- Updated -->
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{new Date(object.updatedAt).toLocaleDateString()}
							</td>

							<!-- Actions -->
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
								{#if object.objectType === 'direct'}
									<button
										onclick={() => configureObject(object)}
										class="text-blue-600 hover:text-blue-900"
									>
										Configure
									</button>
									<a href="/objects/{object.id}/api-docs" class="text-purple-600 hover:text-purple-900">
										API Docs
									</a>
									<a href="/apis/grpc/{object.id}" class="text-indigo-600 hover:text-indigo-900">
										gRPC
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
								{:else}
									<a href="/objects/{object.id}" class="text-blue-600 hover:text-blue-900">
										Edit
									</a>
									<a href="/apis/grpc/{object.id}" class="text-indigo-600 hover:text-indigo-900">
										gRPC
									</a>
									<button
										onclick={() => deleteObject(object.id, object.displayName)}
										disabled={isDeleting}
										class="text-red-600 hover:text-red-900 disabled:opacity-50"
									>
										Delete
									</button>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="{selectedType === 'direct' ? '9' : '8'}" class="px-6 py-12 text-center text-gray-500">
								{#if searchTerm}
									<p class="text-sm">No objects match your search.</p>
								{:else if selectedType === 'direct'}
									<p class="text-sm">No direct objects yet.</p>
									<p class="text-xs mt-1">
										Direct objects are auto-created when you discover datasource schemas.
									</p>
								{:else if selectedType === 'custom'}
									<p class="text-sm">No custom objects yet.</p>
									<p class="text-xs mt-1">
										<a href="/objects/create" class="text-blue-600 hover:underline">
											Create a custom object
										</a>
										to map complex multi-table queries.
									</p>
								{:else}
									<p class="text-sm">No objects found.</p>
									<p class="text-xs mt-1">
										Create a datasource and discover its schema to auto-generate direct objects,
										or
										<a href="/objects/create" class="text-blue-600 hover:underline">
											create a custom object
										</a>.
									</p>
								{/if}
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

<!-- Configuration Panel -->
{#if configuringObject}
	<DirectObjectConfigPanel
		object={configuringObject}
		onClose={closeConfig}
		onSave={saveConfiguration}
	/>
{/if}
