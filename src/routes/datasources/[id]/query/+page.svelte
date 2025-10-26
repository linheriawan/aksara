<script lang="ts">
	import { page } from '$app/stores';
	import DataTable from '$lib/components/DataTable.svelte';

	let datasourceId = $derived($page.params.id);
	let datasourceName = $state('');
	let datasourceType = $state('');

	let query = $state('');
	let results = $state<any[]>([]);
	let columns = $state<any[]>([]);
	let loading = $state(false);
	let error = $state('');
	let success = $state('');
	let executionTime = $state(0);

	let queryHistory = $state<{ query: string; timestamp: Date; success: boolean }[]>([]);

	// Load datasource info
	async function loadDatasourceInfo() {
		try {
			const response = await fetch(`/api/datasources/${datasourceId}`);
			const result = await response.json();

			if (response.ok && result.datasource) {
				datasourceName = result.datasource.name;
				datasourceType = result.datasource.type;
			}
		} catch (err: any) {
			console.error('Failed to load datasource:', err);
		}
	}

	async function executeQuery() {
		if (!query.trim()) {
			error = 'Please enter a query';
			return;
		}

		loading = true;
		error = '';
		success = '';
		results = [];
		columns = [];

		const startTime = performance.now();

		try {
			const response = await fetch(`/api/datasources/${datasourceId}/query`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: query.trim() })
			});

			const endTime = performance.now();
			executionTime = Math.round(endTime - startTime);

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to execute query');
			}

			results = result.results || [];

			// Build columns from first row
			if (results.length > 0) {
				columns = Object.keys(results[0]).map((key) => ({
					key,
					label: key,
					sortable: true
				}));
			}

			success = `Query executed successfully in ${executionTime}ms. ${results.length} row(s) returned.`;

			// Add to history
			queryHistory = [
				{ query: query.trim(), timestamp: new Date(), success: true },
				...queryHistory.slice(0, 9) // Keep last 10
			];
		} catch (err: any) {
			error = err.message;

			// Add to history
			queryHistory = [
				{ query: query.trim(), timestamp: new Date(), success: false },
				...queryHistory.slice(0, 9)
			];
		} finally {
			loading = false;
		}
	}

	function loadFromHistory(historyQuery: string) {
		query = historyQuery;
	}

	function clearResults() {
		results = [];
		columns = [];
		error = '';
		success = '';
		executionTime = 0;
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Ctrl/Cmd + Enter to execute
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault();
			executeQuery();
		}
	}

	function isDestructiveQuery(q: string): boolean {
		const destructive = /^\s*(DELETE|DROP|TRUNCATE|ALTER)\s/i;
		return destructive.test(q.trim());
	}

	// Load datasource info on mount
	$effect(() => {
		loadDatasourceInfo();
	});
</script>

<svelte:head>
	<title>Query - {datasourceName || 'Datasource'}</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
	<div class="mb-8">
		<a
			href="/datasources/{datasourceId}"
			class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
		>
			← Back to {datasourceName || 'Datasource'}
		</a>
	</div>

	<!-- Tabs -->
	<div class="border-b border-gray-200 mb-6">
		<nav class="-mb-px flex space-x-8">
			<a
				href="/datasources/{datasourceId}"
				class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
			>
				Overview
			</a>
			{#if datasourceType !== 'rest_api'}
				<a
					href="/datasources/{datasourceId}/schema"
					class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
				>
					Schema
				</a>
				<a
					href="/datasources/{datasourceId}/query"
					class="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
				>
					Query
				</a>
			{/if}
		</nav>
	</div>

	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">SQL Query Executor</h1>
		<p class="mt-1 text-sm text-gray-500">
			Execute custom queries against your datasource. Press Ctrl+Enter or Cmd+Enter to run.
		</p>
	</div>

	<!-- Warning for destructive queries -->
	{#if isDestructiveQuery(query)}
		<div class="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg
						class="h-5 w-5 text-red-400"
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
					<p class="text-sm text-red-700 font-medium">
						Warning: This query appears to be destructive (DELETE, DROP, TRUNCATE, ALTER). Please
						proceed with caution.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Query Editor -->
	<div class="bg-white shadow rounded-lg mb-6">
		<div class="px-4 py-5 sm:p-6">
			<div class="mb-4">
				<label for="query" class="block text-sm font-medium text-gray-700 mb-2">
					SQL Query
				</label>
				<textarea
					id="query"
					bind:value={query}
					onkeydown={handleKeyDown}
					rows="8"
					class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
					placeholder="SELECT * FROM table_name LIMIT 10;"
				></textarea>
			</div>

			<!-- Action Buttons -->
			<div class="flex items-center justify-between">
				<div class="flex space-x-3">
					<button
						type="button"
						onclick={executeQuery}
						disabled={loading || !query.trim()}
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if loading}
							<svg
								class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Executing...
						{:else}
							<svg
								class="-ml-1 mr-2 h-5 w-5"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
									clip-rule="evenodd"
								/>
							</svg>
							Execute Query
						{/if}
					</button>

					<button
						type="button"
						onclick={clearResults}
						disabled={loading}
						class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Clear
					</button>
				</div>

				<div class="text-sm text-gray-500">
					<kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
						Ctrl+Enter
					</kbd>
					or
					<kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
						Cmd+Enter
					</kbd>
					to execute
				</div>
			</div>
		</div>
	</div>

	<!-- Success Message -->
	{#if success}
		<div class="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg
						class="h-5 w-5 text-green-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-green-700">{success}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Error Message -->
	{#if error}
		<div class="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg
						class="h-5 w-5 text-red-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Results -->
	{#if results.length > 0}
		<div class="mb-6">
			<h2 class="text-lg font-medium text-gray-900 mb-3">Results</h2>
			<DataTable {columns} data={results} emptyMessage="No results found" />
		</div>
	{/if}

	<!-- Query History -->
	{#if queryHistory.length > 0}
		<div>
			<h2 class="text-lg font-medium text-gray-900 mb-3">Query History</h2>
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<ul class="divide-y divide-gray-200">
					{#each queryHistory as item}
						<li class="px-4 py-3 hover:bg-gray-50 cursor-pointer" onclick={() => loadFromHistory(item.query)}>
							<div class="flex items-start justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center">
										{#if item.success}
											<svg
												class="h-4 w-4 text-green-500 mr-2"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fill-rule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
													clip-rule="evenodd"
												/>
											</svg>
										{:else}
											<svg
												class="h-4 w-4 text-red-500 mr-2"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fill-rule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
													clip-rule="evenodd"
												/>
											</svg>
										{/if}
										<p class="text-xs text-gray-500">
											{new Date(item.timestamp).toLocaleString()}
										</p>
									</div>
									<pre class="mt-1 text-sm text-gray-900 font-mono whitespace-pre-wrap break-words">{item.query}</pre>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
	</div>
</div>
