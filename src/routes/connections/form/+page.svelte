<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const isEdit = data.mode === 'edit';

	let name = $state(isEdit ? data.connection!.name : '');
	let description = $state(isEdit ? data.connection!.description || '' : '');
	let type = $state<'mysql' | 'postgresql' | 'mongodb' | 'rest_api'>(
		isEdit ? (data.connection!.type as any) : 'mysql'
	);
	let host = $state(isEdit ? data.connection!.config.host || 'localhost' : 'localhost');
	let port = $state(isEdit ? data.connection!.config.port || 3306 : 3306);
	let username = $state(isEdit ? data.connection!.config.username || '' : '');
	let password = $state(''); // Don't populate password for security
	let ssl = $state(isEdit ? data.connection!.config.ssl || false : false);
	let connectionString = $state(isEdit ? data.connection!.config.connectionString || '' : '');
	let baseUrl = $state(isEdit ? data.connection!.config.baseUrl || '' : '');
	let authType = $state<'none' | 'bearer' | 'api_key' | 'oauth2'>(
		isEdit ? data.connection!.config.authType || 'none' : 'none'
	);
	let saving = $state(false);
	let testing = $state(false);
	let error = $state('');
	let testResult = $state<{ success: boolean; message: string } | null>(null);

	// Update default port when type changes (only in create mode)
	$effect(() => {
		if (!isEdit) {
			if (type === 'mysql') port = 3306;
			else if (type === 'postgresql') port = 5432;
			else if (type === 'mongodb') port = 27017;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		saving = true;

		try {
			let config: any;

			if (type === 'rest_api') {
				config = {
					baseUrl,
					authType,
					headers: {}
				};
			} else {
				config = {
					host,
					port,
					username,
					ssl
				};

				// Only include password if provided
				if (password) {
					config.password = password;
				}

				if (type === 'mongodb' && connectionString) {
					config.connectionString = connectionString;
				}
			}

			const url = isEdit ? `/api/connections/${data.connection!.id}` : '/api/connections';
			const method = isEdit ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					description,
					type,
					config
				})
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || `Failed to ${isEdit ? 'update' : 'create'} connection`);
			}

			const connection = await response.json();
			goto('/connections');
		} catch (err: any) {
			error = err.message;
		} finally {
			saving = false;
		}
	}

	async function testConnection() {
		error = '';
		testResult = null;
		testing = true;

		try {
			let config: any;

			if (type === 'rest_api') {
				config = {
					baseUrl,
					authType,
					headers: {}
				};
			} else {
				config = {
					host,
					port,
					username,
					ssl
				};

				// Include password if provided or if we're editing
				if (password) {
					config.password = password;
				} else if (!isEdit) {
					throw new Error('Password is required to test connection');
				}

				if (type === 'mongodb' && connectionString) {
					config.connectionString = connectionString;
				}
			}

			const url = isEdit
				? `/api/connections/${data.connection!.id}/test`
				: '/api/connections/test';

			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type,
					config
				})
			});

			const result = await response.json();

			if (result.success) {
				testResult = {
					success: true,
					message: `Connection successful! Response time: ${result.responseTime}ms`
				};
			} else {
				testResult = {
					success: false,
					message: result.message || 'Connection failed'
				};
			}
		} catch (err: any) {
			testResult = {
				success: false,
				message: err.message
			};
		} finally {
			testing = false;
		}
	}

	function cancel() {
		goto('/connections');
	}
</script>

<svelte:head>
	<title>{isEdit ? `Edit ${data.connection!.name}` : 'New Connection'} - Aksara Platform</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="max-w-2xl mx-auto space-y-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">
			{isEdit ? 'Edit Connection' : 'New Connection'}
		</h1>
		<p class="mt-1 text-sm text-gray-600">
			{isEdit ? 'Update connection settings' : 'Connect to a database server or external API'}
		</p>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
			<p class="text-red-800">{error}</p>
		</div>
	{/if}

	{#if testResult}
		<div
			class="border rounded-md p-4 mb-6 {testResult.success
				? 'bg-green-50 border-green-200'
				: 'bg-red-50 border-red-200'}"
		>
			<p class="{testResult.success ? 'text-green-800' : 'text-red-800'}">
				{testResult.success ? '✅' : '❌'} {testResult.message}
			</p>
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="bg-white rounded-lg border border-gray-200 p-6">
		<!-- Basic Information -->
		<div class="space-y-4 mb-6">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
					Connection Name *
				</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					required
					placeholder="Production MySQL"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
					Description
				</label>
				<textarea
					id="description"
					bind:value={description}
					placeholder="Optional description"
					rows="2"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				></textarea>
			</div>

			<div>
				<label for="type" class="block text-sm font-medium text-gray-700 mb-1">
					Connection Type *
				</label>
				<select
					id="type"
					bind:value={type}
					disabled={isEdit}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {isEdit
						? 'bg-gray-50 cursor-not-allowed'
						: ''}"
				>
					<option value="mysql">MySQL</option>
					<option value="postgresql">PostgreSQL</option>
					<option value="mongodb">MongoDB</option>
					<option value="rest_api">REST API</option>
				</select>
				{#if isEdit}
					<p class="mt-1 text-xs text-gray-500">Connection type cannot be changed</p>
				{/if}
			</div>
		</div>

		<!-- Database Connection Config -->
		{#if type !== 'rest_api'}
			<div class="border-t border-gray-200 pt-6 mb-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Server Configuration</h2>

				<div class="space-y-4">
					{#if type === 'mongodb'}
						<div>
							<label for="connectionString" class="block text-sm font-medium text-gray-700 mb-1">
								Connection String (Optional)
							</label>
							<input
								id="connectionString"
								type="text"
								bind:value={connectionString}
								placeholder="mongodb://username:password@host:port/database"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<p class="mt-1 text-xs text-gray-500">
								If provided, this will override individual settings below
							</p>
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="host" class="block text-sm font-medium text-gray-700 mb-1">
								Host *
							</label>
							<input
								id="host"
								type="text"
								bind:value={host}
								required
								placeholder="localhost"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label for="port" class="block text-sm font-medium text-gray-700 mb-1">
								Port *
							</label>
							<input
								id="port"
								type="number"
								bind:value={port}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					<div>
						<label for="username" class="block text-sm font-medium text-gray-700 mb-1">
							Username
						</label>
						<input
							id="username"
							type="text"
							bind:value={username}
							placeholder="root"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
							Password {isEdit ? '' : '*'}
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							placeholder={isEdit ? 'Leave empty to keep current password' : '••••••••'}
							required={!isEdit}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{#if isEdit}
							<p class="mt-1 text-xs text-gray-500">Leave empty to keep current password</p>
						{/if}
					</div>

					<div class="flex items-center">
						<input
							id="ssl"
							type="checkbox"
							bind:checked={ssl}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<label for="ssl" class="ml-2 block text-sm text-gray-700"> Use SSL/TLS </label>
					</div>
				</div>
			</div>
		{:else}
			<!-- REST API Config -->
			<div class="border-t border-gray-200 pt-6 mb-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">API Configuration</h2>

				<div class="space-y-4">
					<div>
						<label for="baseUrl" class="block text-sm font-medium text-gray-700 mb-1">
							Base URL *
						</label>
						<input
							id="baseUrl"
							type="url"
							bind:value={baseUrl}
							required
							placeholder="https://api.example.com"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="authType" class="block text-sm font-medium text-gray-700 mb-1">
							Authentication Type
						</label>
						<select
							id="authType"
							bind:value={authType}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="none">None</option>
							<option value="bearer">Bearer Token</option>
							<option value="api_key">API Key</option>
							<option value="oauth2">OAuth 2.0</option>
						</select>
					</div>
				</div>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex justify-between pt-6 border-t border-gray-200">
			<button
				type="button"
				onclick={testConnection}
				disabled={testing}
				class="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if testing}
					Testing...
				{:else}
					Test Connection
				{/if}
			</button>
			<div class="flex space-x-3">
				<button
					type="button"
					onclick={cancel}
					class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={saving}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if saving}
						{isEdit ? 'Saving...' : 'Creating...'}
					{:else}
						{isEdit ? 'Save Changes' : 'Create Connection'}
					{/if}
				</button>
			</div>
		</div>
	</form>
	</div>
</div>
