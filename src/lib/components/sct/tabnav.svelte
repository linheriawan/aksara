<!-- src/lib/components/TabNav.svelte -->
<script lang="ts">
  export let tabs: { id: string; label: string }[] = [];
  export let current = '';
  export let onSelect: (id: string) => void = () => {};
</script>
{#each tabs as tab}
  <button class="mt-1 px-2 border-1 border-b-0"
    class:border-grey-200={current === tab.id}
    class:bg-white={current === tab.id}
    class:bg-transparent={current !== tab.id}
    class:border-transparent={current !== tab.id}
    onclick={() => onSelect(tab.id)} >
    {tab.label}
  </button>
{/each}

