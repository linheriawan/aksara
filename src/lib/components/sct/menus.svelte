<script lang="ts">
import IconRenderer from '$lib/components/icons.svelte';
export let items;
</script>
<div class="grid-1n h-80">
    <div class="flex flex-col justify-center border-b">
        <h1 class="text-center">Modules </h1>
    </div>
    <div class="h-full overflow-scroll py-1">
        <div class="grid grid-cols-6 gap-2 mt-2">
{#each items as item}
    <a href="/{item.path}" class:dynamic={item.isDynamic} class="!flex !flex-col items-center bg-blue-300 hover:bg-green-300 border border-solid rounded-[10px] block !block p-0">
        <IconRenderer name="{item.icon}"/>
        <span> {item.name} </span>
    </a>
{/each}      
        </div>
    </div>
</div>
