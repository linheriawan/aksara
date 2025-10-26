<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let datasourceId = $derived($page.params.id);

	let tableName = $state('');
	let columns = $state<
		{
			name: string;
			type: string;
			nullable: boolean;
			defaultValue: string;
			isPrimaryKey: boolean;
			isUnique: boolean;
			autoIncrement: boolean;
		}[]
	>([{ name: '', type: 'VARCHAR(255)', nullable: true, defaultValue: '', isPrimaryKey: false, isUnique: false, autoIncrement: false }]);

	let loading = $state(false);
	let error = $state('');

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

	function addColumn() {
		columns = [
			...columns,
			{
				name: '',
				type: 'VARCHAR(255)',
				nullable: true,
				defaultValue: '',
				isPrimaryKey: false,
				isUnique: false,
				autoIncrement: false
			}
		];
	}

	function removeColumn(index: number) {
		columns = columns.filter((_, i) => i !== index);
	}

	async function createTable() {
		error = '';

		// Validation
		if (!tableName.trim()) {
			error = 'Table name is required';
			return;
		}

		if (columns.length === 0) {
			error = 'At least one column is required';
			return;
		}

		for (let i = 0; i < columns.length; i++) {
			if (!columns[i].name.trim()) {
				error = `Column ${i + 1} name is required`;
				return;
			}
			if (!columns[i].type.trim()) {
				error = `Column ${i + 1} type is required`;
				return;
			}
		}

		loading = true;

		try {
			const response = await fetch(`/api/datasources/${datasourceId}/tables`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tableName: tableName.trim(),
					columns: columns.map((col) => ({
						name: col.name.trim(),
						type: col.type.trim(),
						nullable: col.nullable,
						defaultValue: col.defaultValue.trim() || null,
						isPrimaryKey: col.isPrimaryKey,
						isUnique: col.isUnique,
						autoIncrement: col.autoIncrement
					}))
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create table');
			}

			// Redirect to schema page
			goto(`/datasources/${datasourceId}/schema`);
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Create Table</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4">
	<div class="mb-8">
		<a
			href="/datasources/{datasourceId}/schema"
			class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
		>
			← Back to Schema
		</a>
	</div>

	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Create New Table</h1>
		<p class="mt-1 text-sm text-gray-500">Define the structure of your new table</p>
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

	<!-- Form -->
	<div class="bg-white shadow rounded-lg">
		<div class="px-4 py-5 sm:p-6">
			<!-- Table Name -->
			<div class="mb-6">
				<label for="tableName" class="block text-sm font-medium text-gray-700 mb-2">
					Table Name
				</label>
				<input
					type="text"
					id="tableName"
					bind:value={tableName}
					class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
					placeholder="users"
					required
				/>
			</div>

			<!-- Columns -->
			<div class="mb-6">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-lg font-medium text-gray-900">Columns</h2>
					<button
						type="button"
						onclick={addColumn}
						class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						+ Add Column
					</button>
				</div>

				<div class="space-y-4">
					{#each columns as column, i}
						<div class="border border-gray-200 rounded-lg p-4">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<!-- Column Name -->
								<div>
									<label for="colName{i}" class="block text-sm font-medium text-gray-700 mb-1">
										Column Name
									</label>
									<input
										type="text"
										id="colName{i}"
										bind:value={column.name}
										class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
										placeholder="id"
										required
									/>
								</div>

								<!-- Column Type -->
								<div>
									<label for="colType{i}" class="block text-sm font-medium text-gray-700 mb-1">
										Data Type
									</label>
									<select
										id="colType{i}"
										bind:value={column.type}
										class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
									>
										{#each commonTypes as type}
											<option value={type}>{type}</option>
										{/each}
									</select>
								</div>

								<!-- Default Value -->
								<div>
									<label for="colDefault{i}" class="block text-sm font-medium text-gray-700 mb-1">
										Default Value (optional)
									</label>
									<input
										type="text"
										id="colDefault{i}"
										bind:value={column.defaultValue}
										class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
										placeholder="NULL"
									/>
								</div>

								<!-- Checkboxes -->
								<div class="space-y-2">
									<div class="flex items-center">
										<input
											type="checkbox"
											id="colNullable{i}"
											bind:checked={column.nullable}
											class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
										/>
										<label for="colNullable{i}" class="ml-2 block text-sm text-gray-700">
											Nullable
										</label>
									</div>

									<div class="flex items-center">
										<input
											type="checkbox"
											id="colPrimary{i}"
											bind:checked={column.isPrimaryKey}
											class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
										/>
										<label for="colPrimary{i}" class="ml-2 block text-sm text-gray-700">
											Primary Key
										</label>
									</div>

									<div class="flex items-center">
										<input
											type="checkbox"
											id="colUnique{i}"
											bind:checked={column.isUnique}
											class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
										/>
										<label for="colUnique{i}" class="ml-2 block text-sm text-gray-700">
											Unique
										</label>
									</div>

									<div class="flex items-center">
										<input
											type="checkbox"
											id="colAuto{i}"
											bind:checked={column.autoIncrement}
											class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
										/>
										<label for="colAuto{i}" class="ml-2 block text-sm text-gray-700">
											Auto Increment
										</label>
									</div>
								</div>
							</div>

							<!-- Remove Button -->
							{#if columns.length > 1}
								<div class="mt-3 flex justify-end">
									<button
										type="button"
										onclick={() => removeColumn(i)}
										class="text-sm text-red-600 hover:text-red-900"
									>
										Remove Column
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex justify-end space-x-3">
				<a
					href="/datasources/{datasourceId}/schema"
					class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Cancel
				</a>
				<button
					type="button"
					onclick={createTable}
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
						Creating...
					{:else}
						Create Table
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
