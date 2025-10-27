<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	let selectedObjectId = '';
	let generating = false;
	let publishing = false;
	let protoPreview = '';
	let error = '';
	let success = false;
	let publishedServiceUrl = '';

	$: selectedObject = data.objects.find((o) => o.id === selectedObjectId);

	async function generateProtoPreview() {
		if (!selectedObjectId) {
			error = 'Please select an object';
			return;
		}

		generating = true;
		error = '';
		protoPreview = '';

		try {
			const response = await fetch(`/api/grpc/preview`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ objectDefinitionId: selectedObjectId })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to generate proto preview');
			}

			protoPreview = result.data.protoContent;
		} catch (err: any) {
			error = err.message;
		} finally {
			generating = false;
		}
	}

	async function publishService() {
		if (!selectedObjectId) {
			error = 'Please select an object';
			return;
		}

		publishing = true;
		error = '';
		success = false;

		try {
			const response = await fetch(`/api/grpc/publish`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ objectDefinitionId: selectedObjectId })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to publish gRPC service');
			}

			success = true;
			publishedServiceUrl = result.data.serviceUrl;
			protoPreview = result.data.protoContent;

			// Redirect to services list after 2 seconds
			setTimeout(() => {
				goto('/apis/grpc');
			}, 2000);
		} catch (err: any) {
			error = err.message;
		} finally {
			publishing = false;
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
					Generate and publish a gRPC service from your business object
				</p>
			</div>
			<a
				href="/apis/grpc"
				class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
			>
				← Back to Services
			</a>
		</div>

		<!-- Main form -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
			<!-- Configuration sidebar -->
			<aside class="lg:col-span-4 space-y-4">
				<div class="bg-white p-6 rounded-lg shadow">
					<h3 class="font-semibold mb-4">Configuration</h3>

					<div class="space-y-4">
						<!-- Select Object -->
						<div>
							<label for="object" class="block text-sm font-medium text-gray-700 mb-1">
								Select Object
							</label>
							<select
								id="object"
								bind:value={selectedObjectId}
								on:change={generateProtoPreview}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="">-- Select Object --</option>
								{#each data.objects as obj}
									<option value={obj.id}>
										{obj.displayName || obj.name} ({obj.fieldCount} fields)
									</option>
								{/each}
							</select>
						</div>

						{#if selectedObject}
							<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
								<h4 class="font-semibold text-blue-900 mb-2">Object Info</h4>
								<dl class="space-y-1 text-sm text-blue-800">
									<div>
										<dt class="inline font-medium">Name:</dt>
										<dd class="inline ml-1">{selectedObject.displayName || selectedObject.name}</dd>
									</div>
									<div>
										<dt class="inline font-medium">Fields:</dt>
										<dd class="inline ml-1">{selectedObject.fieldCount}</dd>
									</div>
									{#if selectedObject.description}
										<div>
											<dt class="inline font-medium">Description:</dt>
											<dd class="inline ml-1">{selectedObject.description}</dd>
										</div>
									{/if}
								</dl>
							</div>
						{/if}
					</div>
				</div>

				<!-- Help card -->
				<div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
					<h3 class="font-semibold mb-2 text-blue-900">💡 How it works</h3>
					<ol class="text-sm text-blue-800 space-y-2 list-decimal list-inside">
						<li>Select a business object</li>
						<li>Preview the generated .proto file</li>
						<li>Click "Publish Service"</li>
						<li>Your gRPC service will be live!</li>
					</ol>
				</div>
			</aside>

			<!-- Proto preview and publish -->
			<main class="lg:col-span-8">
				<div class="bg-white p-6 rounded-lg shadow space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Proto File Preview</h3>
						{#if protoPreview}
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

					{#if error}
						<div class="p-4 bg-red-50 border border-red-200 rounded-md">
							<p class="text-sm text-red-800">❌ {error}</p>
						</div>
					{/if}

					{#if success && publishedServiceUrl}
						<div class="p-4 bg-green-50 border border-green-200 rounded-md">
							<p class="text-sm text-green-800 font-semibold mb-1">✅ Service Published Successfully!</p>
							<p class="text-xs text-green-700">Endpoint: <code class="bg-green-100 px-2 py-1 rounded">{publishedServiceUrl}</code></p>
							<p class="text-xs text-green-600 mt-2">Redirecting to services list...</p>
						</div>
					{/if}

					{#if protoPreview}
						<div class="relative">
							<pre
								class="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm font-mono"
								style="max-height: 600px;"
							>{protoPreview}</pre>
							<button
								on:click={() => navigator.clipboard.writeText(protoPreview)}
								class="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-gray-200 text-xs rounded hover:bg-gray-600"
							>
								Copy
							</button>
						</div>
					{:else if generating}
						<div class="flex items-center justify-center py-12">
							<div class="flex items-center gap-3">
								<svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<span class="text-gray-600">Generating proto file...</span>
							</div>
						</div>
					{:else}
						<div class="flex items-center justify-center py-12 text-gray-500">
							<div class="text-center">
								<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
								</svg>
								<p class="mt-2 text-sm">Select an object to preview the proto file</p>
							</div>
						</div>
					{/if}
				</div>
			</main>
		</div>
	</div>
</div>
