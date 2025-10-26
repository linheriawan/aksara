<script lang="ts">
	import { goto } from '$app/navigation';
	import DataTable from '$lib/components/DataTable.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const columns = [
		{ key: 'displayName', label: 'Database', sortable: true },
		{ key: 'name', label: 'Database Name', sortable: true },
		{ key: 'connectionName', label: 'Connection', sortable: true },
		{ key: 'type', label: 'Type', sortable: true },
		{ key: 'createdAt', label: 'Created', sortable: true }
	];

	// Format datasources for display
	const formattedDatasources = $derived(
		data.datasources.map((ds) => ({
			...ds,
			type: ds.type ? ds.type.toUpperCase() : 'UNKNOWN',
			createdAt: new Date(ds.createdAt).toLocaleDateString()
		}))
	);

	// Modal states
	let showCreateDatabase = $state(false);
	let showRegisterDatabase = $state(false);

	// Form data
	let selectedConnectionId = $state('');
	let newDatabaseName = $state('');
	let registerDatabaseName = $state('');
	let registerDisplayName = $state('');
	let creating = $state(false);
	let registering = $state(false);

	function handleRowClick(row: any) {
		// Go directly to schema browser
		goto(`/datasources/${row.id}/schema`);
	}

	function openCreateDatabaseModal() {
		showCreateDatabase = true;
		selectedConnectionId = '';
		newDatabaseName = '';
	}

	function openRegisterDatabaseModal() {
		showRegisterDatabase = true;
		selectedConnectionId = '';
		registerDatabaseName = '';
		registerDisplayName = '';
	}

	async function handleCreateDatabase() {
		if (!selectedConnectionId || !newDatabaseName) {
			alert('Please fill in all required fields');
			return;
		}

		creating = true;
		try {
			const response = await fetch(`/api/connections/${selectedConnectionId}/databases`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newDatabaseName })
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create database');
			}

			showCreateDatabase = false;
			window.location.reload();
		} catch (error: any) {
			alert(`Error: ${error.message}`);
		} finally {
			creating = false;
		}
	}

	async function handleRegisterDatabase() {
		if (!selectedConnectionId || !registerDatabaseName) {
			alert('Please fill in all required fields');
			return;
		}

		registering = true;
		try {
			const selectedConn = data.connections.find((c: any) => c.id === selectedConnectionId);
			if (!selectedConn) {
				throw new Error('Connection not found');
			}

			const response = await fetch('/api/datasources', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: registerDatabaseName,
					displayName: registerDisplayName || registerDatabaseName,
					type: selectedConn.type,
					connectionId: selectedConnectionId
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to register database');
			}

			showRegisterDatabase = false;
			window.location.reload();
		} catch (error: any) {
			alert(`Error: ${error.message}`);
		} finally {
			registering = false;
		}
	}
</script>

<svelte:head>
	<title>Datasources - Aksara Platform</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Datasources</h1>
				<p class="mt-1 text-sm text-gray-600">
					Manage databases across all connections
				</p>
			</div>
			<div class="flex space-x-3">
				<button
					onclick={openCreateDatabaseModal}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					+ Create Database
				</button>
				<button
					onclick={openRegisterDatabaseModal}
					class="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					+ Register Database
				</button>
			</div>
		</div>

		{#if formattedDatasources.length === 0}
			<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
			<svg
				class="mx-auto h-12 w-12 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
				/>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No datasources</h3>
			<p class="mt-1 text-sm text-gray-500">
				Get started by creating a new database or registering an existing one.
			</p>
			<div class="mt-6 flex justify-center space-x-3">
				<button
					onclick={openCreateDatabaseModal}
					class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					+ Create Database
				</button>
				<button
					onclick={openRegisterDatabaseModal}
					class="inline-flex items-center px-4 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					+ Register Database
				</button>
			</div>
			</div>
		{:else}
			<DataTable columns={columns} data={formattedDatasources} onRowClick={handleRowClick}>
				{#snippet actions(row)}
					<div class="flex space-x-2">
						<button
							onclick={(e) => {
								e.stopPropagation();
								goto(`/datasources/${row.id}`);
							}}
							class="text-blue-600 hover:text-blue-900 text-sm font-medium"
						>
							View
						</button>
						<button
							onclick={(e) => {
								e.stopPropagation();
								goto(`/datasources/${row.id}/schema`);
							}}
							class="text-blue-600 hover:text-blue-900 text-sm font-medium"
						>
							Schema
						</button>
						<button
							onclick={(e) => {
								e.stopPropagation();
								goto(`/datasources/${row.id}/query`);
							}}
							class="text-blue-600 hover:text-blue-900 text-sm font-medium"
						>
							Query
						</button>
					</div>
				{/snippet}
			</DataTable>
		{/if}
	</div>
</div>

<!-- Create Database Modal -->
{#if showCreateDatabase}
	<div
		class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
		onclick={() => (showCreateDatabase = false)}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 class="text-xl font-bold text-gray-900 mb-4">Create New Database</h2>
			<p class="text-sm text-gray-600 mb-4">
				Create a new database on the selected connection server.
			</p>

			<div class="space-y-4">
				<div>
					<label for="create-connection" class="block text-sm font-medium text-gray-700 mb-1">
						Connection *
					</label>
					<select
						id="create-connection"
						bind:value={selectedConnectionId}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Select a connection</option>
						{#each data.connections as conn}
							{#if conn.type !== 'rest_api'}
								<option value={conn.id}>{conn.name} ({conn.type.toUpperCase()})</option>
							{/if}
						{/each}
					</select>
				</div>

				<div>
					<label for="create-db-name" class="block text-sm font-medium text-gray-700 mb-1">
						Database Name *
					</label>
					<input
						id="create-db-name"
						type="text"
						bind:value={newDatabaseName}
						placeholder="my_database"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>

			<div class="mt-6 flex justify-end space-x-3">
				<button
					type="button"
					onclick={() => (showCreateDatabase = false)}
					class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleCreateDatabase}
					disabled={creating}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{creating ? 'Creating...' : 'Create Database'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Register Database Modal -->
{#if showRegisterDatabase}
	<div
		class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
		onclick={() => (showRegisterDatabase = false)}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 class="text-xl font-bold text-gray-900 mb-4">Register Existing Database</h2>
			<p class="text-sm text-gray-600 mb-4">
				Register an existing database that's already on the connection server.
			</p>

			<div class="space-y-4">
				<div>
					<label for="register-connection" class="block text-sm font-medium text-gray-700 mb-1">
						Connection *
					</label>
					<select
						id="register-connection"
						bind:value={selectedConnectionId}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Select a connection</option>
						{#each data.connections as conn}
							{#if conn.type !== 'rest_api'}
								<option value={conn.id}>{conn.name} ({conn.type.toUpperCase()})</option>
							{/if}
						{/each}
					</select>
				</div>

				<div>
					<label for="register-db-name" class="block text-sm font-medium text-gray-700 mb-1">
						Database Name *
					</label>
					<input
						id="register-db-name"
						type="text"
						bind:value={registerDatabaseName}
						placeholder="existing_database"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<p class="mt-1 text-xs text-gray-500">The exact name of the database on the server</p>
				</div>

				<div>
					<label for="register-display-name" class="block text-sm font-medium text-gray-700 mb-1">
						Display Name (Optional)
					</label>
					<input
						id="register-display-name"
						type="text"
						bind:value={registerDisplayName}
						placeholder="My Database"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<p class="mt-1 text-xs text-gray-500">Friendly name for display purposes</p>
				</div>
			</div>

			<div class="mt-6 flex justify-end space-x-3">
				<button
					type="button"
					onclick={() => (showRegisterDatabase = false)}
					class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleRegisterDatabase}
					disabled={registering}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{registering ? 'Registering...' : 'Register Database'}
				</button>
			</div>
		</div>
	</div>
{/if}
