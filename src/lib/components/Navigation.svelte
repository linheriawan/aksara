<script lang="ts">
	export let user: { email: string; roles: string[] } | undefined = undefined;
</script>

<nav class="bg-gray-800 text-white">
	<div class="container mx-auto px-4">
		<div class="flex justify-between items-center h-16">
			<div class="flex items-center space-x-8">
				<a href="/" class="text-xl font-bold">Aksara Platform</a>

				{#if user}
					<div class="flex space-x-4">
						<a href="/datasources" class="hover:text-gray-300">Datasources</a>
						<a href="/objects" class="hover:text-gray-300">Objects</a>
						<a href="/apis" class="hover:text-gray-300">APIs</a>
						<a href="/uis" class="hover:text-gray-300">UIs</a>
						{#if user.roles.includes('admin')}
							<a href="/monitoring" class="hover:text-gray-300">Monitoring</a>
						{/if}
					</div>
				{/if}
			</div>

			<div class="flex items-center space-x-4">
				{#if user}
					<span class="text-sm text-gray-300">{user.email}</span>
					<form action="/api/auth/logout" method="POST" class="inline">
						<button
							type="submit"
							class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
						>
							Logout
						</button>
					</form>
				{:else}
					<a href="/login" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm">
						Login
					</a>
				{/if}
			</div>
		</div>
	</div>
</nav>

<style>
	/* Minimal inline styles for now */
</style>
