<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>API Documentation - Available APIs</title>
</svelte:head>

<div class="w-full px-4 py-8 md:px-6 lg:px-8">
	<div class="space-y-6">
		<!-- Header -->
		<div>
			<h1 class="text-3xl font-bold text-gray-900">API Documentation</h1>
			<p class="text-gray-600 mt-1">Explore available REST APIs and their contracts</p>
		</div>

		<!-- Public APIs -->
		<div class="bg-white rounded-lg shadow">
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center space-x-2">
					<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						></path>
					</svg>
					<h2 class="text-xl font-semibold text-gray-900">Public APIs</h2>
					<span class="text-sm text-gray-500">No authentication required</span>
				</div>
			</div>

			<div class="p-6">
				{#if data.publicApis.length > 0}
					<div class="space-y-3">
						{#each data.publicApis as api}
							<a
								href="/api/v1/docs/{api.name}"
								class="block p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
							>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-3">
											<h3 class="font-semibold text-gray-900">{api.displayName}</h3>
											<span
												class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
											>
												Public
											</span>
										</div>
										{#if api.description}
											<p class="text-sm text-gray-600 mt-1">{api.description}</p>
										{/if}
										<div class="flex items-center space-x-2 mt-2">
											<code class="text-xs bg-gray-100 px-2 py-1 rounded"
												>/api/v1/{api.name}</code
											>
											<div class="flex gap-1">
												{#each api.methods as method}
													<span
														class="text-xs px-2 py-0.5 rounded font-mono {method === 'GET'
															? 'bg-green-100 text-green-800'
															: method === 'POST'
																? 'bg-blue-100 text-blue-800'
																: method === 'PUT' || method === 'PATCH'
																	? 'bg-yellow-100 text-yellow-800'
																	: 'bg-red-100 text-red-800'}"
													>
														{method}
													</span>
												{/each}
											</div>
										</div>
									</div>
									<svg
										class="w-5 h-5 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										></path>
									</svg>
								</div>
							</a>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-gray-500">
						<svg
							class="w-12 h-12 mx-auto text-gray-400 mb-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							></path>
						</svg>
						<p>No public APIs available</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Private APIs (only shown when authenticated) -->
		{#if data.isAuthenticated && data.privateApis.length > 0}
			<div class="bg-white rounded-lg shadow">
				<div class="p-6 border-b border-gray-200">
					<div class="flex items-center space-x-2">
						<svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
								clip-rule="evenodd"
							></path>
						</svg>
						<h2 class="text-xl font-semibold text-gray-900">Your Private APIs</h2>
						<span class="text-sm text-gray-500">Authentication required</span>
					</div>
				</div>

				<div class="p-6">
					<div class="space-y-3">
						{#each data.privateApis as api}
							<a
								href="/api/v1/docs/{api.name}"
								class="block p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
							>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-3">
											<h3 class="font-semibold text-gray-900">{api.displayName}</h3>
											<span
												class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
											>
												Private
											</span>
										</div>
										{#if api.description}
											<p class="text-sm text-gray-600 mt-1">{api.description}</p>
										{/if}
										<div class="flex items-center space-x-2 mt-2">
											<code class="text-xs bg-gray-100 px-2 py-1 rounded"
												>/api/v1/{api.name}</code
											>
											<div class="flex gap-1">
												{#each api.methods as method}
													<span
														class="text-xs px-2 py-0.5 rounded font-mono {method === 'GET'
															? 'bg-green-100 text-green-800'
															: method === 'POST'
																? 'bg-blue-100 text-blue-800'
																: method === 'PUT' || method === 'PATCH'
																	? 'bg-yellow-100 text-yellow-800'
																	: 'bg-red-100 text-red-800'}"
													>
														{method}
													</span>
												{/each}
											</div>
										</div>
									</div>
									<svg
										class="w-5 h-5 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										></path>
									</svg>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Getting Started -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
			<h3 class="font-semibold text-blue-900 mb-3">🚀 Getting Started</h3>
			<div class="space-y-2 text-sm text-blue-800">
				<p>All APIs follow REST conventions and return JSON responses.</p>
				<div class="mt-4">
					<div class="font-semibold mb-2">Base URL:</div>
					<code class="block bg-white px-3 py-2 rounded border border-blue-300"
						>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/v1</code
					>
				</div>
				<div class="mt-4">
					<div class="font-semibold mb-2">Common Features:</div>
					<ul class="list-disc list-inside space-y-1 ml-2">
						<li>Pagination: <code class="bg-white px-1 rounded">?page=1&limit=20</code></li>
						<li>Sorting: <code class="bg-white px-1 rounded">?sort=-field</code></li>
						<li>
							Filtering: <code class="bg-white px-1 rounded">?filter[field][operator]=value</code>
						</li>
						<li>Export: <code class="bg-white px-1 rounded">?format=csv</code> or ndjson</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
