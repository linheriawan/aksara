<script lang="ts">
type FormElement = {
  type: 'Inp' | 'Select' | 'SctForm';
  props: Record<string, any>;
  children?: FormElement[];
};
import { writable } from 'svelte/store';
let schema = writable<FormElement[]>([]);
export const selectedIndex = writable<number | null>(null);
import Inp from '$lib/components/inp/text.svelte';
import Select from '$lib/components/inp/select.svelte';
import SctForm from '$lib/components/sct/form.svelte';

function getComponent(type: string) {
  switch (type) {
    case 'Inp': return Inp;
    case 'Select': return Select;
    case 'SctForm': return SctForm;
  }
}
function addElement(type: FormElement['type']) {
  schema.update(s => [...s, { type, props: {}, children: [] }]);
}
function renderSvelteCode(schema: FormElement[], indent = 0): string {
  const pad = '  '.repeat(indent);
  return schema.map((node) => {
    const { type, props = {}, children = [] } = node;
    const propStr = Object.entries(props)
      .map(([key, value]) =>
        typeof value === 'string'
          ? `${key}="${value}"`
          : `{${JSON.stringify(value)}}`
      )
      .join(' ');

    const openTag = `<${type} ${propStr}>`;
    const closeTag = `</${type}>`;

    if (children.length > 0) {
      return `${pad}${openTag}\n${renderSvelteCode(children, indent + 1)}\n${pad}${closeTag}`;
    } else {
      return `${pad}${openTag}${closeTag}`;
    }
  }).join('\n');
}
export function toYAML(obj: any, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (Array.isArray(obj)) {
    return obj.map(item => `${pad}- ${typeof item === 'object' ? '\n' + toYAML(item, indent + 1) : item}`).join('\n');
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${pad}${key}:\n${toYAML(value, indent + 1)}`;
      } else {
        return `${pad}${key}: ${JSON.stringify(value)}`;
      }
    }).join('\n');
  } else {
    return `${pad}${JSON.stringify(obj)}`;
  }
}

</script>
<div class="grid gap-2" style="grid-template-columns:1fr 3fr 6fr 4fr">
  <!-- Palette -->
  <div class="grid border gap-1 p-2">
    <button class="border" on:click={() => addElement('Inp')}>Input</button>
    <button class="border" on:click={() => addElement('Select')}>Select</button>
  </div>
  <!-- Schema -->
  <div class="grid border p-2"> {toYAML($schema)} </div>
  <!-- Form Canvas -->
  <div class="grid border">
    {#each $schema as node, i}
      <div class="border p-1" on:click={() => selectedIndex.set(i)}>
        <svelte:component this={getComponent(node.type)} {...node.props} />
      </div>
    {/each}
  </div>
  <!-- Code tab (optional) -->
  <div class="grid border p-2"> <pre>{renderSvelteCode($schema)}</pre> </div>
</div>
<!-- Bottom-left or sidebar -->
{#if $selectedIndex !== null}
  <div class="grid border p-2 gap-1">
    <h4 class="font-bold">Edit {$schema[$selectedIndex].type}</h4>
    {#each Object.keys($schema[$selectedIndex].props) as key}
      <label class="text-xs">
        {key}
        <input
          class="border px-1"
          type="text"
          bind:value={$schema[$selectedIndex].props[key]}
        />
      </label>
    {/each}
    <!-- Optional: add new property -->
    <button on:click={() => $schema[$selectedIndex].props['newProp'] = ''}>+ Prop</button>
  </div>
{/if}