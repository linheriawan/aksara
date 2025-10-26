<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/components/DataTable.svelte';

	let { data }: { data: PageData } = $props();

	// Tab state
	type TabType = 'tables' | 'views' | 'procedures';
	let activeTab = $state<TabType>('tables');

	// Views state
	let views = $state<any[]>([]);
	let loadingViews = $state(false);

	// Procedures state
	let procedures = $state<any[]>([]);
	let loadingProcedures = $state(false);

	function getTypeIcon(type: string) {
		switch (type) {
			case 'mysql':
				return '🐬';
			case 'postgresql':
				return '🐘';
			case 'mongodb':
				return '🍃';
			default:
				return '💾';
		}
	}

	const tableColumns = [
		{ key: 'name', label: 'Table Name', sortable: true },
		{ key: 'columns', label: 'Columns', sortable: true, render: (val: any[]) => val?.length || 0 },
		{
			key: 'primaryKeys',
			label: 'Primary Keys',
			sortable: false,
			render: (val: string[]) => (val?.length ? val.join(', ') : 'None')
		}
	];

	const viewColumns = [
		{ key: 'name', label: 'View Name', sortable: true },
		{ key: 'definition', label: 'Definition', sortable: false }
	];

	const procedureColumns = [
		{ key: 'name', label: 'Procedure Name', sortable: true },
		{ key: 'type', label: 'Type', sortable: true }
	];

	let searchQuery = $state('');
	let page = $state(1);
	let pageSize = $state(10);

	let filteredTables = $derived(
		data.schema?.tables?.filter((table: any) =>
			table.name.toLowerCase().includes(searchQuery.toLowerCase())
		) || []
	);

	let paginatedTables = $derived(
		filteredTables.slice((page - 1) * pageSize, page * pageSize)
	);

	function handlePageChange(newPage: number) {
		page = newPage;
	}

	function handlePageSizeChange(newPageSize: number) {
		pageSize = newPageSize;
		page = 1; // Reset to first page
	}

	async function loadViews() {
		if (data.datasource.type === 'mongodb') return;

		loadingViews = true;
		try {
			const response = await fetch(`/api/datasources/${data.datasource.id}/views`);
			if (response.ok) {
				const result = await response.json();
				views = result.views || [];
			}
		} catch (error) {
			console.error('Failed to load views:', error);
		} finally {
			loadingViews = false;
		}
	}

	async function loadProcedures() {
		if (data.datasource.type === 'mongodb') return;

		loadingProcedures = true;
		try {
			const response = await fetch(`/api/datasources/${data.datasource.id}/procedures`);
			if (response.ok) {
				const result = await response.json();
				procedures = result.procedures || [];
			}
		} catch (error) {
			console.error('Failed to load procedures:', error);
		} finally {
			loadingProcedures = false;
		}
	}

	function handleTabChange(tab: TabType) {
		activeTab = tab;
		searchQuery = '';
		page = 1;

		if (tab === 'views' && views.length === 0) {
			loadViews();
		} else if (tab === 'procedures' && procedures.length === 0) {
			loadProcedures();
		}
	}
</script>

<svelte:head>
	<title>Schema - {data.datasource.name} - Aksara Platform</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<a
			href="/datasources/{data.datasource.id}"
			class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
		>
			← Back to {data.datasource.name}
		</a>

		<!-- Tabs -->
		<div class="border-b border-gray-200">
		<nav class="-mb-px flex space-x-8">
			<a
				href="/datasources/{data.datasource.id}"
				class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
			>
				Overview
			</a>
			<a
				href="/datasources/{data.datasource.id}/schema"
				class="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
			>
				Schema
			</a>
			<a
				href="/datasources/{data.datasource.id}/query"
				class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
			>
				Query
			</a>
		</nav>
		</div>

		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				<span class="text-3xl mr-3">{getTypeIcon(data.datasource.type)}</span>
				<div>
					<h1 class="text-2xl font-bold text-gray-900">Database Schema</h1>
					<p class="mt-1 text-sm text-gray-500">
						{activeTab === 'tables'
							? `${data.schema?.tables?.length || 0} ${data.datasource.type === 'mongodb' ? 'collections' : 'tables'} found`
							: activeTab === 'views'
								? `${views.length} views found`
								: `${procedures.length} procedures found`}
					</p>
				</div>
			</div>
			<div class="flex space-x-3">
				{#if activeTab === 'tables'}
					<a
						href="/datasources/{data.datasource.id}/schema/tables/new"
						class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						<svg
							class="-ml-1 mr-2 h-5 w-5"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
								clip-rule="evenodd"
							/>
						</svg>
						Create Table
					</a>
				{/if}
				<button
					type="button"
					onclick={() => window.location.reload()}
					class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					<svg
						class="-ml-1 mr-2 h-5 w-5 text-gray-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
							clip-rule="evenodd"
						/>
					</svg>
					Refresh Schema
				</button>
			</div>
		</div>

		<!-- Schema Type Tabs -->
		{#if data.datasource.type !== 'mongodb'}
			<div class="border-b border-gray-200">
			<nav class="-mb-px flex space-x-8">
				<button
					onclick={() => handleTabChange('tables')}
					class="{activeTab === 'tables'
						? 'border-indigo-500 text-indigo-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
				>
					Tables
				</button>
				<button
					onclick={() => handleTabChange('views')}
					class="{activeTab === 'views'
						? 'border-indigo-500 text-indigo-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
				>
					Views
				</button>
				<button
					onclick={() => handleTabChange('procedures')}
					class="{activeTab === 'procedures'
						? 'border-indigo-500 text-indigo-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
				>
					Procedures
				</button>
			</nav>
			</div>
		{/if}

		<!-- Content based on active tab -->
		{#if activeTab === 'tables'}
		<!-- Schema Not Available -->
		{#if !data.schema || !data.schema.tables}
			<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg
							class="h-5 w-5 text-yellow-400"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm text-yellow-700">
							Unable to discover schema. Please check your datasource connection.
						</p>
					</div>
				</div>
			</div>
		{:else}
			<!-- Tables List -->
			<DataTable
				columns={tableColumns}
				data={paginatedTables}
				searchable={true}
				searchPlaceholder="Search {data.datasource.type === 'mongodb'
					? 'collections'
					: 'tables'}..."
				onSearch={(query) => (searchQuery = query)}
				pagination={{
					page,
					pageSize,
					total: filteredTables.length,
					onPageChange: handlePageChange,
					onPageSizeChange: handlePageSizeChange
				}}
				emptyMessage="No {data.datasource.type === 'mongodb' ? 'collections' : 'tables'} found"
			>
				{#snippet actions(row)}
					<a
						href="/datasources/{data.datasource.id}/schema/{row.name}"
						class="text-indigo-600 hover:text-indigo-900"
					>
						View Details
					</a>
				{/snippet}
			</DataTable>
		{/if}
		{:else if activeTab === 'views'}
			<!-- Views List -->
			{#if loadingViews}
			<div class="text-center py-12">
				<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
				<p class="mt-2 text-sm text-gray-500">Loading views...</p>
			</div>
		{:else}
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<div class="px-4 py-5 sm:p-6">
					<div class="flex justify-between items-center mb-4">
						<h3 class="text-lg font-medium text-gray-900">Views</h3>
					</div>

					{#if views.length === 0}
						<div class="text-center py-12 text-gray-500">
							<p>No views found</p>
							<p class="text-sm mt-2">Create a view using the Query tab</p>
						</div>
					{:else}
						<ul class="divide-y divide-gray-200">
							{#each views as view}
								<li class="py-4">
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<h4 class="text-sm font-medium text-gray-900">{view.name}</h4>
											<p class="mt-1 text-xs text-gray-500 font-mono truncate max-w-2xl">
												{view.definition}
											</p>
										</div>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
			{/if}
		{:else if activeTab === 'procedures'}
			<!-- Procedures List -->
			{#if loadingProcedures}
			<div class="text-center py-12">
				<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
				<p class="mt-2 text-sm text-gray-500">Loading procedures...</p>
			</div>
		{:else}
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<div class="px-4 py-5 sm:p-6">
					<div class="flex justify-between items-center mb-4">
						<h3 class="text-lg font-medium text-gray-900">Stored Procedures</h3>
					</div>

					{#if procedures.length === 0}
						<div class="text-center py-12 text-gray-500">
							<p>No procedures found</p>
							<p class="text-sm mt-2">Create a procedure using the Query tab</p>
						</div>
					{:else}
						<ul class="divide-y divide-gray-200">
							{#each procedures as proc}
								<li class="py-4">
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<h4 class="text-sm font-medium text-gray-900">{proc.name}</h4>
											{#if proc.type}
												<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
													{proc.type}
												</span>
											{/if}
										</div>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
			{/if}
		{/if}
	</div>
</div>
