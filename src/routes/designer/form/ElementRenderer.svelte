<!-- ElementRenderer.svelte -->
<script lang="ts">
  import type { FormElement } from "./utils.ts";
  import { getComponent, isPathEqual, NESTABLE_TYPES } from "./utils.ts";
  
  export let node: FormElement;
  export let path: number[];
  export let selectedPath: number[];
  export let handleElementDragStart: (e: DragEvent, element: FormElement, path: number[]) => void;
  export let handleDragOver: (e: DragEvent, path: number[], canNest?: boolean) => void;
  export let handleDragEnter: (e: DragEvent) => void;
  export let handleDragLeave: (e: DragEvent) => void;
  export let handleDragEnd: (e: DragEvent) => void;
  export let selectElement: (path: number[]) => void;
  
  $: isSelected = isPathEqual(selectedPath, path);
  $: canNest = NESTABLE_TYPES.has(node.type);
  $: Component = getComponent(node.type);
</script>

<div draggable="true" role="button" tabindex="0"
  class="el_wrap {isSelected ? 'current_el' : ''} {path.length > 1 ? 'nested' : ''}"
  ondragstart={(e) => handleElementDragStart(e, node, path)}
  ondragover={(e) => handleDragOver(e, path, canNest)}
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondragend={handleDragEnd}
  onclick={(e) => {
    if (path.length > 1) e.stopPropagation(); 
    selectElement(path);
  }}
  onkeydown={(e) => {
    if (e.key === 'Enter') {
      if (path.length > 1) e.stopPropagation();
      selectElement(path);
    }
  }}>
  
  {#if Component}
    <Component {...node.props}>
      <!-- Handle nested content for custom components -->
      {#if node.nesting?.length}
        {#each node.nesting as childNode, j}
          <svelte:self 
            node={childNode}
            path={[...path, j]}
            {selectedPath}
            {handleElementDragStart}
            {handleDragOver}
            {handleDragEnter}
            {handleDragLeave}
            {selectElement} />
        {/each}
      {/if}
    </Component>
  {:else}
    <svelte:element this={node.type} {...node.props}>
      <!-- Handle nested content for HTML elements -->
      {#if node.nesting?.length}
        {#each node.nesting as childNode, j}
          <svelte:self 
            node={childNode}
            path={[...path, j]}
            {selectedPath}
            {handleElementDragStart}
            {handleDragOver}
            {handleDragEnter}
            {handleDragLeave}
            {selectElement} />
        {/each}
      {/if}
    </svelte:element>
  {/if}
</div>