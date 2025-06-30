<script lang="ts">
  import IconRenderer from '$lib/components/icons.svelte';
  import type { MenuItem } from './route';
  
  interface Props {
    route: MenuItem;
    index: number;
    parentPath?: string;
    level?: number;
    selectedRoute?: MenuItem | null;
    onDragStart?: (event: DragEvent, route: MenuItem, index: number, parentPath: string) => void;
    onDragEnd?: (event: DragEvent) => void;
    onDrop?: (event: DragEvent, targetIndex: number, targetParentPath: string) => void;
    onSelect?: (route: MenuItem, path: string, index: number) => void;
    onDelete?: (path: string, index: number) => void;
  }
  
  const {
    route,
    index,
    parentPath = '',
    level = 0,
    selectedRoute,
    onDragStart,
    onDragEnd,
    onDrop,
    onSelect,
    onDelete
  }: Props = $props();
  
  let isExpanded = $state(true); // Start expanded to show children
  
  function handleDragStart(event: DragEvent) {
    onDragStart?.(event, route, index, parentPath);
  }
  
  function handleDragEnd(event: DragEvent) {
    onDragEnd?.(event);
  }
  
  function handleDrop(event: DragEvent) {
    onDrop?.(event, index, parentPath);
  }
  
  function handleSelect(event: Event) {
    event.stopPropagation();
    onSelect?.(route, parentPath, index);
  }
  
  function handleDelete(event: Event) {
    event.stopPropagation();
    onDelete?.(parentPath, index);
  }
  
  // Derived values - computed reactively
  const childPath = $derived(parentPath ? `${parentPath}/${route.name}` : route.name);
  const hasChildren = $derived(route.children && route.children.length > 0);
  const sortedChildren = $derived(route.children ? [...route.children].sort((a, b) => a.order - b.order) : []);
  const isSelected = $derived(selectedRoute?.id === route.id);
</script>

<div class="route-item" style="margin-left: {level * 16}px">
  {#if hasChildren}
    <!-- Parent with children -->
    <div class="border p-1 mb-1" ondrop={handleDrop}>
      <!-- Clickable header for the parent item -->
      <div class="grid md:grid-cols-5 my-1 cursor-pointer items-center route-summary"
           class:selected={isSelected}
           draggable="true"
           ondragstart={handleDragStart}
           ondragend={handleDragEnd}
           onclick={handleSelect}>
        <div class="drag-handle">⋮⋮</div>
        <div>
          <strong>{route.name}</strong>
          <div class="text-sm text-gray-500">{route.pageConfig.type}</div>
        </div>
        <div>
          <code>{route.path}</code>
          {#if !route.visible}
            <span class="text-red-500 text-xs">(hidden)</span>
          {/if}
        </div>
        <div>
          {#key route.icon}
            <IconRenderer name={route.icon || 'default'} />
          {/key}
        </div>
        <div class="flex justify-between items-center">
          <button 
            class="expand-button"
            onclick={(e) => { e.stopPropagation(); isExpanded = !isExpanded; }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}>
            <span class="transform transition-transform duration-300" 
                  class:rotate-180={isExpanded}>▼</span>
          </button>
          <button class="text-red-500 hover:bg-red-100 px-2 py-1 rounded text-sm" 
                  onclick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
      
      <!-- Children container - conditionally rendered -->
      {#if isExpanded && hasChildren}
        <div class="ml-4 border-l-2 border-gray-200 pl-2">
          {#each sortedChildren as childRoute, childIndex (childRoute.id)}
            <svelte:self 
              route={childRoute}
              index={childIndex}
              parentPath={childPath}
              level={level + 1}
              {selectedRoute}
              {onDragStart}
              {onDragEnd}
              {onDrop}
              {onSelect}
              {onDelete} />
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <!-- Leaf node - simple div -->
    <div class="border p-1 mb-1 route-item-leaf"
         class:selected={isSelected}
         ondrop={handleDrop}>
      <div class="grid md:grid-cols-5 my-1 cursor-pointer items-center route-summary"
           draggable="true"
           ondragstart={handleDragStart}
           ondragend={handleDragEnd}
           onclick={handleSelect}>
        <div class="drag-handle">⋮⋮</div>
        <div>
          {route.name}
          <div class="text-sm text-gray-500">{route.pageConfig.type}</div>
        </div>
        <div>
          <code>{route.path}</code>
          {#if !route.visible}
            <span class="text-red-500 text-xs">(hidden)</span>
          {/if}
        </div>
        <div>
          {#key route.icon}
            <IconRenderer name={route.icon || 'default'} />
          {/key}
        </div>
        <div class="flex justify-end">
          <button class="text-red-500 hover:bg-red-100 px-2 py-1 rounded text-sm" 
                  onclick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .route-item {
    transition: all 0.2s ease;
  }
  
  .route-summary {
    transition: background-color 0.2s ease;
  }
  
  .route-summary:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .route-summary.selected {
    background-color: rgba(59, 130, 246, 0.1);
    border-left: 3px solid #3b82f6;
  }
  
  .route-item-leaf.selected {
    background-color: rgba(59, 130, 246, 0.05);
    border-left: 3px solid #3b82f6;
  }
  
  .drag-handle {
    cursor: grab;
    padding: 4px;
    color: #6b7280;
    user-select: none;
  }
  
  .drag-handle:hover {
    color: #374151;
  }
  
  .drag-handle:active {
    cursor: grabbing;
  }
  
  .expand-button {
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }
  
  .expand-button:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  :global(.dragging) {
    opacity: 0.5;
    transform: rotate(2deg);
  }
</style>