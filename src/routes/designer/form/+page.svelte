<script lang="ts">
import "./style.css"
import type {FormElement,Schema,DraggedItem,DropZone} from "./utils.ts"
import {} from "./utils.ts"
import CodeView from "./CodeView.svelte"
import SchemaView from "./SchemaView.svelte"

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
  { id: 'code', label: 'View Code' },
  { id: 'obj', label: 'View Object' }
];

const PALETTE_ITEMS = [
  { label: 'Div', icon: '📦', type: 'div', inputType: 'div' },
  { label: 'Input', icon: '📝', type: 'Inp', inputType: 'Text' },
  { label: 'Select', icon: '📋', type: 'Inp', inputType: 'Select' },
  { label: 'Sct Form', icon: '📋', type: 'SctForm', inputType: 'SctForm' }
] as const;

const COMPONENT_MAP: Record<string, Component> = {
  'SctForm': SctForm,
  'Inp': Inp
};

const NESTABLE_TYPES = new Set(['div', 'SctForm']);

// State
const definedProps = structuredClone(dat) as Record<string, any>;
const schema = writable<Schema>([]);

let selectedIndex = $state<number | null>(null);
let selectedPath = $state<number[]>([]);
let currentTab = $state<string>('canvas');
let draggedItem = $state<DraggedItem>(null);
let dropZone = $state<DropZone>(null);
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
const generateId = (): string => 'el_' + Math.random().toString(36).substr(2, 9);

const getElementByPath = (schema: FormElement[], path: number[]): FormElement | null => {
  if (!path.length) return null;
  
  let current = schema[path[0]];
  if (!current) return null;
  
  for (let i = 1; i < path.length; i++) {
    if (!current.nesting?.[path[i]]) return null;
    current = current.nesting[path[i]];
  }
  return current;
};

const setElementByPath = (path: number[], element: FormElement): FormElement[] => {
  const newSchema = clonedSchema($schema);
  
  if (path.length === 1) {
    newSchema[path[0]] = element;
    return newSchema;
  }
  
  let current = newSchema[path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    current = current.nesting![path[i]];
  }
  
  if (current.nesting) {
    current.nesting[path[path.length - 1]] = element;
  }
  return newSchema;
};
const clonedSchema=(dat:any)=>{
  try{
    return JSON.parse(JSON.stringify(dat));//structuredClone(dat);
  }catch (e: unknown) { // 'error' is implicitly 'unknown' with strict mode
    if (e instanceof Error) {
      console.error(e.message, JSON.stringify(dat));
    } else {
      console.error("An unknown error occurred:", e, JSON.stringify(dat));
    }
    return JSON.parse(JSON.stringify(dat));
  }
}
const removeElementByPath = ( path: number[]): FormElement[] => {
  const newSchema = clonedSchema($schema);
  
  if (path.length === 1) {
    newSchema.splice(path[0], 1);
    return newSchema;
  }
  
  let current = newSchema[path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    current = current.nesting![path[i]];
  }
  
  current.nesting?.splice(path[path.length - 1], 1);
  return newSchema;
};

const insertElementAtPath = (
  path: number[], 
  position: 'before' | 'after' | 'inside', 
  element: FormElement
): FormElement[] => {
  const newSchema = clonedSchema($schema);
  
  if (!path.length) {
    position === 'before' ? newSchema.unshift(element) : newSchema.push(element);
    return newSchema;
  }
  
  if (path.length === 1 && position !== 'inside') {
    const index = position === 'before' ? path[0] : path[0] + 1;
    newSchema.splice(index, 0, element);
    return newSchema;
  }
  
  let current = newSchema[path[0]];
  let parent = null;
  
  for (let i = 1; i < path.length; i++) {
    parent = current;
    current = current.nesting![path[i]];
  }
  
  if (position === 'inside') {
    current.nesting ??= [];
    current.nesting.push(element);
  } else if (parent) {
    const index = position === 'before' ? path[path.length - 1] : path[path.length - 1] + 1;
    parent.nesting!.splice(index, 0, element);
  }
  return newSchema;
};

const createNewElement = (type: FormElement['type'], inputType?: string): FormElement => {
  const typeDefinition = definedProps[inputType??type];
  const newElement: FormElement = { 
    type, 
    props: {}, 
    _id: generateId() 
  };
  if (typeDefinition) {
    if (typeDefinition.nesting && Array.isArray(typeDefinition.nesting)) {
      newElement.nesting = clonedSchema(typeDefinition.nesting);
    }
    
    Object.entries(typeDefinition).forEach(([key, value]) => {
      if (key !== 'nesting') {
        newElement.props[key] = clonedSchema(value);
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

const getComponent = (type: string): Component | false => {
  return COMPONENT_MAP[type] || false;
};

// Event handlers
const addElement = (type: FormElement['type'], inputType?: string) => {
  schema.update(s => [...s, createNewElement(type, inputType)]);
};

const handlePaletteDragStart = (e: DragEvent, type: FormElement['type'], inputType?: string) => {
  draggedItem = { type, isNew: true, inputType };
  e.dataTransfer!.effectAllowed = 'copy';
};

const handleElementDragStart = (e: DragEvent, element: FormElement, path: number[]) => {
  let inputType=element.type=="Inp"? element.props.type : element.type;
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
  
  if (!path.length) {
    dropZone = { path: [], position: 'after' };
    e.dataTransfer!.dropEffect = draggedItem.isNew ? 'copy' : 'move';
    return;
  }
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  const relativeY = y / height;
  
  if (canNest && relativeY > 0.3 && relativeY < 0.7) {
    dropZone = { path, position: 'inside' };
    e.dataTransfer!.dropEffect = 'copy';
  } else if (relativeY < 0.3) {
    dropZone = { path, position: 'before' };
    e.dataTransfer!.dropEffect = draggedItem.isNew ? 'copy' : 'move';
  } else {
    dropZone = { path, position: 'after' };
    e.dataTransfer!.dropEffect = draggedItem.isNew ? 'copy' : 'move';
  }
  
  (e.currentTarget as HTMLElement).classList.add('drag-hover');
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (!draggedItem || !dropZone) return;
  
  schema.update(s => {
    let newSchema = [...s];
    
    if (draggedItem!.isNew) {
      const newElement = createNewElement(draggedItem!.type, draggedItem!.inputType);
      newSchema = insertElementAtPath( dropZone!.path, dropZone!.position, newElement);
    } else {
      const element = draggedItem!.element!;
      newSchema = removeElementByPath(draggedItem!.path!);
      newSchema = insertElementAtPath(dropZone!.path, dropZone!.position, element);
    }
    console.log(`${draggedItem!.inputType}:${draggedItem!.path?.join('→') || 'new'} into ${dropZone!.position} ${formattedPath()}`)
    return newSchema;
  });
  
  // Reset drag state
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
  
  schema.update(s => {
    const newSchema = clonedSchema(s);
    const element = getElementByPath(newSchema, path);
    if (element) {
      element.props[prop] = "";
    }
    return newSchema;
  });
  
  (e.target as HTMLFormElement).reset();
};

const updateProperty = (path: number[], key: string, value: any) => {
  schema.update(s => {
    const newSchema = clonedSchema(s);
    const element = getElementByPath(newSchema, path);
    if (element) {
      element.props[key] = value;
    }
    return newSchema;
  });
};

const deleteElement = () => {
  schema.update(s => removeElementByPath(selectedPath));
  selectedPath = [];
  selectedIndex = null;
};

const isPathEqual = (path1: number[], path2: number[]): boolean => {
  return path1.length === path2.length && path1.every((val, i) => val === path2[i]);
};
</script>

<TabNav tabs={TABS} current={currentTab} onSelect={(id) => currentTab = id} />
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
      {@const path = [i]}
      {@const isSelected = isPathEqual(selectedPath, path)}
      {@const canNest = NESTABLE_TYPES.has(node.type)}
      {@const Component = getComponent(node.type)}
      
      <div draggable="true" role="button" tabindex="0"
        class="el_wrap {isSelected ? 'current_el' : ''}"
        ondragstart={(e) => handleElementDragStart(e, node, path)}
        ondragover={(e) => handleDragOver(e, path, canNest)}
        ondragenter={handleDragEnter}
        ondragleave={handleDragLeave}
        onclick={() => selectElement(path)}
        onkeydown={(e) => e.key === 'Enter' && selectElement(path)} >
        {#if Component}
          <Component {...node.props} />
        {:else}
          <svelte:element this={node.type} {...node.props}>
            {#if node.nesting?.length}
              {#each node.nesting as childNode, j}
                {@const childPath = [...path, j]}
                {@const childIsSelected = isPathEqual(selectedPath, childPath)}
                {@const childCanNest = NESTABLE_TYPES.has(childNode.type)}
                {@const ChildComponent = getComponent(childNode.type)}
                
                <div draggable="true" role="button" tabindex="0" 
                  ondragstart={(e) => handleElementDragStart(e, childNode, childPath)}
                  ondragover={(e) => handleDragOver(e, childPath, childCanNest)}
                  ondragenter={handleDragEnter}
                  ondragleave={handleDragLeave}
                  class="el_wrap nested {childIsSelected ? 'current_el' : ''}"
                  onclick={(e) => {e.stopPropagation(); selectElement(childPath)}}
                  onkeydown={(e) => e.key === 'Enter' && (e.stopPropagation(), selectElement(childPath))} >
                  {#if ChildComponent}
                    <ChildComponent {...childNode.props} />
                  {:else}
                    <svelte:element this={childNode.type} {...childNode.props} />
                  {/if}
                </div>
              {/each}
            {/if}
          </svelte:element>
        {/if}
      </div>
    {/each}
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

{#if draggedItem}
  <div class="debug-info">
    {draggedItem.type}:{draggedItem.path?.join('→') || 'new'} into {formattedPath()}
  </div>
{/if}
{/if}

<CodeView toggleView={currentTab === 'code'} schema={$schema} />

{#if currentTab==='obj'}
<pre class="bg-black text-white w-full p-2">{JSON.stringify($schema,null,2)}</pre>
{/if}