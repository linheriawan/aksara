<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	let publishing = false;
	let error = '';
	let success = false;
	let publishedServiceUrl = '';

	async function publishService() {
		publishing = true;
		error = '';
		success = false;

		try {
			const response = await fetch(`/api/grpc/publish`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ objectDefinitionId: data.object.id })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to publish gRPC service');
			}

			success = true;
			publishedServiceUrl = result.data.serviceUrl;

			// Redirect back to objects list after 2 seconds
			setTimeout(() => {
				goto('/objects');
			}, 2000);
		} catch (err: any) {
			error = err.message;
		} finally {
			publishing = false;
		}
	}

	async function unpublishService() {
		if (!confirm('Are you sure you want to unpublish this gRPC service?')) {
			return;
		}

		try {
			const response = await fetch(`/api/grpc/services/${data.proto.serviceName}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || 'Failed to unpublish service');
			}

			// Redirect back
			goto('/objects');
		} catch (err: any) {
			alert(`Error: ${err.message}`);
		}
	}
</script>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<!-- Page header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Publish gRPC Service</h1>
				<p class="mt-1 text-sm text-gray-600">
					{data.object.displayName || data.object.name}
				</p>
			</div>
			<a
				href="/objects"
				class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
			>
				← Back to Objects
			</a>
		</div>

		<!-- Status messages -->
		{#if error}
			<div class="p-4 bg-red-50 border border-red-200 rounded-md">
				<p class="text-sm text-red-800">❌ {error}</p>
			</div>
		{/if}

		{#if success && publishedServiceUrl}
			<div class="p-4 bg-green-50 border border-green-200 rounded-md">
				<p class="text-sm text-green-800 font-semibold mb-1">✅ Service Published Successfully!</p>
				<p class="text-xs text-green-700">Endpoint: <code class="bg-green-100 px-2 py-1 rounded">{publishedServiceUrl}</code></p>
				<p class="text-xs text-green-600 mt-2">Redirecting to objects list...</p>
			</div>
		{/if}

		<!-- Main content -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
			<!-- Info sidebar -->
			<aside class="lg:col-span-4 space-y-4">
				<div class="bg-white p-6 rounded-lg shadow">
					<h3 class="font-semibold mb-4">Object Information</h3>

					<dl class="space-y-3 text-sm">
						<div>
							<dt class="font-medium text-gray-700">Display Name</dt>
							<dd class="text-gray-900 mt-1">{data.object.displayName || data.object.name}</dd>
						</div>
						<div>
							<dt class="font-medium text-gray-700">Internal Name</dt>
							<dd class="text-gray-600 font-mono text-xs mt-1">{data.object.name}</dd>
						</div>
						<div>
							<dt class="font-medium text-gray-700">Fields</dt>
							<dd class="text-gray-900 mt-1">{data.object.fieldCount} fields</dd>
						</div>
						{#if data.object.description}
							<div>
								<dt class="font-medium text-gray-700">Description</dt>
								<dd class="text-gray-600 mt-1">{data.object.description}</dd>
							</div>
						{/if}
					</dl>
				</div>

				<div class="bg-white p-6 rounded-lg shadow">
					<h3 class="font-semibold mb-4">Service Details</h3>

					<dl class="space-y-3 text-sm">
						<div>
							<dt class="font-medium text-gray-700">Service Name</dt>
							<dd class="text-gray-900 font-mono text-xs mt-1">{data.proto.serviceName}</dd>
						</div>
						<div>
							<dt class="font-medium text-gray-700">Proto File</dt>
							<dd class="text-gray-900 font-mono text-xs mt-1">{data.proto.filename}</dd>
						</div>
						<div>
							<dt class="font-medium text-gray-700">Status</dt>
							<dd class="mt-1">
								{#if data.isPublished}
									<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Published</span>
								{:else}
									<span class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Not Published</span>
								{/if}
							</dd>
						</div>
					</dl>
				</div>

				<!-- Help card -->
				<div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
					<h3 class="font-semibold mb-2 text-blue-900">💡 What happens?</h3>
					<ol class="text-sm text-blue-800 space-y-2 list-decimal list-inside">
						<li>Proto file is generated from your object</li>
						<li>Service is registered on gRPC server</li>
						<li>CRUD operations become available</li>
						<li>Your object data is accessible via gRPC!</li>
					</ol>
				</div>
			</aside>

			<!-- Proto preview and actions -->
			<main class="lg:col-span-8">
				<div class="bg-white p-6 rounded-lg shadow space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Proto File Preview</h3>
						<div class="flex gap-2">
							<button
								on:click={() => navigator.clipboard.writeText(data.proto.content)}
								class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
							>
								📋 Copy
							</button>
							{#if data.isPublished}
								<button
									on:click={unpublishService}
									class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
								>
									Unpublish
								</button>
							{:else}
								<button
									on:click={publishService}
									disabled={publishing || success}
									class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
								>
									{#if publishing}
										<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Publishing...
									{:else if success}
										✅ Published!
									{:else}
										🚀 Publish Service
									{/if}
								</button>
							{/if}
						</div>
					</div>

					<div class="relative">
						<pre
							class="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm font-mono"
							style="max-height: 600px;"
						>{data.proto.content}</pre>
					</div>

					<!-- Service endpoints preview -->
					<div class="border-t pt-4">
						<h4 class="text-sm font-semibold text-gray-700 mb-2">Available Operations</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							<div class="px-3 py-2 bg-gray-50 rounded text-xs font-mono">
								✓ Create{data.object.name}
							</div>
							<div class="px-3 py-2 bg-gray-50 rounded text-xs font-mono">
								✓ Get{data.object.name}
							</div>
							<div class="px-3 py-2 bg-gray-50 rounded text-xs font-mono">
								✓ List{data.object.name}s
							</div>
							<div class="px-3 py-2 bg-gray-50 rounded text-xs font-mono">
								✓ Update{data.object.name}
							</div>
							<div class="px-3 py-2 bg-gray-50 rounded text-xs font-mono">
								✓ Delete{data.object.name}
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	</div>
</div>
