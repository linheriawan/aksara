<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navigation from '$lib/components/Navigation.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Navigation user={data.user} />

	<main>
		{@render children?.()}
	</main>
</div>
