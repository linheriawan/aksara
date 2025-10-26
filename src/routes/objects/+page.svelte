<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	let selectedType = $state<'all' | 'direct' | 'custom'>('all');
	let isDeleting = $state(false);

	// Filter objects by type and search
	const filteredObjects = $derived(() => {
		return data.objects.filter((obj) => {
			// Type filter
			if (selectedType !== 'all' && obj.objectType !== selectedType) {
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
				<a
					href="/objects/direct"
					class="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition"
				>
					Direct Objects
				</a>
				<a
					href="/objects/create"
					class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
				>
					+ Create Custom
				</a>
			</div>
		</div>

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

			<!-- Search Bar -->
			<div class="px-6 py-4">
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Search objects by name or description..."
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
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
							Type
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Source
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
							<td class="px-6 py-4 whitespace-nowrap">
								<div>
									<div class="text-sm font-medium text-gray-900">{object.displayName}</div>
									<div class="text-xs text-gray-500 font-mono">{object.name}</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-medium rounded-full {getTypeColor(object.objectType)}">
									{object.objectType === 'direct' ? 'Direct' : 'Custom'}
								</span>
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
								<div class="text-sm text-gray-700 font-mono">
									{object.primaryTable || '-'}
								</div>
								{#if object.joinCount > 0}
									<div class="text-xs text-gray-500">
										+{object.joinCount} JOIN{object.joinCount > 1 ? 's' : ''}
									</div>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
								{object.fieldCount}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{new Date(object.updatedAt).toLocaleDateString()}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
								{#if object.objectType === 'direct'}
									<a
										href="/objects/direct"
										class="text-blue-600 hover:text-blue-900"
									>
										Configure
									</a>
								{:else}
									<a
										href="/objects/{object.id}"
										class="text-blue-600 hover:text-blue-900"
									>
										Edit
									</a>
								{/if}
								<a
									href="/objects/{object.id}/api-docs"
									class="text-purple-600 hover:text-purple-900"
								>
									API Docs
								</a>
								<button
									onclick={() => deleteObject(object.id, object.displayName)}
									class="text-red-600 hover:text-red-900"
									disabled={isDeleting}
								>
									Delete
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center text-gray-500">
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
