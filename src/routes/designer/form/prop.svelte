<script lang="ts">
let {el}=$props()
import Inp from '$lib/components/inps.svelte';
import dat from './elprop.json';
let schema=JSON.parse(JSON.stringify(dat))

let definedProps = $derived((schema as Record<string, any>)[el.type]);
</script>
{#each Object.entries(definedProps) as [key, value]}
<Inp type="text" label={key} value={el.props[key]}></Inp>
{/each}
