<script lang="ts">
type FormElement = {
  type: 'Inp' | 'Select' | 'SctForm';
  props: Record<string, any>;
  children?: FormElement[];
};
type Schema = FormElement[];
import Prop from './prop.svelte';
import { writable } from 'svelte/store';
let schema = writable<Schema>([]);
export const selectedIndex = writable<number | null>(null);
import Inp from '$lib/components/inp/text.svelte';
import Select from '$lib/components/inp/select.svelte';
import SctForm from '$lib/components/sct/form.svelte';

import TabNav from '$lib/components/sct/tabnav.svelte';
import PanelRight from '$lib/components/sct/panelRight.svelte';
import PanelLeft from '$lib/components/sct/panelLeft.svelte';
const tabs=[{ id: 'canvas', label: 'Modules' },
      { id: 'code', label: 'View Code' },
      { id: 'profile', label: 'Profile' }];
let currentTab = $state('canvas');

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
function addprop(e:Event){
  e.preventDefault();
  const fd = new FormData(e.target as HTMLFormElement);
  const prop = fd.get('prop') as string;
  const i = fd.get('index') as string;
  $schema[i].props[prop] = "";
  (e.target as HTMLFormElement).reset();
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
function formatSchema(elements: FormElement[]): Record<string, any>[] {
    return elements.map(element => {
        const transformedContent: Record<string, any> = { ...element.props };

        if (element.children && element.children.length > 0) {
            transformedContent.children = formatSchema(element.children);
        } else {
            transformedContent.children = [];
        }

        const wrapper: Record<string, any> = {};
        wrapper[element.type] = transformedContent;
        return wrapper;
    });
}
export function toYAML(obj: any, indent = 0): string {
    const pad = '  '.repeat(indent);

    if (Array.isArray(obj)) {
        return obj.map(item => {
            if (typeof item === 'object' && item !== null && Object.keys(item).length === 1) {
                const key = Object.keys(item)[0];
                const value = item[key];
                // Assuming keys like 'Inp', 'Select', 'SctForm' are always at this level
                return `${pad}- ${key}:\n${toYAML(value, indent + 1)}`;
            }
            // Fallback for other array items (though less likely with your schema)
            return `${pad}- ${typeof item === 'object' ? '\n' + toYAML(item, indent + 1) : JSON.stringify(item)}`;
        }).join('\n');
    } else if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj).map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
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
<style>
  @import 'tailwindcss';
  .el_wrap{ @apply border border-dashed p-1 m-1 cursor-pointer hover:border-blue-500;
  &.current_el{ @apply bg-blue-100;}
  }
</style>
<TabNav {tabs} current={currentTab} onSelect={(id) => currentTab = id} />
<hr class="mb-1">
{#if currentTab === 'canvas'}
<div class="grid gap-1" style="grid-template-columns:auto 3fr 1fr auto">
  <PanelLeft name="Palette" width={100} isPinned={true}>
  <div class="grid gap-1 p-2">
    <button class="border" onclick={() => addElement('Inp')}>Input</button>
    <button class="border" onclick={() => addElement('Select')}>Select</button>
  </div>
  </PanelLeft>
  <!-- Form Canvas -->
  <div class="border rounded-sm p-1 bg-white">
    {#each $schema as node, i}
      <div role="none" class="el_wrap {$selectedIndex===i?"current_el":""}" onclick={() => selectedIndex.set(i)}>
        <svelte:component this={getComponent(node.type)} {...node.props} />
      </div>
    {/each}
  </div>
  <!-- Schema -->
  <pre class="grid border p-2 bg-black text-white">{toYAML(formatSchema($schema))} </pre>
  <PanelRight isPinned={true}>
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
      <form onsubmit={addprop} class="flex items-center gap-1">
      <Prop el={$schema[$selectedIndex].type}/>
      <Inp label="Properties" name="prop" />
      <input type="hidden" name="index" value={$selectedIndex} />
      <button type="submit" class="border rounded-md">+</button>
      </form>
    </div>
    {/if}
  </PanelRight>
</div>
{:else if currentTab === 'code'}
  <!-- Code tab (optional) -->
  <pre class=" bg-black text-white w-full border p-2">{renderSvelteCode($schema)}</pre>
{/if}
