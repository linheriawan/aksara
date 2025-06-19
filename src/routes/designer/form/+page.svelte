<script lang="ts">
import "./style.css"
type FormElement = {
  type: 'div' | 'Inp' | 'Select' | 'SctForm';
  props: Record<string, any>;
  nesting?: FormElement[];
  id?: string; // Add unique ID for each element
};
type Schema = FormElement[];
import dat from './elprop.json';
let allprops=JSON.parse(JSON.stringify(dat))
let definedProps = (allprops as Record<string, any>);

import { writable } from 'svelte/store';
let schema = writable<Schema>([]);
export const selectedIndex = writable<number | null>(null);
export const selectedPath = writable<number[]>([]); // Track nested path [parentIndex, childIndex, ...]

import Inps from '$lib/components/inps.svelte';

import Inp from '$lib/components/inp/text.svelte';
import Select from '$lib/components/inp/select.svelte';
import SctForm from '$lib/components/sct/form.svelte';

import TabNav from '$lib/components/sct/tabnav.svelte';
import PanelRight from '$lib/components/sct/panelRight.svelte';
import PanelLeft from '$lib/components/sct/panelLeft.svelte';
import type {Component} from 'svelte';

const tabs=[{ id: 'canvas', label: 'Modules' },
      { id: 'code', label: 'View Code' },
      { id: 'profile', label: 'Profile' }];
let currentTab = $state('canvas');

// Drag and drop state
let draggedItem: { type: FormElement['type']; isNew: boolean; element?: FormElement; path?: number[] } | null = null;
let dropZone: { path: number[]; position: 'before' | 'after' | 'inside' } | null = null;
let dragCounter = 0;

// Generate unique ID for elements
function generateId(): string {
  return 'el_' + Math.random().toString(36).substr(2, 9);
}

function getComponent(type: string) {
  switch (type) {
    case 'Inp': return Inp;
    case 'Select': return Select;
    case 'SctForm': return SctForm;
  }
}

// Get element by path
function getElementByPath(schema: FormElement[], path: number[]): FormElement | null {
  if (path.length === 0) return null;
  
  let current = schema[path[0]];
  if (!current) return null;
  
  for (let i = 1; i < path.length; i++) {
    if (!current.nesting || !current.nesting[path[i]]) return null;
    current = current.nesting[path[i]];
  }
  return current;
}

// Set element by path
function setElementByPath(schema: FormElement[], path: number[], element: FormElement): FormElement[] {
  const newSchema = JSON.parse(JSON.stringify(schema));
  if (path.length === 1) {
    newSchema[path[0]] = element;
    return newSchema;
  }
  let current = newSchema[path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    current = current.nesting[path[i]];
  }
  if (current.nesting) {
    current.nesting[path[path.length - 1]] = element;
  }
  return newSchema;
}

// Remove element by path
function removeElementByPath(schema: FormElement[], path: number[]): FormElement[] {
  const newSchema = JSON.parse(JSON.stringify(schema));
  
  if (path.length === 1) {
    newSchema.splice(path[0], 1);
    return newSchema;
  }
  
  let current = newSchema[path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    current = current.nesting[path[i]];
  }
  
  if (current.nesting) {
    current.nesting.splice(path[path.length - 1], 1);
  }
  
  return newSchema;
}

// Insert element at path
function insertElementAtPath(schema: FormElement[], path: number[], position: 'before' | 'after' | 'inside', element: FormElement): FormElement[] {
  const newSchema = JSON.parse(JSON.stringify(schema));
  
  if (path.length === 0) {
    // Insert at root level
    if (position === 'before') {
      newSchema.unshift(element);
    } else {
      newSchema.push(element);
    }
    return newSchema;
  }
  
  if (path.length === 1 && position !== 'inside') {
    // Insert at root level
    const index = position === 'before' ? path[0] : path[0] + 1;
    newSchema.splice(index, 0, element);
    return newSchema;
  }
  
  // Navigate to parent or target element
  let current = newSchema[path[0]];
  let parent = null;
  let parentPath = [path[0]];
  
  for (let i = 1; i < path.length; i++) {
    parent = current;
    current = current.nesting[path[i]];
    parentPath.push(path[i]);
  }
  
  if (position === 'inside') {
    // Insert inside the current element
    if (!current.nesting) current.nesting = [];
    current.nesting.push(element);
  } else if (parent) {
    // Insert before/after in parent's nesting
    const index = position === 'before' ? path[path.length - 1] : path[path.length - 1] + 1;
    parent.nesting.splice(index, 0, element);
  }
  
  return newSchema;
}

function createNewElement(type: FormElement['type']): FormElement {
  const typeDefinition: { nesting?: any[]; [key: string]: any } | undefined = definedProps[type];
  let newElement: FormElement = {
      type: type,
      props: {},
      id: generateId()
  };
  
  if (typeDefinition) {
      if ('nesting' in typeDefinition && Array.isArray(typeDefinition.nesting)) {
          newElement.nesting = JSON.parse(JSON.stringify(typeDefinition.nesting));
      }
      for (const key in typeDefinition) {
          if (Object.prototype.hasOwnProperty.call(typeDefinition, key) && key !== 'nesting') {
              const value = typeDefinition[key];
              if (Array.isArray(value)) {
                  newElement.props[key] = JSON.parse(JSON.stringify(value));
              } else if (typeof value === 'object' && value !== null) {
                  newElement.props[key] = { ...value };
              } else {
                  newElement.props[key] = value;
              }
          }
      }
  }
  
  return newElement;
}

function addElement(type: FormElement['type']) {
  const newElement = createNewElement(type);
  schema.update(s => [...s, newElement]);
}

// Drag handlers for palette items
function handlePaletteDragStart(e: DragEvent, type: FormElement['type']) {
  draggedItem = { type, isNew: true };
  e.dataTransfer!.effectAllowed = 'copy';
}
// Drag handlers for existing elements
function handleElementDragStart(e: DragEvent, element: FormElement, path: number[]) {
  draggedItem = { type: element.type, isNew: false, element, path };
  e.dataTransfer!.effectAllowed = 'move';
  e.stopPropagation();
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault();
  dragCounter++;
}
function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  let el=e.currentTarget as HTMLElement;
  el.classList.remove('drag-hover')
  console.log(`leaving`,el.className)
  dragCounter--;
  if (dragCounter === 0) {
    dropZone = null;
  }
}

function handleDragOver(e: DragEvent, path: number[], canNest: boolean = false) {
  e.preventDefault();
  e.stopPropagation();
  if (!draggedItem) return;
  
  // For empty canvas drop
  if (path.length === 0) {
    dropZone = { path: [], position: 'after' };
    e.dataTransfer!.dropEffect = draggedItem.isNew ? 'copy' : 'move';
    return;
  }
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  if (canNest && y > height * 0.3 && y < height * 0.7) {
    dropZone = { path, position: 'inside' };
    e.dataTransfer!.dropEffect = 'copy';
  } else if (y < height / 2) {
    dropZone = { path, position: 'before' };
    e.dataTransfer!.dropEffect = draggedItem.isNew ? 'copy' : 'move';
  } else {
    dropZone = { path, position: 'after' };
    e.dataTransfer!.dropEffect = draggedItem.isNew ? 'copy' : 'move';
  }
  let el=e.currentTarget as HTMLElement;
  el.classList.add('drag-hover')
  console.log(draggedItem.type,draggedItem.element,`inside of`,dropZone.path, el.dataset.zone,el.className)
}
function handleDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  if (!draggedItem || !dropZone) return;
  schema.update(s => {
    let newSchema = [...s];
    if (draggedItem!.isNew) {
      // Add new element
      const newElement = createNewElement(draggedItem!.type);
      newSchema = insertElementAtPath(newSchema, dropZone!.path, dropZone!.position, newElement);
    } else {
      // Move existing element
      const element = draggedItem!.element!;
      // Remove from old position
      newSchema = removeElementByPath(newSchema, draggedItem!.path!);
      // Insert at new position
      newSchema = insertElementAtPath(newSchema, dropZone!.path, dropZone!.position, element);
    }
    return newSchema;
  });
  
  draggedItem = null;
  dropZone = null;
  dragCounter = 0;
}

function selectElement(path: number[]) {
  selectedPath.set(path);
  selectedIndex.set(path.length === 1 ? path[0] : null);
}

function addprop(e:Event){
  e.preventDefault();
  const fd = new FormData(e.target as HTMLFormElement);
  const prop = fd.get('prop') as string;
  const pathStr = fd.get('path') as string;
  const path = JSON.parse(pathStr);
  
  schema.update(s => {
    const element = getElementByPath(s, path);
    if (element) {
      element.props[prop] = "";
    }
    return s;
  });
  
  (e.target as HTMLFormElement).reset();
}

// Get drop zone classes
function getDropZoneClass(path: number[], position: 'before' | 'after' | 'inside'): string {
  if (!dropZone || !draggedItem) return '';
  if (JSON.stringify(dropZone.path) === JSON.stringify(path) && dropZone.position === position) {
    return `drop-zone drop-zone-${position}`;
  }
  return '';
}

function renderSvelteCode(schema: FormElement[], indent = 0): string {
  const pad = '  '.repeat(indent);
  return schema.map((node) => {
    const { type, props = {}, nesting = [] } = node;
    const propStr = Object.entries(props)
      .map(([key, value]) =>
        typeof value === 'string'
          ? `${key}="${value}"`
          : `{${JSON.stringify(value)}}`
      )
      .join(' ');
    const openTag = `<${type} ${propStr}>`;
    const closeTag = `</${type}>`;
    if (nesting.length > 0) {
      return `${pad}${openTag}\n${renderSvelteCode(nesting, indent + 1)}\n${pad}${closeTag}`;
    } else {
      return `${pad}${openTag}${closeTag}`;
    }
  }).join('\n');
}

function formatSchema(elements: FormElement[]): Record<string, any>[] {
  return elements.map(element => {
    const transformedContent: Record<string, any> = { ...element.props };
    if (element.nesting && element.nesting.length > 0) {
        transformedContent.nesting = formatSchema(element.nesting);
    } else {
        transformedContent.nesting = [];
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
                return `${pad}- ${key}:\n${toYAML(value, indent + 1)}`;
            }
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

// Recursive component for rendering nested elements
function renderElement(node: FormElement, path: number[], level: number = 0) {
  const SVC = getComponent(node.type) as Component;
  const isSelected = JSON.stringify($selectedPath) === JSON.stringify(path);
  const canNest = node.type === 'div' || node.type === 'SctForm';
  
  return {
    component: SVC,
    element: node,
    path,
    isSelected,
    canNest,
    level
  };
}
</script>

<TabNav {tabs} current={currentTab} onSelect={(id) => currentTab = id} />
<hr class="mb-1">

{#if currentTab === 'canvas'}
<div class="grid gap-1" style="grid-template-columns:auto 3fr 1fr auto">
  <PanelLeft name="Palette" width={100} isPinned={true}>
    <div class="grid gap-1 p-2">
      <div class="palette-item"
        draggable="true"
        ondragstart={(e) => handlePaletteDragStart(e, 'div')}
        onclick={() => addElement('div')}>
        📦 Div
      </div>
      <div class="palette-item"
        draggable="true"
        ondragstart={(e) => handlePaletteDragStart(e, 'Inp')}
        onclick={() => addElement('Inp')}>
        📝 Input
      </div>
      <div class="palette-item"
        draggable="true"
        ondragstart={(e) => handlePaletteDragStart(e, 'Select')}
        onclick={() => addElement('Select')}>
        📋 Select
      </div>
    </div>
  </PanelLeft>

  <!-- Form Canvas -->
  <div role="none" class="canvas-container"
    ondrop={handleDrop}
    ondragover={(e) => handleDragOver(e, [])}
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}>
    {#if $schema.length === 0}
        Drag components from the palette to start building your form
    {/if}
    {#each $schema as node, i}
      {@const path = [i]}
      {@const isSelected = JSON.stringify($selectedPath) === JSON.stringify(path)}
      {@const canNest = node.type === 'div' || node.type === 'SctForm'}
      {@const SVC = getComponent(node.type) as Component}
        <div data-zone="el_wrap" class="el_wrap {isSelected ? 'current_el' : ''} {getDropZoneClass(path, 'inside')}"
          role="none" draggable="true"
          ondragstart={(e) => handleElementDragStart(e, node, path)}
          ondragover={(e) => handleDragOver(e, path, canNest)}
          ondragenter={handleDragEnter}
          ondragleave={handleDragLeave}
          onclick={() => selectElement(path)} >
          <div data-zone="{node.type} before" class="drop-zone-before {getDropZoneClass(path, 'before')}"></div>
          {#if SVC}
            <SVC {...node.props} />
          {:else}
            <svelte:element this={node.type} {...node.props}>
              {#if node.nesting && node.nesting.length > 0}
                {#each node.nesting as childNode, j}
                  {@const childPath = [...path, j]}
                  {@const childIsSelected = JSON.stringify($selectedPath) === JSON.stringify(childPath)}
                  {@const childCanNest = childNode.type === 'div' || childNode.type === 'SctForm'}
                  {@const ChildSVC = getComponent(childNode.type) as Component}
                  
                  <div role="none"
                    draggable="true"
                    ondragstart={(e) => handleElementDragStart(e, childNode, childPath)}
                    ondragover={(e) => handleDragOver(e, childPath, childCanNest)}
                    ondragenter={handleDragEnter}
                    ondragleave={handleDragLeave}
                    class="el_wrap nested {childIsSelected ? 'current_el' : ''} {getDropZoneClass(childPath, 'inside')}"
                    onclick={(e) => {e.stopPropagation();selectElement(childPath)}}>
                    <div data-zone="child-{childNode.type}-before" class="drop-zone-before {getDropZoneClass(childPath, 'before')}"></div>
                      {#if ChildSVC}
                        <ChildSVC {...childNode.props} />
                      {:else}
                        <svelte:element this={childNode.type} {...childNode.props}>
                          <!-- Support for deeper nesting can be added here recursively -->
                        </svelte:element>
                      {/if}
                    <div data-zone="child-{childNode.type}-after" class="drop-zone-after {getDropZoneClass(childPath, 'after')}"></div>
                  </div>                  
                {/each}
              {/if}
            </svelte:element>
          {/if}
          <div data-zone="{node.type}-after" class="drop-zone-after {getDropZoneClass(path, 'after')}"></div>
        </div>
    {/each}
  </div>

  <div class="overflow-x-scroll border bg-black">
    <pre class="p-2 text-white">{toYAML(formatSchema($schema))}</pre>
  </div>

  <PanelRight isPinned={true}>
    {#if $selectedPath.length > 0}
      {@const selectedElement = getElementByPath($schema, $selectedPath)}
      {#if selectedElement}
        <div class="grid border p-2 gap-1">
          <h4 class="font-bold">Edit {selectedElement.type}</h4>
          <div class="text-xs text-gray-500 mb-2">
            Path: {$selectedPath.join(' → ')}
          </div>
          
          {#each Object.keys(selectedElement.props) as key}
            <Inps 
              type="text" 
              label={key} 
              bind:value={selectedElement.props[key]} 
            />
          {/each}
          
          <!-- Add new property -->
          <form onsubmit={addprop} class="flex items-center gap-1">
            <Inps type="text" label="New Props" name="prop" value=""/>
            <input type="hidden" name="path" value={JSON.stringify($selectedPath)} />
            <button type="submit" class="border rounded-md px-2 py-1">+</button>
          </form>
          
          <!-- Element actions -->
          <div class="flex gap-1 mt-2">
            <button 
              class="border rounded-md px-2 py-1 text-xs bg-red-50 hover:bg-red-100"
              onclick={() => {
                schema.update(s => removeElementByPath(s, $selectedPath));
                selectedPath.set([]);
                selectedIndex.set(null);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      {/if}
    {:else}
      <div class="p-4 text-gray-500 text-sm">
        Select an element to edit its properties
      </div>
    {/if}
  </PanelRight>
</div>

{:else if currentTab === 'code'}
  <pre class="bg-black text-white w-full border p-2">{renderSvelteCode($schema)}</pre>
{/if}