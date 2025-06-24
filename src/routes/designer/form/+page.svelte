<script lang="ts">
import "./style.css"
import type {FormElement,Schema,DraggedItem,DropZone} from "./utils.ts"
import { cloneData, 
  getElementByPath, 
  moveElement, insertElementAtPath, removeElementByPath, 
  addElementProperty, updateElementProperty, 
  generateId, isPathEqual,
  generateSvelteCode,
  schemaToYaml, yamlToSchema, schemaToJson, jsonToSchema, SchemaManager
} from "./utils.ts"
import CodeView from "./CodeView.svelte"
import SchemaView from "./SchemaView.svelte"
import ElementRenderer from './ElementRenderer.svelte';
// Imports
import dat from './elprop.json';
import type { Component } from 'svelte';
import { writable } from 'svelte/store';
import Inp from '$lib/components/inps.svelte';
import SctForm from '$lib/components/sct/form.svelte';
import TabNav from '$lib/components/sct/tabnav.svelte';
import PanelRight from '$lib/components/sct/panelRight.svelte';
import PanelLeft from '$lib/components/sct/panelLeft.svelte';

// Constants
let TABS = [
  { id: 'canvas', label: 'Builder' },
  { id: 'code', label: 'View Code' }
];

const PALETTE_ITEMS = [
  { label: 'Div', icon: '📦', type: 'div', inputType: 'div' },
  { label: 'Input', icon: '📝', type: 'Inp', inputType: 'Text' },
  { label: 'Select', icon: '📋', type: 'Inp', inputType: 'Select' },
  { label: 'Sct Form', icon: '📋', type: 'SctForm', inputType: 'SctForm' }
] as const;

const NESTABLE_TYPES = new Set(['div', 'SctForm']);
const COMPONENT_MAP: Record<string, Component> = {
  'SctForm': SctForm,
  'Inp': Inp
};
const getComponent = (type: string): Component | false => {
  return COMPONENT_MAP[type] || false;
};

// State
const definedProps = cloneData(dat) as Record<string, any>;
const schema = writable<Schema>([]);
const schemaManager = new SchemaManager();

// Subscribe to schema manager updates
schemaManager.subscribe((newSchema) => {
  schema.set(newSchema);
});

let selectedIndex = $state<number | null>(null);
let selectedPath = $state<number[]>([]);
let currentTab = $state<string>('canvas');
let draggedItem = $state<DraggedItem|null>(null);
let dropZone = $state<DropZone|null>(null);
let dragCounter = 0;

// Derived values
const formattedPath = $derived(() => {
  if (!dropZone?.path?.length) return '';
  const pathSegments: string[] = [];
  for (let i = 0; i < dropZone.path.length; i++) {
    const element = getElementByPath($schema, dropZone.path.slice(0, i + 1));
    pathSegments.push(element?.type || '[Not Found]');
    if (!element) break;
  }
  return pathSegments.join('→');
});

// Utility functions
const createNewElement = (type: FormElement['type'], inputType?: string): FormElement => {
  const typeDefinition = definedProps[inputType ?? type];
  const newElement: FormElement = { 
    type, 
    props: {}, 
    _id: generateId() 
  };
  
  if (typeDefinition) {
    if (typeDefinition.nesting && Array.isArray(typeDefinition.nesting)) {
      newElement.nesting = cloneData(typeDefinition.nesting);
    }
    
    Object.entries(typeDefinition).forEach(([key, value]) => {
      if (key !== 'nesting') {
        newElement.props[key] = cloneData(value);
      }
    });
  }
  
  // Set the type prop for Inp components
  if (type === 'Inp' && inputType) {
    newElement.props.type = inputType;
    // Initialize value to avoid binding issues
    newElement.props.value = "";
  }
  
  return newElement;
};

// Event handlers
const addElement = (type: FormElement['type'], inputType?: string) => {
  const newElement = createNewElement(type, inputType);
  schemaManager.insertElement([], 'after', newElement);
};

const handlePaletteDragStart = (e: DragEvent, type: FormElement['type'], inputType?: string) => {
  draggedItem = { type, isNew: true, inputType };
  e.dataTransfer!.effectAllowed = 'copy';
};

const handleElementDragStart = (e: DragEvent, element: FormElement, path: number[]) => {
  let inputType = element.type === "Inp" ? element.props.type : element.type;
  draggedItem = { type: element.type, isNew: false, element, path, inputType };
  e.dataTransfer!.effectAllowed = 'move';
  e.stopPropagation();
};

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault();
  dragCounter++;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;
  target.classList.remove('drag-hover');
  dragCounter--;
  if (dragCounter === 0) dropZone = null;
};

const handleDragOver = (e: DragEvent, path: number[], canNest: boolean = false) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!draggedItem) return;
  
  // Handle root level drops (empty schema)
  if (!path.length) {
    dropZone = { path: [], position: 'after' };
    e.dataTransfer!.dropEffect = draggedItem.isNew ? 'copy' : 'move';
    return;
  }
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  const relativeY = y / height;
  
  // Determine drop position
  if (canNest && relativeY >= 0.25 && relativeY <= 0.75) {
    dropZone = { path, position: 'inside' };
  } else if (relativeY < 0.25) {
    dropZone = { path, position: 'before' };
  } else {
    dropZone = { path, position: 'after' };
  }
  
  // Set consistent dropEffect - always use copy for new items, move for existing
  e.dataTransfer!.dropEffect = draggedItem.isNew ? 'copy' : 'move';
  
  // Add visual feedback
  (e.currentTarget as HTMLElement).classList.add('drag-hover');
};

// Fixed handleDrop function
const handleDrop = (e: DragEvent) => {
  e.stopPropagation();
  e.preventDefault();
  console.log('Drop triggered:', { draggedItem, dropZone });
  if (!draggedItem || !dropZone) {
    console.log('Missing draggedItem or dropZone');
    return;
  }
  try {
    if (draggedItem.isNew) {
      // Adding new element
      console.log(`Adding new ${draggedItem.type} at ${dropZone.position} position`);
      const newElement = createNewElement(draggedItem.type, draggedItem.inputType);
      schemaManager.insertElement(dropZone.path, dropZone.position, newElement);
    } else {
      // Moving existing element
      console.log(`Moving ${draggedItem.type} from ${draggedItem.path?.join('→')} to ${dropZone.position} at ${dropZone.path.join('→')}`);
      schemaManager.moveElement(draggedItem.path!, dropZone.path, dropZone.position);
    }
  } catch (error) {
    console.error('Drop operation failed:', error);
  }
  
  // Clean up drag state and visual feedback
  const dragHoverElements = document.querySelectorAll('.drag-hover');
  dragHoverElements.forEach(el => el.classList.remove('drag-hover'));
  
  // Reset drag state
  draggedItem = null;
  dropZone = null;
  dragCounter = 0;
  console.log('Drop completed');
};

// Also add this helper function to ensure proper event handling
const handleDragEnd = (e: DragEvent) => {
  // Clean up any remaining drag state
  const dragHoverElements = document.querySelectorAll('.drag-hover');
  dragHoverElements.forEach(el => el.classList.remove('drag-hover'));
  draggedItem = null;
  dropZone = null;
  dragCounter = 0;
};

const selectElement = (path: number[]) => {
  selectedPath = path;
  selectedIndex = path.length === 1 ? path[0] : null;
};

const addProperty = (e: Event) => {
  e.preventDefault();
  const formData = new FormData(e.target as HTMLFormElement);
  const prop = formData.get('prop') as string;
  const pathStr = formData.get('path') as string;
  if (!prop.trim()) return;
  
  const path = JSON.parse(pathStr);
  schemaManager.addProperty(path, prop);
  (e.target as HTMLFormElement).reset();
};

const updateProperty = (path: number[], key: string, value: any) => {
  schemaManager.updateProperty(path, key, value);
};

const deleteElement = () => {
  schemaManager.removeElement(selectedPath);
  selectedPath = [];
  selectedIndex = null;
};

// Export/Import functions
const exportYaml = () => {
  const yamlString = schemaToYaml($schema);
  const blob = new Blob([yamlString], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'form-schema.yaml';
  a.click();
  URL.revokeObjectURL(url);
};

const importYaml = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const yamlString = e.target?.result as string;
    const importedSchema = yamlToSchema(yamlString);
    schemaManager.setSchema(importedSchema);
  };
  reader.readAsText(file);
};

const exportJson = () => {
  const jsonString = schemaToJson($schema);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'form-schema.json';
  a.click();
  URL.revokeObjectURL(url);
};

const importJson = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const jsonString = e.target?.result as string;
    const importedSchema = jsonToSchema(jsonString);
    schemaManager.setSchema(importedSchema);
  };
  reader.readAsText(file);
};
</script>
<div class="flex justify-between pt-1">
  <div>
    <TabNav tabs={TABS} current={currentTab} onSelect={(id) => currentTab = id} />
  </div>
  <div>
    <button onclick={exportYaml} class="btn border rounded-md p-1 text-xs">📤 Export YAML</button>
    <button onclick={exportJson} class="btn border rounded-md p-1 text-xs">📤 Export JSON</button>
  </div>
</div>
<hr class="mb-1">

{#if currentTab === 'canvas'}

<div class="grid gap-1" style="grid-template-columns:auto 3fr 1fr auto">
  <PanelLeft name="Palette" width={100} isPinned={true}>
    <div class="grid gap-1 p-2">
      {#each PALETTE_ITEMS as item}
        <div role="button" tabindex="0"
          draggable="true" class="palette-item"
          ondragstart={(e) => handlePaletteDragStart(e, item.type, item.inputType)}
          onclick={() => addElement(item.type, item.inputType)}
          onkeydown={(e) => e.key === 'Enter' && addElement(item.type, item.inputType)} >
          {item.icon} {item.label}
        </div>
      {/each}
    </div>
  </PanelLeft>

  <!-- Form Canvas -->
  <div class="relative"> 
  <div class="absolute top-0 w-full text-center bg-black/30 text-white">
    {draggedItem?.type}:{draggedItem?.path?.join('→') || 'new'} into { dropZone?.position} {formattedPath()}
  </div>
  <div role="main" class="canvas-container"
    ondrop={handleDrop}
    ondragover={(e) => handleDragOver(e, [])}
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave} >
    {#if $schema.length === 0}
      <div class="empty-state">
        Drag components from the palette to start building your form
      </div>
    {/if}
    {#each $schema as node, i}
      <ElementRenderer 
        {node}
        path={[i]}
        {selectedPath}
        {handleElementDragStart}
        {handleDragOver}
        {handleDragEnter}
        {handleDragLeave}
        {handleDragEnd}
        {selectElement} />
    {/each}
    
  </div>
  </div>
  <SchemaView schema={$schema} />
  <PanelRight isPinned={true}>
    {#if selectedPath.length < 1}
      <div class="p-4 text-gray-500 text-sm">
        Select an element to edit its properties
      </div>
    {:else}
      {@const selectedElement = getElementByPath($schema, selectedPath)}
      {#if selectedElement}
        <div class="grid border p-2 gap-1">
          <h4 class="font-bold">
            Edit {selectedElement.type} ({selectedPath.join(' → ')})
          </h4>
          
          {#each Object.entries(selectedElement.props) as [key, value]}
            <Inp type="text" label={key} 
              bind:value={selectedElement.props[key]}
              input={(e) => updateProperty(selectedPath, key, e.detail)} />
          {/each}
          
          <!-- Add new property -->
          <form onsubmit={addProperty} class="flex items-center gap-1">
            <Inp type="text" label="New Props" name="prop" value="" />
            <input type="hidden" name="path" value={JSON.stringify(selectedPath)} />
            <button type="submit" class="border rounded-md px-2 py-1">+</button>
          </form>
          
          <!-- Element actions -->
          <div class="flex gap-1 mt-2">
            <button onclick={deleteElement} 
              class="border rounded-md px-2 py-1 text-xs bg-red-50 hover:bg-red-100">
              Delete
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </PanelRight>
</div>
{/if}

<CodeView toggleView={currentTab === 'code'} schema={$schema}>
  <div class="flex justify-between items-center my-2 mr-2">
    <h3 class="font-bold">YAML Schema</h3>
    <label class="bg-white palette-item text-xs cursor-pointer">
        📥 Import YAML <input type="file" accept=".yaml,.yml" onchange={importYaml} class="hidden">
    </label>
  </div>
  <pre class="bg-black text-white p-2 text-xs overflow-auto max-h-96 mr-2">{schemaToYaml($schema)}</pre>

  <div class="flex justify-between items-center my-2 mr-2">
    <h3 class="font-bold">JSON Schema</h3>
    <label class="bg-white palette-item text-xs cursor-pointer">
      📥 Import JSON <input type="file" accept=".json" onchange={importJson} class="hidden">
    </label>
  </div>
  <pre class="bg-black text-white p-2 text-xs overflow-auto max-h-96 mr-2">{JSON.stringify($schema, null, 2)}</pre>
</CodeView>