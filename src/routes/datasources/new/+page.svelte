<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Create Datasource - Aksara Platform</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-3xl">
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-8">
		<div class="text-center">
			<svg
				class="mx-auto h-16 w-16 text-blue-600"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 10V3L4 14h7v7l9-11h-7z"
				/>
			</svg>
			<h2 class="mt-4 text-2xl font-bold text-gray-900">Create a Datasource</h2>
			<p class="mt-2 text-gray-600">
				To create a datasource, you need to first have a connection to a database server.
			</p>
		</div>

		<div class="mt-8 space-y-6">
			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-3">📋 What is a Datasource?</h3>
				<p class="text-gray-600 mb-4">
					A <strong>Datasource</strong> represents a specific database on a connection. For example:
				</p>
				<ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
					<li><strong>Connection:</strong> Production MySQL Server (server credentials)</li>
					<li class="ml-6">
						<strong>Datasource 1:</strong> customers_db (database on that server)
					</li>
					<li class="ml-6">
						<strong>Datasource 2:</strong> products_db (another database on same server)
					</li>
				</ul>
			</div>

			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-3">🚀 How to Create a Datasource</h3>
				<div class="space-y-4">
					<div class="flex items-start">
						<span
							class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-3"
						>
							1
						</span>
						<div class="flex-1">
							<h4 class="font-medium text-gray-900">Create or Select a Connection</h4>
							<p class="text-sm text-gray-600 mt-1">
								Go to Connections page and create a new connection or select an existing one
							</p>
							<button
								onclick={() => goto('/connections')}
								class="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
							>
								→ Go to Connections
							</button>
						</div>
					</div>

					<div class="flex items-start">
						<span
							class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-3"
						>
							2
						</span>
						<div class="flex-1">
							<h4 class="font-medium text-gray-900">Register a Database</h4>
							<p class="text-sm text-gray-600 mt-1">
								Click on a connection, then register an existing database or create a new one
							</p>
						</div>
					</div>

					<div class="flex items-start">
						<span
							class="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold mr-3"
						>
							✓
						</span>
						<div class="flex-1">
							<h4 class="font-medium text-gray-900">Done!</h4>
							<p class="text-sm text-gray-600 mt-1">
								Your datasource is ready. You can now browse its schema and run queries.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-8 flex justify-center space-x-4">
			<button
				onclick={() => goto('/connections')}
				class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
			>
				Go to Connections
			</button>
			<button
				onclick={() => goto('/datasources')}
				class="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				View Existing Datasources
			</button>
		</div>
	</div>
</div>
