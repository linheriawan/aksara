<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let isLoading = $state(false);
</script>

<div class="min-h-[80vh] flex items-center justify-center">
	<div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">Aksara Platform</h1>
		<p class="text-gray-600 mb-8">Sign in to your account</p>

		{#if form?.error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				isLoading = true;
				return async ({ update }) => {
					await update();
					isLoading = false;
				};
			}}
		>
			<div class="mb-4">
				<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
					Email Address
				</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="admin@aksara.local"
				/>
			</div>

			<div class="mb-6">
				<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
					Password
				</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={isLoading}
				class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded transition-colors"
			>
				{isLoading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>

		<div class="mt-6 text-sm text-gray-600">
			<p>Default admin credentials:</p>
			<p class="font-mono text-xs mt-2">
				Email: admin@aksara.local<br />
				Password: admin123
			</p>
		</div>
	</div>
</div>
