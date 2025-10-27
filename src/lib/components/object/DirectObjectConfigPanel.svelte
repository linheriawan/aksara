<script lang="ts">
	interface Props {
		object: any;
		onClose: () => void;
		onSave: (config: any) => Promise<void>;
	}

	let { object, onClose, onSave }: Props = $props();

	// Active tab
	let activeTab = $state<
		'protocols' | 'apiConfig' | 'primaryKey' | 'security' | 'rateLimit' | 'fields'
	>('protocols');

	// Publishing configuration state
	let config = $state({
		protocols: {
			rest: {
				enabled: object.publishing?.protocols?.rest?.enabled || false,
				methods: object.publishing?.protocols?.rest?.methods || ['GET', 'POST', 'PUT', 'DELETE'],
				customPath: object.publishing?.protocols?.rest?.customPath || '',
				maxPageSize: object.publishing?.protocols?.rest?.maxPageSize || 100,
				defaultLimit: object.publishing?.protocols?.rest?.defaultLimit || 1000,
				filtering: {
					allowedOperators:
						object.publishing?.protocols?.rest?.filtering?.allowedOperators || [
							'eq',
							'ne',
							'gt',
							'gte',
							'lt',
							'lte',
							'in',
							'like'
						],
					allowedFields: object.publishing?.protocols?.rest?.filtering?.allowedFields || []
				},
				sorting: {
					allowedFields: object.publishing?.protocols?.rest?.sorting?.allowedFields || [],
					defaultSort: object.publishing?.protocols?.rest?.sorting?.defaultSort || {
						field: '',
						order: 'asc'
					}
				}
			},
			graphql: { enabled: object.publishing?.protocols?.graphql?.enabled || false },
			grpc: {
				enabled: object.publishing?.protocols?.grpc?.enabled || false,
				operations: object.publishing?.protocols?.grpc?.operations || ['Create', 'Get', 'List', 'Update', 'Delete']
			},
			websocket: { enabled: object.publishing?.protocols?.websocket?.enabled || false },
			mqtt: { enabled: object.publishing?.protocols?.mqtt?.enabled || false },
			soap: { enabled: object.publishing?.protocols?.soap?.enabled || false }
		},
		security: {
			type: object.publishing?.security?.type || 'authenticated',
			allowedRoles: object.publishing?.security?.allowedRoles || []
		},
		rateLimit: {
			requestsPerMinute: object.publishing?.rateLimit?.requestsPerMinute || 1000,
			burstLimit: object.publishing?.rateLimit?.burstLimit || 100,
			ipThrottling: object.publishing?.rateLimit?.ipThrottling ?? true
		},
		fieldVisibility: object.publishing?.fieldVisibility || {},
		primaryKey: {
			type: object.publishing?.primaryKey?.type || 'auto',
			fields: object.publishing?.primaryKey?.fields || ['id']
		}
	});

	// Field visibility state
	const fields = $derived(() => {
		return (object.fields || []).map((field: any) => ({
			...field,
			visible: config.fieldVisibility[field.name] ?? true
		}));
	});

	// New role input
	let newRole = $state('');

	// Saving state
	let isSaving = $state(false);
	let error = $state('');

	// Toggle REST method
	function toggleRESTMethod(method: string) {
		const methods = config.protocols.rest.methods;
		const index = methods.indexOf(method);
		if (index > -1) {
			config.protocols.rest.methods = methods.filter((m) => m !== method);
		} else {
			config.protocols.rest.methods = [...methods, method];
		}
	}

	// Toggle gRPC operation
	function toggleGRPCOperation(operation: string) {
		const operations = config.protocols.grpc.operations;
		const index = operations.indexOf(operation);
		if (index > -1) {
			config.protocols.grpc.operations = operations.filter((o) => o !== operation);
		} else {
			config.protocols.grpc.operations = [...operations, operation];
		}
	}

	// Add role
	function addRole() {
		if (newRole.trim() && !config.security.allowedRoles.includes(newRole.trim())) {
			config.security.allowedRoles = [...config.security.allowedRoles, newRole.trim()];
			newRole = '';
		}
	}

	// Remove role
	function removeRole(role: string) {
		config.security.allowedRoles = config.security.allowedRoles.filter((r) => r !== role);
	}

	// Toggle field visibility
	function toggleFieldVisibility(fieldName: string) {
		config.fieldVisibility = {
			...config.fieldVisibility,
			[fieldName]: !config.fieldVisibility[fieldName]
		};
	}

	// Toggle filter operator
	function toggleFilterOperator(operator: string) {
		const operators = config.protocols.rest.filtering.allowedOperators;
		const index = operators.indexOf(operator);
		if (index > -1) {
			config.protocols.rest.filtering.allowedOperators = operators.filter((o) => o !== operator);
		} else {
			config.protocols.rest.filtering.allowedOperators = [...operators, operator];
		}
	}

	// Add primary key field
	let newPkField = $state('');
	function addPrimaryKeyField() {
		if (newPkField.trim() && !config.primaryKey.fields.includes(newPkField.trim())) {
			config.primaryKey.fields = [...config.primaryKey.fields, newPkField.trim()];
			newPkField = '';
		}
	}

	// Remove primary key field
	function removePrimaryKeyField(field: string) {
		config.primaryKey.fields = config.primaryKey.fields.filter((f) => f !== field);
	}

	// Save configuration
	async function handleSave() {
		error = '';
		isSaving = true;

		try {
			await onSave({ publishing: config });
		} catch (err: any) {
			error = err.message || 'Failed to save configuration';
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
		<div class="p-6">
			<!-- Header -->
			<div class="flex justify-between items-start mb-6">
				<div>
					<h2 class="text-2xl font-bold text-gray-900">Configure Object</h2>
					<p class="text-gray-600 mt-1">{object.displayName}</p>
					<p class="text-xs text-gray-500 mt-1 font-mono">
						{object.directMapping?.table || 'N/A'}
					</p>
				</div>
				<button onclick={onClose} class="text-gray-400 hover:text-gray-600">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>

			<!-- Error Message -->
			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
					{error}
				</div>
			{/if}

			<!-- Tabs -->
			<div class="border-b border-gray-200 mb-6">
				<nav class="flex space-x-4">
					<button
						onclick={() => (activeTab = 'protocols')}
						class="pb-2 px-1 border-b-2 text-sm font-medium transition {activeTab === 'protocols'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Protocols
					</button>
					<button
						onclick={() => (activeTab = 'apiConfig')}
						class="pb-2 px-1 border-b-2 text-sm font-medium transition {activeTab === 'apiConfig'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						API Config
					</button>
					<button
						onclick={() => (activeTab = 'primaryKey')}
						class="pb-2 px-1 border-b-2 text-sm font-medium transition {activeTab === 'primaryKey'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Primary Key
					</button>
					<button
						onclick={() => (activeTab = 'security')}
						class="pb-2 px-1 border-b-2 text-sm font-medium transition {activeTab === 'security'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Security
					</button>
					<button
						onclick={() => (activeTab = 'rateLimit')}
						class="pb-2 px-1 border-b-2 text-sm font-medium transition {activeTab === 'rateLimit'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Rate Limits
					</button>
					<button
						onclick={() => (activeTab = 'fields')}
						class="pb-2 px-1 border-b-2 text-sm font-medium transition {activeTab === 'fields'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Fields ({object.fieldCount})
					</button>
				</nav>
			</div>

			<!-- Tab Content -->
			<div class="space-y-6">
				<!-- Protocols Tab -->
				{#if activeTab === 'protocols'}
					<div class="space-y-4">
						<h3 class="text-lg font-semibold text-gray-900">Expose via Protocols</h3>

						<!-- REST API -->
						<div class="border border-gray-200 rounded-lg p-4">
							<label class="flex items-center space-x-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={config.protocols.rest.enabled}
									class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
								/>
								<div class="flex-1">
									<div class="font-medium text-gray-900">REST API</div>
									<div class="text-sm text-gray-600">Standard HTTP JSON API</div>
								</div>
							</label>

							{#if config.protocols.rest.enabled}
								<div class="mt-3 pl-8 flex gap-2 flex-wrap">
									{#each ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as method}
										<button
											onclick={() => toggleRESTMethod(method)}
											class="px-3 py-1 text-xs rounded transition {config.protocols.rest.methods.includes(
												method
											)
												? 'bg-blue-600 text-white'
												: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
										>
											{method}
										</button>
									{/each}
								</div>
							{/if}
						</div>

						<!-- GraphQL -->
						<div class="border border-gray-200 rounded-lg p-4">
							<label class="flex items-center space-x-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={config.protocols.graphql.enabled}
									class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
								/>
								<div class="flex-1">
									<div class="font-medium text-gray-900">GraphQL</div>
									<div class="text-sm text-gray-600">Flexible query language</div>
								</div>
								<span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Phase 4</span>
							</label>
						</div>

						<!-- gRPC -->
						<div class="border border-gray-200 rounded-lg p-4">
							<label class="flex items-center space-x-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={config.protocols.grpc.enabled}
									class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
								/>
								<div class="flex-1">
									<div class="font-medium text-gray-900">gRPC</div>
									<div class="text-sm text-gray-600">High-performance RPC framework</div>
								</div>
								<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
							</label>

							{#if config.protocols.grpc.enabled}
								<div class="mt-3 pl-8">
									<div class="text-xs text-gray-600 mb-2 font-medium">RPC Methods:</div>
									<div class="flex gap-2 flex-wrap">
										{#each ['Create', 'Get', 'List', 'Update', 'Delete'] as operation}
											<button
												onclick={() => toggleGRPCOperation(operation)}
												class="px-3 py-1 text-xs rounded transition {config.protocols.grpc.operations.includes(
													operation
												)
													? 'bg-indigo-600 text-white'
													: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
											>
												{operation}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>

						<!-- WebSocket -->
						<div class="border border-gray-200 rounded-lg p-4">
							<label class="flex items-center space-x-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={config.protocols.websocket.enabled}
									class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
								/>
								<div class="flex-1">
									<div class="font-medium text-gray-900">WebSocket</div>
									<div class="text-sm text-gray-600">Real-time bidirectional updates</div>
								</div>
								<span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Phase 6</span>
							</label>
						</div>

						<!-- MQTT -->
						<div class="border border-gray-200 rounded-lg p-4">
							<label class="flex items-center space-x-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={config.protocols.mqtt.enabled}
									class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
								/>
								<div class="flex-1">
									<div class="font-medium text-gray-900">MQTT</div>
									<div class="text-sm text-gray-600">IoT messaging protocol</div>
								</div>
								<span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Phase 6</span>
							</label>
						</div>

						<!-- SOAP -->
						<div class="border border-gray-200 rounded-lg p-4">
							<label class="flex items-center space-x-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={config.protocols.soap.enabled}
									class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
								/>
								<div class="flex-1">
									<div class="font-medium text-gray-900">SOAP</div>
									<div class="text-sm text-gray-600">Legacy enterprise protocol</div>
								</div>
								<span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Phase 8</span>
							</label>
						</div>
					</div>
				{/if}

				<!-- API Config Tab -->
				{#if activeTab === 'apiConfig'}
					<div class="space-y-4">
						<h3 class="text-lg font-semibold text-gray-900">REST API Configuration</h3>

						<!-- Custom Path -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								API Path (Optional)
							</label>
							<input
								type="text"
								bind:value={config.protocols.rest.customPath}
								placeholder="Default: /api/{object.name}"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							/>
							<p class="text-xs text-gray-500 mt-1">
								Leave empty for default /api/{object.name}, or specify custom like "/api/v1/users" or "/legacy/customers"
							</p>
						</div>

						<!-- Safety Limits -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Max Page Size
								</label>
								<input
									type="number"
									bind:value={config.protocols.rest.maxPageSize}
									min="1"
									max="1000"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
								<p class="text-xs text-gray-500 mt-1">Maximum records per page (default: 100)</p>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Default Limit (No Pagination)
								</label>
								<input
									type="number"
									bind:value={config.protocols.rest.defaultLimit}
									min="1"
									max="10000"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
								<p class="text-xs text-gray-500 mt-1">Max records when no pagination params (default: 1000)</p>
							</div>
						</div>

						<!-- Allowed Filter Operators -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Allowed Filter Operators
							</label>
							<div class="grid grid-cols-4 gap-2">
								{#each ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'like'] as operator}
									<label class="flex items-center space-x-2 cursor-pointer">
										<input
											type="checkbox"
											checked={config.protocols.rest.filtering.allowedOperators.includes(operator)}
											onchange={() => toggleFilterOperator(operator)}
											class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										<span class="text-sm font-mono">{operator}</span>
									</label>
								{/each}
							</div>
							<p class="text-xs text-gray-500 mt-1">
								Example: ?filter[age][gte]=18&filter[status][eq]=active
							</p>
						</div>

						<!-- Default Sort -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Default Sort (Optional)
							</label>
							<div class="grid grid-cols-2 gap-4">
								<input
									type="text"
									bind:value={config.protocols.rest.sorting.defaultSort.field}
									placeholder="Field name (e.g., created_at)"
									class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
								<select
									bind:value={config.protocols.rest.sorting.defaultSort.order}
									class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								>
									<option value="asc">Ascending</option>
									<option value="desc">Descending</option>
								</select>
							</div>
							<p class="text-xs text-gray-500 mt-1">
								Default sort applied when no ?sort= parameter provided
							</p>
						</div>
					</div>
				{/if}

				<!-- Primary Key Tab -->
				{#if activeTab === 'primaryKey'}
					<div class="space-y-4">
						<h3 class="text-lg font-semibold text-gray-900">Primary Key Configuration</h3>

						<!-- Primary Key Type -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Primary Key Type
							</label>
							<div class="space-y-2">
								<label class="flex items-center space-x-3 cursor-pointer">
									<input
										type="radio"
										name="pkType"
										value="auto"
										checked={config.primaryKey.type === 'auto'}
										onchange={() => (config.primaryKey.type = 'auto')}
										class="text-blue-600 focus:ring-blue-500"
									/>
									<div>
										<span class="text-sm font-medium">Auto-detect</span>
										<p class="text-xs text-gray-500">Automatically detect from datasource schema</p>
									</div>
								</label>

								<label class="flex items-center space-x-3 cursor-pointer">
									<input
										type="radio"
										name="pkType"
										value="single"
										checked={config.primaryKey.type === 'single'}
										onchange={() => (config.primaryKey.type = 'single')}
										class="text-blue-600 focus:ring-blue-500"
									/>
									<div>
										<span class="text-sm font-medium">Single Field</span>
										<p class="text-xs text-gray-500">One primary key field (e.g., id)</p>
									</div>
								</label>

								<label class="flex items-center space-x-3 cursor-pointer">
									<input
										type="radio"
										name="pkType"
										value="composite"
										checked={config.primaryKey.type === 'composite'}
										onchange={() => (config.primaryKey.type = 'composite')}
										class="text-blue-600 focus:ring-blue-500"
									/>
									<div>
										<span class="text-sm font-medium">Composite Key</span>
										<p class="text-xs text-gray-500">Multiple fields (e.g., store_id, txn_id, line_item)</p>
									</div>
								</label>
							</div>
						</div>

						<!-- Primary Key Fields (if not auto) -->
						{#if config.primaryKey.type !== 'auto'}
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Primary Key Fields
								</label>

								<!-- Existing fields -->
								{#if config.primaryKey.fields.length > 0}
									<div class="space-y-2 mb-3">
										{#each config.primaryKey.fields as field}
											<div class="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
												<span class="text-sm font-mono">{field}</span>
												<button
													onclick={() => removePrimaryKeyField(field)}
													class="text-red-600 hover:text-red-800 text-sm"
												>
													Remove
												</button>
											</div>
										{/each}
									</div>
								{/if}

								<!-- Add new field -->
								<div class="flex space-x-2">
									<input
										type="text"
										bind:value={newPkField}
										placeholder="Field name"
										class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									/>
									<button
										onclick={addPrimaryKeyField}
										class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
									>
										Add
									</button>
								</div>

								<p class="text-xs text-gray-500 mt-2">
									{#if config.primaryKey.type === 'composite'}
										Generated URL: /api/{object.name}/{config.primaryKey.fields.join('/')}
									{:else}
										Generated URL: /api/{object.name}/:id
									{/if}
								</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Security Tab -->
				{#if activeTab === 'security'}
					<div class="space-y-4">
						<h3 class="text-lg font-semibold text-gray-900">Access Control</h3>

						<!-- Security Type -->
						<div class="space-y-3">
							<label class="flex items-start space-x-3 cursor-pointer">
								<input
									type="radio"
									bind:group={config.security.type}
									value="public"
									class="mt-1 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
								/>
								<div class="flex-1">
									<div class="font-medium text-gray-900">Public</div>
									<div class="text-sm text-gray-600">No authentication required (open access)</div>
								</div>
							</label>

							<label class="flex items-start space-x-3 cursor-pointer">
								<input
									type="radio"
									bind:group={config.security.type}
									value="authenticated"
									class="mt-1 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
								/>
								<div class="flex-1">
									<div class="font-medium text-gray-900">Authenticated</div>
									<div class="text-sm text-gray-600">Requires valid JWT token</div>
								</div>
							</label>

							<label class="flex items-start space-x-3 cursor-pointer">
								<input
									type="radio"
									bind:group={config.security.type}
									value="role_based"
									class="mt-1 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
								/>
								<div class="flex-1">
									<div class="font-medium text-gray-900">Role-Based</div>
									<div class="text-sm text-gray-600">Only specific roles can access</div>
								</div>
							</label>

							<!-- Allowed Roles (if role-based) -->
							{#if config.security.type === 'role_based'}
								<div class="ml-7 mt-3 space-y-2">
									<label class="block text-sm font-medium text-gray-700">Allowed Roles</label>
									<div class="flex gap-2">
										<input
											type="text"
											bind:value={newRole}
											placeholder="e.g., admin, editor"
											class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											onkeypress={(e) => e.key === 'Enter' && addRole()}
										/>
										<button
											onclick={addRole}
											class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
										>
											Add
										</button>
									</div>
									<div class="flex gap-2 flex-wrap">
										{#each config.security.allowedRoles as role}
											<span
												class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
											>
												{role}
												<button onclick={() => removeRole(role)} class="hover:text-blue-600">
													<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
														<path
															fill-rule="evenodd"
															d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
															clip-rule="evenodd"
														></path>
													</svg>
												</button>
											</span>
										{:else}
											<p class="text-sm text-gray-500">No roles added yet</p>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Rate Limit Tab -->
				{#if activeTab === 'rateLimit'}
					<div class="space-y-4">
						<h3 class="text-lg font-semibold text-gray-900">Rate Limiting</h3>

						<div>
							<label for="rpm" class="block text-sm font-medium text-gray-700 mb-1">
								Requests per Minute
							</label>
							<input
								type="number"
								id="rpm"
								bind:value={config.rateLimit.requestsPerMinute}
								min="1"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<p class="text-xs text-gray-500 mt-1">Maximum requests allowed per minute per user/IP</p>
						</div>

						<div>
							<label for="burst" class="block text-sm font-medium text-gray-700 mb-1">
								Burst Limit
							</label>
							<input
								type="number"
								id="burst"
								bind:value={config.rateLimit.burstLimit}
								min="1"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<p class="text-xs text-gray-500 mt-1">
								Maximum concurrent requests allowed at once
							</p>
						</div>

						<div>
							<label class="flex items-center space-x-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={config.rateLimit.ipThrottling}
									class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
								/>
								<div>
									<div class="font-medium text-gray-900">IP-Based Throttling</div>
									<div class="text-sm text-gray-600">Apply rate limits per IP address</div>
								</div>
							</label>
						</div>
					</div>
				{/if}

				<!-- Fields Tab -->
				{#if activeTab === 'fields'}
					<div class="space-y-4">
						<div class="flex justify-between items-center">
							<h3 class="text-lg font-semibold text-gray-900">Field Visibility</h3>
							<p class="text-sm text-gray-600">{fields().filter((f) => f.visible).length} visible</p>
						</div>

						<div class="space-y-2">
							{#each fields() as field}
								<label
									class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
								>
									<input
										type="checkbox"
										checked={field.visible}
										onchange={() => toggleFieldVisibility(field.name)}
										class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
									/>
									<div class="flex-1">
										<div class="font-medium text-gray-900 font-mono text-sm">{field.name}</div>
										<div class="text-xs text-gray-600">
											Type: {field.type}
											{#if field.required}<span class="text-red-600">*</span>{/if}
										</div>
									</div>
								</label>
							{/each}
						</div>

						<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
							💡 Tip: Unchecked fields will not be included in API responses. Use this to hide sensitive
							data like passwords or internal IDs.
						</div>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
				<button
					onclick={onClose}
					class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
					disabled={isSaving}
				>
					Cancel
				</button>
				<button
					onclick={handleSave}
					disabled={isSaving}
					class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSaving ? 'Saving...' : 'Save Configuration'}
				</button>
			</div>
		</div>
	</div>
</div>
