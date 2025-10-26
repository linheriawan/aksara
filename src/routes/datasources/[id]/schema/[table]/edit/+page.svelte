<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let datasourceId = $derived($page.params.id);
	let tableName = $derived($page.params.table);

	let operation = $state<'add_column' | 'drop_column' | 'modify_column' | 'rename_table'>('add_column');
	let columnName = $state('');
	let columnDef = $state('VARCHAR(255) NOT NULL');
	let newTableName = $state('');

	let loading = $state(false);
	let error = $state('');
	let success = $state('');

	const commonTypes = [
		'VARCHAR(255)',
		'INT',
		'BIGINT',
		'TEXT',
		'BOOLEAN',
		'DATE',
		'DATETIME',
		'TIMESTAMP',
		'DECIMAL(10,2)',
		'FLOAT',
		'DOUBLE'
	];

	async function alterTable() {
		error = '';
		success = '';

		// Validation
		if (operation === 'rename_table') {
			if (!newTableName.trim()) {
				error = 'New table name is required';
				return;
			}
		} else {
			if (!columnName.trim()) {
				error = 'Column name is required';
				return;
			}
			if ((operation === 'add_column' || operation === 'modify_column') && !columnDef.trim()) {
				error = 'Column definition is required';
				return;
			}
		}

		loading = true;

		try {
			const body: any = {
				tableName,
				operation
			};

			if (operation === 'rename_table') {
				body.newTableName = newTableName.trim();
			} else {
				body.columnName = columnName.trim();
				if (operation === 'add_column' || operation === 'modify_column') {
					body.columnDef = columnDef.trim();
				}
			}

			const response = await fetch(`/api/datasources/${datasourceId}/tables`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to alter table');
			}

			success = result.message || 'Table altered successfully';

			// If renamed, redirect to new table name
			if (operation === 'rename_table') {
				setTimeout(() => {
					goto(`/datasources/${datasourceId}/schema/${newTableName}`);
				}, 1500);
			} else {
				// Reset form
				columnName = '';
				columnDef = 'VARCHAR(255) NOT NULL';

				// Redirect back to table details after a short delay
				setTimeout(() => {
					goto(`/datasources/${datasourceId}/schema/${tableName}`);
				}, 1500);
			}
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Table - {tableName}</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4">
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
		<h1 class="text-2xl font-bold text-gray-900">Edit Table Structure</h1>
		<p class="mt-1 text-sm text-gray-500">Modify the structure of table: {tableName}</p>
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
				<div class="ml-3">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Form -->
	<div class="bg-white shadow rounded-lg">
		<div class="px-4 py-5 sm:p-6">
			<!-- Operation Type -->
			<div class="mb-6">
				<label for="operation" class="block text-sm font-medium text-gray-700 mb-2">
					Operation Type
				</label>
				<select
					id="operation"
					bind:value={operation}
					class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
				>
					<option value="add_column">Add Column</option>
					<option value="drop_column">Drop Column</option>
					<option value="modify_column">Modify Column</option>
					<option value="rename_table">Rename Table</option>
				</select>
			</div>

			<!-- Rename Table -->
			{#if operation === 'rename_table'}
				<div class="mb-6">
					<label for="newTableName" class="block text-sm font-medium text-gray-700 mb-2">
						New Table Name
					</label>
					<input
						type="text"
						id="newTableName"
						bind:value={newTableName}
						class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
						placeholder="new_table_name"
						required
					/>
				</div>
			{:else}
				<!-- Column Name -->
				<div class="mb-6">
					<label for="columnName" class="block text-sm font-medium text-gray-700 mb-2">
						Column Name
					</label>
					<input
						type="text"
						id="columnName"
						bind:value={columnName}
						class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
						placeholder="column_name"
						required
					/>
				</div>

				<!-- Column Definition (for add/modify) -->
				{#if operation === 'add_column' || operation === 'modify_column'}
					<div class="mb-6">
						<label for="columnDef" class="block text-sm font-medium text-gray-700 mb-2">
							Column Definition
						</label>
						<input
							type="text"
							id="columnDef"
							bind:value={columnDef}
							class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
							placeholder="VARCHAR(255) NOT NULL"
							required
						/>
						<p class="mt-2 text-sm text-gray-500">
							Examples: <code class="text-xs bg-gray-100 px-1 py-0.5 rounded">INT NOT NULL</code>,
							<code class="text-xs bg-gray-100 px-1 py-0.5 rounded">VARCHAR(100)</code>,
							<code class="text-xs bg-gray-100 px-1 py-0.5 rounded">DECIMAL(10,2) DEFAULT 0</code>
						</p>

						<!-- Quick Type Selector -->
						<div class="mt-3">
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Quick Type Selection
							</label>
							<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
								{#each commonTypes as type}
									<button
										type="button"
										onclick={() => {
											const parts = columnDef.split(' ');
											parts[0] = type;
											columnDef = parts.join(' ');
										}}
										class="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
									>
										{type}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			{/if}

			<!-- Warning for Drop Column -->
			{#if operation === 'drop_column'}
				<div class="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
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
								Warning: Dropping a column will permanently delete all data in that column. This action cannot be undone.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex justify-end space-x-3">
				<a
					href="/datasources/{datasourceId}/schema/{tableName}"
					class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Cancel
				</a>
				<button
					type="button"
					onclick={alterTable}
					disabled={loading}
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
						Processing...
					{:else}
						Apply Changes
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Help Section -->
	<div class="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
		<div class="flex">
			<div class="flex-shrink-0">
				<svg
					class="h-5 w-5 text-blue-400"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div class="ml-3">
				<p class="text-sm text-blue-700">
					<strong>Tip:</strong> For complex table modifications, consider using the SQL Query Executor
					to run custom ALTER TABLE statements.
				</p>
			</div>
		</div>
	</div>
</div>
