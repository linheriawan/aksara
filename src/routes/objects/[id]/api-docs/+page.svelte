<script lang="ts">
	import type { PageData } from './$types';
	import RestApiTab from '$lib/components/api-docs/RestApiTab.svelte';
	import GrpcApiTab from '$lib/components/api-docs/GrpcApiTab.svelte';

	let { data }: { data: PageData } = $props();

	// Active tab state
	let activeTab = $state('rest');

	// Get enabled protocols with metadata
	const enabledProtocols = $derived(() => {
		const protocols: Array<{ id: string; name: string; color: string; enabled: boolean }> = [
			{
				id: 'rest',
				name: 'REST API',
				color: 'blue',
				enabled: data.object.publishing?.protocols?.rest?.enabled || false
			},
			{
				id: 'grpc',
				name: 'gRPC',
				color: 'purple',
				enabled: data.object.publishing?.protocols?.grpc?.enabled || false
			},
			{
				id: 'graphql',
				name: 'GraphQL',
				color: 'pink',
				enabled: data.object.publishing?.protocols?.graphql?.enabled || false
			},
			{
				id: 'websocket',
				name: 'WebSocket',
				color: 'green',
				enabled: data.object.publishing?.protocols?.websocket?.enabled || false
			},
			{
				id: 'mqtt',
				name: 'MQTT',
				color: 'orange',
				enabled: data.object.publishing?.protocols?.mqtt?.enabled || false
			},
			{
				id: 'soap',
				name: 'SOAP',
				color: 'indigo',
				enabled: data.object.publishing?.protocols?.soap?.enabled || false
			}
		];

		// Set active tab to first enabled protocol
		if (typeof window !== 'undefined') {
			const firstEnabled = protocols.find((p) => p.enabled);
			if (firstEnabled && activeTab === 'rest' && !protocols[0].enabled) {
				activeTab = firstEnabled.id;
			}
		}

		return protocols;
	});

	const hasAnyProtocol = $derived(() => enabledProtocols().some((p) => p.enabled));
</script>

<svelte:head>
	<title>API Documentation - {data.object.displayName}</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<!-- Header -->
		<div>
			<nav class="flex mb-4 text-sm text-gray-600">
				<a href="/objects" class="hover:text-blue-600">Objects</a>
				<span class="mx-2">/</span>
				<span class="text-gray-900">{data.object.displayName}</span>
				<span class="mx-2">/</span>
				<span class="text-gray-900">API Documentation</span>
			</nav>

			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">{data.object.displayName} API</h1>
					<p class="text-gray-600 mt-1">API contract and documentation</p>
				</div>
				<div class="flex space-x-2">
					{#if data.object.status === 'enabled'}
						<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
							✓ Published
						</span>
					{:else}
						<span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
							Not Published
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Status Notice -->
		{#if !hasAnyProtocol}
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<div class="flex items-start space-x-3">
					<svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						></path>
					</svg>
					<div class="text-sm text-yellow-800">
						<p class="font-semibold">No protocols enabled</p>
						<p class="mt-1">
							Enable at least one protocol from <a
								href="/objects"
								class="underline hover:text-yellow-900">Objects</a
							> page to publish the API.
						</p>
					</div>
				</div>
			</div>
		{:else}
			<!-- Protocol Tabs -->
			<div class="bg-white rounded-lg shadow overflow-hidden">
				<!-- Tab Headers -->
				<div class="border-b border-gray-200 bg-gray-50">
					<nav class="flex -mb-px overflow-x-auto" aria-label="Tabs">
						{#each enabledProtocols() as protocol}
							{#if protocol.enabled}
								<button
									onclick={() => (activeTab = protocol.id)}
									class="
										whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm
										{activeTab === protocol.id
											? `border-${protocol.color}-600 text-${protocol.color}-700 bg-white`
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
									"
								>
									<span class="flex items-center gap-2">
										{protocol.name}
										<span
											class="px-2 py-0.5 text-xs rounded-full bg-{protocol.color}-100 text-{protocol.color}-700"
										>
											Enabled
										</span>
									</span>
								</button>
							{/if}
						{/each}
					</nav>
				</div>

				<!-- Tab Panels -->
				<div class="p-6">
					<!-- REST API Tab -->
					{#if activeTab === 'rest'}
						<RestApiTab data={data.object} />
					{/if}

					<!-- gRPC API Tab -->
					{#if activeTab === 'grpc'}
						<GrpcApiTab data={data.object} />
					{/if}

					<!-- Placeholder for other protocols -->
					{#if activeTab === 'graphql'}
						<div class="text-center py-12 text-gray-500">
							<p class="text-lg font-medium">GraphQL API</p>
							<p class="text-sm mt-2">Documentation coming in Phase 6</p>
						</div>
					{/if}

					{#if activeTab === 'websocket'}
						<div class="text-center py-12 text-gray-500">
							<p class="text-lg font-medium">WebSocket API</p>
							<p class="text-sm mt-2">Documentation coming in Phase 6</p>
						</div>
					{/if}

					{#if activeTab === 'mqtt'}
						<div class="text-center py-12 text-gray-500">
							<p class="text-lg font-medium">MQTT API</p>
							<p class="text-sm mt-2">Documentation coming in Phase 6</p>
						</div>
					{/if}

					{#if activeTab === 'soap'}
						<div class="text-center py-12 text-gray-500">
							<p class="text-lg font-medium">SOAP API</p>
							<p class="text-sm mt-2">Documentation coming in Phase 8</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
