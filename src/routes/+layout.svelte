<script lang="ts">
  import BasicLayout from '$lib/layouts/basicLayout.svelte';
  import FloatingLayout from '$lib/layouts/floatLayout.svelte';
  import EditorLayout from '$lib/layouts/editorLayout.svelte';

  let {data,children}=$props();
  let CurrentLayout = $state<typeof BasicLayout | null>(null);

  $effect(() => {
    if (data.layout === 'floating') {
      CurrentLayout = FloatingLayout;
    } else if (data.layout === 'editor') {
      CurrentLayout = EditorLayout;
    } else if (data.layout === 'classic') {
      CurrentLayout = BasicLayout;
    } else {
      CurrentLayout = null;
    }
  });
</script>
{#if CurrentLayout}
  <CurrentLayout {...data.app}>
    {@render children()}
  </CurrentLayout>
{:else}
  {@render children()}
{/if}
