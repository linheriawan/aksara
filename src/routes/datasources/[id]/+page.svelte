<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Editable fields
	let connectionId = $state(data.datasource.connectionId);
	let displayName = $state(data.datasource.displayName);
	let name = $state(data.datasource.name);
	let saving = $state(false);
	let error = $state('');
	let successMessage = $state('');

	async function handleSave() {
		error = '';
		successMessage = '';
		saving = true;
		console.log(data.datasource);
		try {
			const response = await fetch(`/api/datasources/${data.datasource.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					connectionId,
					displayName,
					name,
					type: data.datasource.type
				})
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || 'Failed to update datasource');
			}

			successMessage = 'Datasource updated successfully';
			// Reload after a short delay to show the success message
			setTimeout(() => { window.location.reload(); }, 1000);
		} catch (err: any) {
			error = err.message;
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!confirm(`Are you sure you want to delete "${data.datasource.displayName}"?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/datasources/${data.datasource.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || 'Failed to delete datasource');
			}

			goto('/datasources');
		} catch (err: any) {
			alert(`Error: ${err.message}`);
		}
	}
</script>

<svelte:head>
	<title>{data.datasource.displayName} - Aksara Platform</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
	<div class="mb-6">
		<nav class="flex mb-4 text-sm text-gray-600">
			<a href="/datasources" class="hover:text-blue-600">Datasources</a>
			<span class="mx-2">/</span>
			<span class="text-gray-900">{data.datasource.displayName}</span>
		</nav>

		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">{data.datasource.displayName}</h1>
				<p class="mt-1 text-sm text-gray-600">
					{data.datasource.type ? data.datasource.type.toUpperCase() : 'UNKNOWN'} Database
					{#if data.connection}
						on {data.connection.name}
					{/if}
				</p>
			</div>
			<div class="flex space-x-2">
				<button
					onclick={() => goto(`/datasources/${data.datasource.id}/schema`)}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Browse Schema
				</button>
				<button
					onclick={() => goto(`/datasources/${data.datasource.id}/query`)}
					class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Run Query
				</button>
			</div>
		</div>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
			<p class="text-red-800">{error}</p>
		</div>
	{/if}

	{#if successMessage}
		<div class="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
			<p class="text-green-800">{successMessage}</p>
		</div>
	{/if}

	<!-- Editable Form -->
	<div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Database Settings</h2>

		<div class="space-y-4">
			<div>
				<label for="connection" class="block text-sm font-medium text-gray-700 mb-1">
					Connection *
				</label>
				<select
					id="connection"
					bind:value={connectionId}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each data.connections as conn}
						<option value={conn.id}>{conn.name}</option>
					{/each}
				</select>
				<p class="mt-1 text-xs text-gray-500">
					{data.datasource.type ? data.datasource.type.toUpperCase() : 'Database'} server connection
				</p>
			</div>

			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
					Database Name *
				</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<p class="mt-1 text-xs text-gray-500">
					The actual database name on the server (cannot contain spaces)
				</p>
			</div>

			<div>
				<label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">
					Display Name
				</label>
				<input
					id="displayName"
					type="text"
					bind:value={displayName}
					placeholder={name}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<p class="mt-1 text-xs text-gray-500">Friendly name for display purposes</p>
			</div>
		</div>

		<div class="mt-6 pt-6 border-t border-gray-200 flex justify-between">
			<button
				type="button"
				onclick={handleDelete}
				class="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
			>
				Delete Datasource
			</button>
			<div class="flex space-x-3">
				<button
					type="button"
					onclick={() => goto('/datasources')}
					class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleSave}
					disabled={saving}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</div>
	</div>

	<!-- Read-only Information -->
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
		<dl class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
			<div>
				<dt class="text-sm font-medium text-gray-500">Type</dt>
				<dd class="mt-1 text-sm text-gray-900">{data.datasource.type ? data.datasource.type.toUpperCase() : 'UNKNOWN'}</dd>
			</div>
			{#if data.connection}
				<div>
					<dt class="text-sm font-medium text-gray-500">Connection Status</dt>
					<dd class="mt-1 text-sm text-gray-900">
						{#if data.connection.status === 'active'}
							<span class="text-green-600">● Active</span>
						{:else if data.connection.status === 'error'}
							<span class="text-red-600">● Error</span>
						{:else}
							<span class="text-gray-600">● {data.connection.status}</span>
						{/if}
					</dd>
				</div>
			{/if}
			<div>
				<dt class="text-sm font-medium text-gray-500">Created</dt>
				<dd class="mt-1 text-sm text-gray-900">
					{new Date(data.datasource.createdAt).toLocaleString()}
				</dd>
			</div>
			<div>
				<dt class="text-sm font-medium text-gray-500">Last Updated</dt>
				<dd class="mt-1 text-sm text-gray-900">
					{new Date(data.datasource.updatedAt).toLocaleString()}
				</dd>
			</div>
		</dl>
	</div>
	</div>
</div>
