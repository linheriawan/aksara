<script lang="ts">
	import { page } from '$app/stores';
	import DataTable from '$lib/components/DataTable.svelte';

	let datasourceId = $derived($page.params.id);
	let tableName = $derived($page.params.table);

	let data = $state<any[]>([]);
	let columns = $state<any[]>([]);
	let loading = $state(false);
	let error = $state('');
	let totalCount = $state(0);

	let pageNum = $state(1);
	let pageSize = $state(25);
	let searchQuery = $state('');
	let sortKey = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	async function loadData() {
		loading = true;
		error = '';

		try {
			// Build SQL query
			let query = `SELECT * FROM ${tableName}`;

			// Add search filter if present
			if (searchQuery) {
				query += ` WHERE CONCAT_WS('', ${columns.map(c => c.key).join(', ')}) LIKE '%${searchQuery}%'`;
			}

			// Add sorting
			if (sortKey) {
				query += ` ORDER BY ${sortKey} ${sortDirection.toUpperCase()}`;
			}

			// Add pagination
			const offset = (pageNum - 1) * pageSize;
			query += ` LIMIT ${pageSize} OFFSET ${offset}`;

			const response = await fetch(`/api/datasources/${datasourceId}/query`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to load data');
			}

			data = result.results || [];

			// Get total count
			const countResponse = await fetch(`/api/datasources/${datasourceId}/query`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: `SELECT COUNT(*) as count FROM ${tableName}` })
			});

			const countResult = await countResponse.json();
			totalCount = countResult.results?.[0]?.count || 0;

			// Build columns from first row
			if (data.length > 0) {
				columns = Object.keys(data[0]).map(key => ({
					key,
					label: key,
					sortable: true
				}));
			}
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function handlePageChange(newPage: number) {
		pageNum = newPage;
		loadData();
	}

	function handlePageSizeChange(newPageSize: number) {
		pageSize = newPageSize;
		pageNum = 1;
		loadData();
	}

	function handleSearch(query: string) {
		searchQuery = query;
		pageNum = 1;
		loadData();
	}

	function handleSort(key: string, direction: 'asc' | 'desc') {
		sortKey = key;
		sortDirection = direction;
		loadData();
	}

	// Load data on mount
	$effect(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Browse {tableName} - Data Browser</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
	<div class="mb-8">
		<a
			href="/datasources/{datasourceId}/schema/{tableName}"
			class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
		>
			← Back to {tableName}
		</a>
	</div>

	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Browse: {tableName}</h1>
		<p class="mt-1 text-sm text-gray-500">{totalCount} rows total</p>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
			<div class="flex">
				<div class="ml-3">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Data Table -->
	<DataTable
		{columns}
		{data}
		{loading}
		searchable={true}
		searchPlaceholder="Search all columns..."
		onSearch={handleSearch}
		onSort={handleSort}
		pagination={{
			page: pageNum,
			pageSize,
			total: totalCount,
			onPageChange: handlePageChange,
			onPageSizeChange: handlePageSizeChange
		}}
		emptyMessage="No data found in this table"
	/>
	</div>
</div>
