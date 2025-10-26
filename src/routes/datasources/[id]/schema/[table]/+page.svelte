<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/components/DataTable.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let showDropConfirm = $state(false);
	let isDropping = $state(false);

	let showAddColumn = $state(false);
	let showEditColumn = $state(false);
	let showDropColumn = $state(false);
	let showRenameTable = $state(false);

	let newColumnName = $state('');
	let newColumnType = $state('VARCHAR(255)');
	let newColumnNullable = $state(true);
	let newColumnDefault = $state('');

	let editingColumn = $state<any>(null);
	let editColumnName = $state('');
	let editColumnDef = $state('');

	let dropColumnName = $state('');

	let renameTableName = $state('');

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

	async function dropTable() {
		isDropping = true;

		try {
			const response = await fetch(`/api/datasources/${data.datasource.id}/tables`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tableName: data.tableName })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to drop table');
			}

			goto(`/datasources/${data.datasource.id}/schema`);
		} catch (err: any) {
			alert(`Error: ${err.message}`);
		} finally {
			isDropping = false;
			showDropConfirm = false;
		}
	}

	async function addColumn() {
		loading = true;
		error = '';

		try {
			let columnDef = newColumnType;
			if (!newColumnNullable) columnDef += ' NOT NULL';
			if (newColumnDefault) columnDef += ` DEFAULT ${newColumnDefault}`;

			const response = await fetch(`/api/datasources/${data.datasource.id}/tables`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tableName: data.tableName,
					operation: 'add_column',
					columnName: newColumnName,
					columnDef
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to add column');
			}

			// Refresh page
			window.location.reload();
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function updateColumn() {
		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/datasources/${data.datasource.id}/tables`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tableName: data.tableName,
					operation: 'modify_column',
					columnName: editColumnName,
					columnDef: editColumnDef
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to modify column');
			}

			window.location.reload();
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function deleteColumn() {
		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/datasources/${data.datasource.id}/tables`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tableName: data.tableName,
					operation: 'drop_column',
					columnName: dropColumnName
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to drop column');
			}

			window.location.reload();
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function renameTable() {
		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/datasources/${data.datasource.id}/tables`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tableName: data.tableName,
					operation: 'rename_table',
					newTableName: renameTableName
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to rename table');
			}

			goto(`/datasources/${data.datasource.id}/schema/${renameTableName}`);
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	const columnColumns = [
		{ key: 'name', label: 'Column Name', sortable: true },
		{ key: 'type', label: 'Type', sortable: true },
		{
			key: 'nullable',
			label: 'Nullable',
			sortable: true,
			render: (val: boolean) => (val ? 'YES' : 'NO')
		},
		{
			key: 'defaultValue',
			label: 'Default',
			sortable: false,
			render: (val: any) => (val !== null && val !== undefined ? String(val) : 'NULL')
		},
		{
			key: 'isPrimaryKey',
			label: 'Key',
			sortable: false,
			render: (val: boolean, row: any) => {
				const keys = [];
				if (val) keys.push('PRI');
				if (row.isUnique) keys.push('UNI');
				if (row.isForeignKey) keys.push('FOR');
				return keys.length > 0 ? keys.join(', ') : '';
			}
		}
	];

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

	function openEditColumn(column: any) {
		editingColumn = column;
		editColumnName = column.name;
		editColumnDef = `${column.type}${!column.nullable ? ' NOT NULL' : ''}${column.defaultValue ? ' DEFAULT ' + column.defaultValue : ''}`;
		showEditColumn = true;
	}

	function openDropColumn(column: any) {
		dropColumnName = column.name;
		showDropColumn = true;
	}
</script>

<svelte:head>
	<title>{data.tableName} - Schema - {data.datasource.name}</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
	<div class="mb-8">
		<a
			href="/datasources/{data.datasource.id}/schema"
			class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
		>
			← Back to Schema
		</a>
	</div>

	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				<span class="text-3xl mr-3">{getTypeIcon(data.datasource.type)}</span>
				<div>
					<h1 class="text-2xl font-bold text-gray-900">{data.tableName}</h1>
					<p class="mt-1 text-sm text-gray-500">
						{data.table.columns?.length || 0} columns
						{#if data.table.schema}
							• Schema: {data.table.schema}
						{/if}
					</p>
				</div>
			</div>
			<div class="flex space-x-3">
				<button
					type="button"
					onclick={() => (showRenameTable = true)}
					class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					<svg
						class="-ml-1 mr-2 h-5 w-5 text-gray-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
					</svg>
					Rename Table
				</button>
				<a
					href="/datasources/{data.datasource.id}/schema/{data.tableName}/data"
					class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					<svg
						class="-ml-1 mr-2 h-5 w-5 text-gray-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
						<path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
						<path
							d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"
						/>
					</svg>
					Browse Data
				</a>
				<button
					type="button"
					onclick={() => (showDropConfirm = true)}
					class="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
				>
					<svg
						class="-ml-1 mr-2 h-5 w-5 text-red-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
					Drop Table
				</button>
			</div>
		</div>
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

	<!-- Drop Table Modal -->
	{#if showDropConfirm}
		<div class="fixed z-10 inset-0 overflow-y-auto">
			<div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
				<span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
				<div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
					<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<div class="sm:flex sm:items-start">
							<div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
								<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
							</div>
							<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
								<h3 class="text-lg leading-6 font-medium text-gray-900">Drop Table</h3>
								<div class="mt-2">
									<p class="text-sm text-gray-500">
										Are you sure you want to drop table <strong>{data.tableName}</strong>? This action cannot be undone and all data in this table will be permanently deleted.
									</p>
								</div>
							</div>
						</div>
					</div>
					<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
						<button
							type="button"
							onclick={dropTable}
							disabled={isDropping}
							class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
						>
							{#if isDropping}
								Dropping...
							{:else}
								Drop Table
							{/if}
						</button>
						<button
							type="button"
							onclick={() => (showDropConfirm = false)}
							disabled={isDropping}
							class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Rename Table Modal -->
	{#if showRenameTable}
		<div class="fixed z-10 inset-0 overflow-y-auto">
			<div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
				<span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
				<div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
					<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Rename Table</h3>
						<div>
							<label for="renameTableName" class="block text-sm font-medium text-gray-700 mb-2">
								New Table Name
							</label>
							<input
								type="text"
								id="renameTableName"
								bind:value={renameTableName}
								class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
								placeholder={data.tableName}
							/>
						</div>
					</div>
					<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
						<button
							type="button"
							onclick={renameTable}
							disabled={loading || !renameTableName}
							class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
						>
							Rename
						</button>
						<button
							type="button"
							onclick={() => (showRenameTable = false)}
							disabled={loading}
							class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Add Column Modal -->
	{#if showAddColumn}
		<div class="fixed z-10 inset-0 overflow-y-auto">
			<div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
				<span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
				<div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
					<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Add Column</h3>
						<div class="space-y-4">
							<div>
								<label for="newColumnName" class="block text-sm font-medium text-gray-700 mb-2">
									Column Name
								</label>
								<input
									type="text"
									id="newColumnName"
									bind:value={newColumnName}
									class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
									placeholder="column_name"
								/>
							</div>
							<div>
								<label for="newColumnType" class="block text-sm font-medium text-gray-700 mb-2">
									Data Type
								</label>
								<select
									id="newColumnType"
									bind:value={newColumnType}
									class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
								>
									{#each commonTypes as type}
										<option value={type}>{type}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="newColumnDefault" class="block text-sm font-medium text-gray-700 mb-2">
									Default Value (optional)
								</label>
								<input
									type="text"
									id="newColumnDefault"
									bind:value={newColumnDefault}
									class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
									placeholder="NULL"
								/>
							</div>
							<div class="flex items-center">
								<input
									type="checkbox"
									id="newColumnNullable"
									bind:checked={newColumnNullable}
									class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
								/>
								<label for="newColumnNullable" class="ml-2 block text-sm text-gray-700">
									Nullable
								</label>
							</div>
						</div>
					</div>
					<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
						<button
							type="button"
							onclick={addColumn}
							disabled={loading || !newColumnName}
							class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
						>
							{loading ? 'Adding...' : 'Add Column'}
						</button>
						<button
							type="button"
							onclick={() => (showAddColumn = false)}
							disabled={loading}
							class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Edit Column Modal -->
	{#if showEditColumn}
		<div class="fixed z-10 inset-0 overflow-y-auto">
			<div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
				<span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
				<div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
					<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Column</h3>
						<div class="space-y-4">
							<div>
								<label for="editColumnName" class="block text-sm font-medium text-gray-700 mb-2">
									Column Name
								</label>
								<input
									type="text"
									id="editColumnName"
									bind:value={editColumnName}
									class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
									disabled
								/>
							</div>
							<div>
								<label for="editColumnDef" class="block text-sm font-medium text-gray-700 mb-2">
									Column Definition
								</label>
								<input
									type="text"
									id="editColumnDef"
									bind:value={editColumnDef}
									class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
									placeholder="VARCHAR(255) NOT NULL"
								/>
								<p class="mt-1 text-xs text-gray-500">
									Example: VARCHAR(100), INT NOT NULL, DECIMAL(10,2) DEFAULT 0
								</p>
							</div>
						</div>
					</div>
					<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
						<button
							type="button"
							onclick={updateColumn}
							disabled={loading || !editColumnDef}
							class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
						>
							{loading ? 'Updating...' : 'Update Column'}
						</button>
						<button
							type="button"
							onclick={() => (showEditColumn = false)}
							disabled={loading}
							class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Drop Column Modal -->
	{#if showDropColumn}
		<div class="fixed z-10 inset-0 overflow-y-auto">
			<div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
				<span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
				<div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
					<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<div class="sm:flex sm:items-start">
							<div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
								<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
							</div>
							<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
								<h3 class="text-lg leading-6 font-medium text-gray-900">Drop Column</h3>
								<div class="mt-2">
									<p class="text-sm text-gray-500">
										Are you sure you want to drop column <strong>{dropColumnName}</strong>? This action cannot be undone and all data in this column will be permanently deleted.
									</p>
								</div>
							</div>
						</div>
					</div>
					<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
						<button
							type="button"
							onclick={deleteColumn}
							disabled={loading}
							class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
						>
							{loading ? 'Dropping...' : 'Drop Column'}
						</button>
						<button
							type="button"
							onclick={() => (showDropColumn = false)}
							disabled={loading}
							class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Primary Keys -->
	{#if data.table.primaryKeys && data.table.primaryKeys.length > 0}
		<div class="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
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
							d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-blue-700">
						<span class="font-medium">Primary Key:</span>
						{data.table.primaryKeys.join(', ')}
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Foreign Keys -->
	{#if data.table.foreignKeys && data.table.foreignKeys.length > 0}
		<div class="mb-6">
			<h2 class="text-lg font-medium text-gray-900 mb-3">Foreign Keys</h2>
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<ul class="divide-y divide-gray-200">
					{#each data.table.foreignKeys as fk}
						<li class="px-4 py-3">
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">{fk.name}</p>
									<p class="text-sm text-gray-500">
										{fk.column} → {fk.referencedTable}.{fk.referencedColumn}
									</p>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	<!-- Indexes -->
	{#if data.table.indexes && data.table.indexes.length > 0}
		<div class="mb-6">
			<h2 class="text-lg font-medium text-gray-900 mb-3">Indexes</h2>
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<ul class="divide-y divide-gray-200">
					{#each data.table.indexes as index}
						<li class="px-4 py-3">
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">{index.name}</p>
									<p class="text-sm text-gray-500">
										Columns: {index.columns.join(', ')}
										{#if index.unique}
											<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
												UNIQUE
											</span>
										{/if}
									</p>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	<!-- Columns -->
	<div>
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-lg font-medium text-gray-900">Columns</h2>
			<button
				type="button"
				onclick={() => (showAddColumn = true)}
				class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
				Add Column
			</button>
		</div>
		<DataTable
			columns={columnColumns}
			data={data.table.columns || []}
			emptyMessage="No columns found"
		>
			{#snippet actions(row)}
				<div class="flex space-x-2">
					<button
						type="button"
						onclick={() => openEditColumn(row)}
						class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
					>
						Edit
					</button>
					{#if !row.isPrimaryKey}
						<button
							type="button"
							onclick={() => openDropColumn(row)}
							class="text-red-600 hover:text-red-900 text-sm font-medium"
						>
							Delete
						</button>
					{/if}
				</div>
			{/snippet}
		</DataTable>
	</div>
	</div>
</div>
