<script lang="ts">
import dat from './elprop.json';
let schema=JSON.parse(JSON.stringify(dat))
let {el}=$props()
let element=$state((schema as Record<string, any>)[el])
let rel=$state(el)
</script>
<div>
{#if rel === "Inp"}
    {#each Object.entries(element) as [key, value]}
    {key} {value}
    {/each}
{:else if rel === "Select"}
    {#each Object.entries(element) as [key, value]}
    {key} {value}
    {/each}
{:else if rel === "Sct"}
    {#each Object.entries(element) as [key, value]}
    {key} {value}
    {/each}
{:else}
    NONE
{/if}
</div>