<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Form state
	let name = $state('');
	let displayName = $state('');
	let description = $state('');

	// Example JSON for structure
	let exampleJSON = $state(`{
  "name": "annie",
  "roles": ["admin", "backup"],
  "access": [
    {"module": "datasource"},
    {"module": "connection"}
  ]
}`);

	// Parsed fields from JSON
	let parsedFields = $state<any[]>([]);

	// Field mappings
	let fieldMappings = $state<any[]>([]);

	// Table relationships
	let relationships = $state<any[]>([]);

	let isSubmitting = $state(false);
	let error = $state('');

	// Available field types
	const fieldTypes = [
		'string',
		'number',
		'integer',
		'boolean',
		'date',
		'datetime',
		'timestamp',
		'json',
		'array',
		'uuid'
	];

	// Parse JSON to detect structure
	function parseExampleJSON() {
		try {
			const parsed = JSON.parse(exampleJSON);
			const detectedFields: any[] = [];

			function detectType(value: any): string {
				if (Array.isArray(value)) return 'array';
				if (value === null) return 'string';
				if (typeof value === 'object') return 'json';
				if (typeof value === 'number') {
					return Number.isInteger(value) ? 'integer' : 'number';
				}
				if (typeof value === 'boolean') return 'boolean';
				return 'string';
			}

			function extractFields(obj: any, prefix = '') {
				for (const [key, value] of Object.entries(obj)) {
					const fieldName = prefix ? `${prefix}.${key}` : key;
					detectedFields.push({
						name: fieldName,
						type: detectType(value),
						required: true,
						example: JSON.stringify(value),
						// Initialize mapping
						mapping: {
							type: 'direct',
							datasourceId: '',
							table: '',
							column: ''
						}
					});
				}
			}

			extractFields(parsed);
			parsedFields = detectedFields;

			// Initialize field mappings
			fieldMappings = detectedFields.map(f => ({...f}));

			error = '';
		} catch (err: any) {
			error = `Invalid JSON: ${err.message}`;
			parsedFields = [];
		}
	}

	// Add relationship
	function addRelationship() {
		relationships.push({
			leftTable: '',
			joinType: 'LEFT',
			rightTable: '',
			leftColumn: '',
			rightColumn: ''
		});
	}

	// Remove relationship
	function removeRelationship(index: number) {
		relationships.splice(index, 1);
	}

	// Submit form
	async function handleSubmit() {
		error = '';

		// Validate
		if (!name.trim()) {
			error = 'Object name is required';
			return;
		}

		if (!displayName.trim()) {
			error = 'Display name is required';
			return;
		}

		if (parsedFields.length === 0) {
			error = 'Please provide valid example JSON';
			return;
		}

		// Validate that all fields have mappings
		for (const field of fieldMappings) {
			if (!field.mapping.datasourceId || !field.mapping.table || !field.mapping.column) {
				error = `Field "${field.name}" is missing mapping configuration`;
				return;
			}
		}

		isSubmitting = true;

		try {
			const response = await fetch('/api/objects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					displayName: displayName.trim(),
					description: description.trim(),
					objectType: 'custom',
					fields: fieldMappings,
					relationships,
					customMapping: {
						datasources: Array.from(
							new Set(fieldMappings.map((f) => f.mapping.datasourceId))
						).map((dsId) => {
							const ds = data.datasources.find((d) => d.id === dsId);
							return {
								id: dsId,
								alias: ds?.name || 'unknown',
								isDefault: true
							};
						}),
						fields: fieldMappings,
						joins: relationships.map((rel) => ({
							table: rel.rightTable,
							joinType: rel.joinType,
							on: {
								leftTable: rel.leftTable,
								leftColumn: rel.leftColumn,
								rightColumn: rel.rightColumn
							}
						}))
					}
				})
			});

			const result = await response.json();

			if (response.ok) {
				goto('/objects');
			} else {
				error = result.error || 'Failed to create object';
			}
		} catch (err: any) {
			error = err.message || 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Create Custom Object - Aksara Platform</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<!-- Page Header -->
		<div>
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Create Custom Object</h1>
					<p class="text-gray-600 mt-1">
						Define complex objects with multi-table JOINs and cross-datasource relations
					</p>
				</div>
				<a
					href="/objects"
					class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
				>
					Cancel
				</a>
			</div>
		</div>

		<!-- Info Banner -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<div class="flex items-start space-x-3">
				<svg class="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					></path>
				</svg>
				<div class="text-sm text-blue-800">
					<p class="font-semibold">For simple 1:1 table mappings:</p>
					<p class="mt-1">
						Use <a href="/objects/direct" class="underline hover:text-blue-900">Direct Objects</a>
						instead. They are auto-discovered from your datasources and require no manual field mapping.
					</p>
				</div>
			</div>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
				{error}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
			<!-- Section 1: Basic Information -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">1. Basic Information</h2>

				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
							Object Name *
						</label>
						<input
							type="text"
							id="name"
							bind:value={name}
							placeholder="e.g., user_with_permissions"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
						<p class="text-xs text-gray-500 mt-1">
							Used in API endpoint: /api/v1/{name || 'objectname'}
						</p>
					</div>

					<div>
						<label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">
							Display Name *
						</label>
						<input
							type="text"
							id="displayName"
							bind:value={displayName}
							placeholder="e.g., User with Permissions"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							id="description"
							bind:value={description}
							rows="2"
							placeholder="Optional description of this custom object"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						></textarea>
					</div>
				</div>
			</div>

			<!-- Section 2: Response Structure -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">2. API Response Structure</h2>

				<div class="space-y-4">
					<div>
						<label for="exampleJSON" class="block text-sm font-medium text-gray-700 mb-2">
							Paste Example JSON Response *
						</label>
						<textarea
							id="exampleJSON"
							bind:value={exampleJSON}
							rows="14"
							placeholder="{`{
  "name": "annie",
  "roles": ["admin", "backup"],
  "access": [
    {"module": "datasource"},
    {"module": "connection"}
  ]
}`}"
							class="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							oninput={() => parseExampleJSON()}
						></textarea>
						<p class="text-xs text-gray-500 mt-1">
							Define the desired JSON structure that your API endpoint will return
						</p>
					</div>

					<!-- Auto-detected fields -->
					{#if parsedFields.length > 0}
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<h3 class="font-semibold text-green-900 mb-2">
								✓ Detected {parsedFields.length} fields
							</h3>
							<div class="space-y-1 text-sm text-green-800">
								{#each parsedFields as field}
									<div class="font-mono">
										• {field.name}: <span class="text-green-600">{field.type}</span>
									</div>
								{/each}
							</div>
							<p class="text-xs text-green-700 mt-3">
								→ Now map each field to database columns in Section 3 below
							</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Section 3: Field Mappings -->
			{#if parsedFields.length > 0}
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">3. Field Mappings</h2>
					<p class="text-sm text-gray-600 mb-4">
						Configure where each field gets its data from
					</p>

					<div class="space-y-4">
						{#each fieldMappings as field, index}
							<div class="border border-gray-200 rounded-lg p-4">
								<div class="font-medium text-gray-900 mb-3">
									<span class="font-mono">{field.name}</span>
									<span class="text-xs text-gray-500 ml-2">({field.type})</span>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
									<!-- Datasource -->
									<div>
										<label class="block text-xs font-medium text-gray-700 mb-1">
											Datasource *
										</label>
										<select
											bind:value={field.mapping.datasourceId}
											class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
											required
										>
											<option value="">Select datasource...</option>
											{#each data.datasources as ds}
												<option value={ds.id}>{ds.displayName}</option>
											{/each}
										</select>
									</div>

									<!-- Table -->
									<div>
										<label class="block text-xs font-medium text-gray-700 mb-1">
											Table *
										</label>
										<input
											type="text"
											bind:value={field.mapping.table}
											placeholder="table_name"
											class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>

									<!-- Column -->
									<div>
										<label class="block text-xs font-medium text-gray-700 mb-1">
											Column *
										</label>
										<input
											type="text"
											bind:value={field.mapping.column}
											placeholder="column_name"
											class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Section 4: Table Relationships -->
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex justify-between items-center mb-4">
						<div>
							<h2 class="text-xl font-semibold text-gray-900">4. Table Relationships (JOINs)</h2>
							<p class="text-sm text-gray-600 mt-1">
								Define how tables are joined together
							</p>
						</div>
						<button
							type="button"
							onclick={addRelationship}
							class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
						>
							+ Add JOIN
						</button>
					</div>

					{#if relationships.length > 0}
						<div class="space-y-3">
							{#each relationships as rel, index}
								<div class="border border-gray-200 rounded-lg p-4">
									<div class="flex justify-between items-start mb-3">
										<div class="text-sm font-medium text-gray-700">JOIN #{index + 1}</div>
										<button
											type="button"
											onclick={() => removeRelationship(index)}
											class="text-red-600 hover:text-red-800 text-sm"
										>
											Remove
										</button>
									</div>

									<div class="grid grid-cols-1 md:grid-cols-5 gap-3">
										<div>
											<label class="block text-xs font-medium text-gray-700 mb-1">
												Left Table
											</label>
											<input
												type="text"
												bind:value={rel.leftTable}
												placeholder="users"
												class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
											/>
										</div>

										<div>
											<label class="block text-xs font-medium text-gray-700 mb-1">
												Join Type
											</label>
											<select
												bind:value={rel.joinType}
												class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
											>
												<option value="LEFT">LEFT JOIN</option>
												<option value="INNER">INNER JOIN</option>
												<option value="RIGHT">RIGHT JOIN</option>
												<option value="FULL">FULL JOIN</option>
											</select>
										</div>

										<div>
											<label class="block text-xs font-medium text-gray-700 mb-1">
												Right Table
											</label>
											<input
												type="text"
												bind:value={rel.rightTable}
												placeholder="user_roles"
												class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
											/>
										</div>

										<div>
											<label class="block text-xs font-medium text-gray-700 mb-1">
												ON (Left Column)
											</label>
											<input
												type="text"
												bind:value={rel.leftColumn}
												placeholder="id"
												class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
											/>
										</div>

										<div>
											<label class="block text-xs font-medium text-gray-700 mb-1">
												= (Right Column)
											</label>
											<input
												type="text"
												bind:value={rel.rightColumn}
												placeholder="user_id"
												class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
											/>
										</div>
									</div>

									<div class="mt-2 text-xs font-mono text-gray-600 bg-gray-50 px-3 py-2 rounded">
										{rel.leftTable || 'table1'} {rel.joinType} JOIN {rel.rightTable || 'table2'}
										ON {rel.leftTable || 'table1'}.{rel.leftColumn || 'column1'} = {rel.rightTable ||
											'table2'}.{rel.rightColumn || 'column2'}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500">
							<p class="text-sm">No relationships defined yet.</p>
							<p class="text-xs mt-1">
								Click "+ Add JOIN" to define how your tables are related.
							</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex justify-between items-center bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
				<a
					href="/objects"
					class="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
				>
					Cancel
				</a>
				<button
					type="submit"
					disabled={isSubmitting || parsedFields.length === 0}
					class="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? 'Creating...' : 'Create Custom Object'}
				</button>
			</div>
		</form>
	</div>
</div>
