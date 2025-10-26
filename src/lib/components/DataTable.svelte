<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Column {
		key: string;
		label: string;
		sortable?: boolean;
		width?: string;
		align?: 'left' | 'center' | 'right';
		render?: (value: any, row: any) => string;
	}

	interface Props {
		columns: Column[];
		data: any[];
		loading?: boolean;
		selectable?: boolean;
		onSelect?: (selectedRows: any[]) => void;
		onSort?: (key: string, direction: 'asc' | 'desc') => void;
		pagination?: {
			page: number;
			pageSize: number;
			total: number;
			onPageChange: (page: number) => void;
			onPageSizeChange: (pageSize: number) => void;
		};
		searchable?: boolean;
		searchPlaceholder?: string;
		onSearch?: (query: string) => void;
		emptyMessage?: string;
		actions?: Snippet<[any]>;
	}

	let {
		columns,
		data,
		loading = false,
		selectable = false,
		onSelect,
		onSort,
		pagination,
		searchable = false,
		searchPlaceholder = 'Search...',
		onSearch,
		emptyMessage = 'No data available',
		actions
	}: Props = $props();

	let selectedRows = $state<Set<number>>(new Set());
	let sortKey = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let searchQuery = $state('');

	function toggleRow(index: number) {
		if (selectedRows.has(index)) {
			selectedRows.delete(index);
		} else {
			selectedRows.add(index);
		}
		selectedRows = new Set(selectedRows);

		if (onSelect) {
			const selected = data.filter((_, i) => selectedRows.has(i));
			onSelect(selected);
		}
	}

	function toggleAll() {
		if (selectedRows.size === data.length) {
			selectedRows = new Set();
		} else {
			selectedRows = new Set(data.map((_, i) => i));
		}

		if (onSelect) {
			const selected = data.filter((_, i) => selectedRows.has(i));
			onSelect(selected);
		}
	}

	function handleSort(key: string) {
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDirection = 'asc';
		}

		if (onSort) {
			onSort(key, sortDirection);
		}
	}

	function handleSearch() {
		if (onSearch) {
			onSearch(searchQuery);
		}
	}

	function getCellValue(row: any, column: Column) {
		const value = row[column.key];
		if (column.render) {
			return column.render(value, row);
		}
		return value ?? '';
	}

	$effect(() => {
		// Reset selection when data changes
		selectedRows = new Set();
	});
</script>

<div class="bg-white rounded-lg shadow overflow-hidden">
	<!-- Header with search -->
	{#if searchable}
		<div class="p-4 border-b border-gray-200">
			<div class="relative">
				<input
					type="text"
					bind:value={searchQuery}
					oninput={handleSearch}
					placeholder={searchPlaceholder}
					class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				/>
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg
						class="h-5 w-5 text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
			</div>
		</div>
	{/if}

	<!-- Table -->
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					{#if selectable}
						<th class="px-6 py-3 text-left" style="width: 50px;">
							<input
								type="checkbox"
								checked={selectedRows.size === data.length && data.length > 0}
								indeterminate={selectedRows.size > 0 && selectedRows.size < data.length}
								onchange={toggleAll}
								class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
							/>
						</th>
					{/if}

					{#each columns as column}
						<th
							class="px-6 py-3 text-{column.align || 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider"
							style={column.width ? `width: ${column.width}` : ''}
						>
							{#if column.sortable}
								<button
									type="button"
									onclick={() => handleSort(column.key)}
									class="group inline-flex items-center space-x-1 hover:text-gray-700"
								>
									<span>{column.label}</span>
									<span class="flex flex-col">
										<svg
											class="h-3 w-3 {sortKey === column.key && sortDirection === 'asc'
												? 'text-gray-900'
												: 'text-gray-400'}"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									</span>
								</button>
							{:else}
								{column.label}
							{/if}
						</th>
					{/each}

					{#if actions}
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					{/if}
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#if loading}
					<tr>
						<td colspan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} class="px-6 py-12 text-center">
							<div class="flex justify-center items-center">
								<svg
									class="animate-spin h-8 w-8 text-indigo-600"
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
								<span class="ml-2 text-sm text-gray-500">Loading...</span>
							</div>
						</td>
					</tr>
				{:else if data.length === 0}
					<tr>
						<td colspan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} class="px-6 py-12 text-center">
							<div class="text-sm text-gray-500">{emptyMessage}</div>
						</td>
					</tr>
				{:else}
					{#each data as row, index}
						<tr class="hover:bg-gray-50">
							{#if selectable}
								<td class="px-6 py-4">
									<input
										type="checkbox"
										checked={selectedRows.has(index)}
										onchange={() => toggleRow(index)}
										class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
									/>
								</td>
							{/if}

							{#each columns as column}
								<td
									class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-{column.align || 'left'}"
								>
									{getCellValue(row, column)}
								</td>
							{/each}

							{#if actions}
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									{@render actions(row)}
								</td>
							{/if}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if pagination && !loading}
		<div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
			<div class="flex-1 flex justify-between sm:hidden">
				<button
					type="button"
					onclick={() => pagination.onPageChange(pagination.page - 1)}
					disabled={pagination.page === 1}
					class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Previous
				</button>
				<button
					type="button"
					onclick={() => pagination.onPageChange(pagination.page + 1)}
					disabled={pagination.page * pagination.pageSize >= pagination.total}
					class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next
				</button>
			</div>
			<div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
				<div>
					<p class="text-sm text-gray-700">
						Showing
						<span class="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span>
						to
						<span class="font-medium"
							>{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span
						>
						of
						<span class="font-medium">{pagination.total}</span>
						results
					</p>
				</div>
				<div class="flex items-center space-x-2">
					<select
						value={pagination.pageSize}
						onchange={(e) => pagination.onPageSizeChange(Number(e.currentTarget.value))}
						class="block w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
					>
						<option value="10">10 per page</option>
						<option value="25">25 per page</option>
						<option value="50">50 per page</option>
						<option value="100">100 per page</option>
					</select>

					<nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
						<button
							type="button"
							onclick={() => pagination.onPageChange(pagination.page - 1)}
							disabled={pagination.page === 1}
							class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<span class="sr-only">Previous</span>
							<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>

						<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
							Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
						</span>

						<button
							type="button"
							onclick={() => pagination.onPageChange(pagination.page + 1)}
							disabled={pagination.page * pagination.pageSize >= pagination.total}
							class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<span class="sr-only">Next</span>
							<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</nav>
				</div>
			</div>
		</div>
	{/if}
</div>
