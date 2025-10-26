<script lang="ts">
	import { goto } from '$app/navigation';
	import DataTable from '$lib/components/DataTable.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const columns = [
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'type', label: 'Type', sortable: true },
		{ key: 'datasourceCount', label: 'Databases', sortable: true },
		{ key: 'status', label: 'Status', sortable: true },
		{ key: 'lastTestedAt', label: 'Last Tested', sortable: true },
		{ key: 'createdAt', label: 'Created', sortable: true }
	];

	// Format connections for display
	const formattedConnections = $derived(
		data.connections.map((conn) => ({
			...conn,
			id: conn._id.toString(),
			type: conn.type.toUpperCase(),
			datasourceCount: `${conn.datasourceCount || 0} DB${conn.datasourceCount !== 1 ? 's' : ''}`,
			status: getStatusBadge(conn.status),
			lastTestedAt: conn.lastTestedAt
				? new Date(conn.lastTestedAt).toLocaleDateString()
				: 'Never',
			createdAt: new Date(conn.createdAt).toLocaleDateString()
		}))
	);

	function getStatusBadge(status: string) {
		const badges: Record<string, string> = {
			active: '🟢 Active',
			inactive: '⚪ Inactive',
			error: '🔴 Error',
			pending: '🟡 Pending'
		};
		return badges[status] || status;
	}

	function handleRowClick(row: any) {
		goto(`/connections/form?id=${row.id}`);
	}

	function createConnection() {
		goto('/connections/form');
	}

	async function handleDelete(row: any) {
		if (!confirm(`Are you sure you want to delete connection "${row.name}"?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/connections/${row.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const error = await response.json();
				alert(`Failed to delete connection: ${error.error}`);
				return;
			}

			// Reload the page to refresh the list
			window.location.reload();
		} catch (error: any) {
			alert(`Failed to delete connection: ${error.message}`);
		}
	}

	async function testConnection(row: any) {
		try {
			const response = await fetch(`/api/connections/${row.id}/test`, {
				method: 'POST'
			});

			const result = await response.json();

			if (result.success) {
				alert(`✅ Connection test successful!\n\nResponse time: ${result.responseTime}ms`);
				window.location.reload();
			} else {
				alert(`❌ Connection test failed:\n\n${result.message}`);
			}
		} catch (error: any) {
			alert(`Failed to test connection: ${error.message}`);
		}
	}
</script>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Connections</h1>
				<p class="mt-1 text-sm text-gray-600">
					Manage database server and API connections
				</p>
			</div>
			<button
				onclick={createConnection}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				+ New Connection
			</button>
		</div>

		{#if data.error}
			<div class="bg-red-50 border border-red-200 rounded-md p-4">
				<p class="text-red-800">Error loading connections: {data.error}</p>
			</div>
		{/if}

		{#if formattedConnections.length === 0}
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
					d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
				/>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No connections</h3>
			<p class="mt-1 text-sm text-gray-500">
				Get started by creating a new database connection.
			</p>
			<div class="mt-6">
				<button
					onclick={createConnection}
					class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					+ New Connection
				</button>
			</div>
			</div>
		{:else}
			<DataTable columns={columns} data={formattedConnections} onRowClick={handleRowClick}>
				{#snippet actions(row)}
					<div class="flex space-x-2">
						<button
							onclick={(e) => {
								e.stopPropagation();
								goto(`/connections/form?id=${row.id}`);
							}}
							class="text-blue-600 hover:text-blue-900 text-sm font-medium"
						>
							Edit
						</button>
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleDelete(row);
							}}
							class="text-red-600 hover:text-red-900 text-sm font-medium"
						>
							Delete
						</button>
					</div>
				{/snippet}
			</DataTable>
		{/if}
	</div>
</div>
