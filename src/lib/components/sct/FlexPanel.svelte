<script lang="ts">
  interface Props {
    name: string;
    width?: number;
    bgColor?: 'white' | 'gray';
    position?: 'left' | 'right';
    defaultCollapsed?: boolean;
    collapsible?: boolean;
    children?: any;
  }
  
  const {
    name,
    width = 320,
    bgColor = 'white',
    position = 'right',
    defaultCollapsed = false,
    collapsible = true,
    children
  }: Props = $props();
  
  let isCollapsed = $state(defaultCollapsed);
  
  function toggleCollapse() {
    if (collapsible) {
      isCollapsed = !isCollapsed;
    }
  }
  
  const collapsedWidth = 32; // Width when collapsed
  const currentWidth = $derived(isCollapsed ? collapsedWidth : width);
  
  // Export the collapse state for parent components to control
  export { isCollapsed, toggleCollapse };
</script>

<div class="flex-shrink-0 h-full flex {position === 'left' ? 'flex-row' : 'flex-row'}" 
     style="width: {currentWidth}px;">
  
  {#if isCollapsed}
    <!-- Collapsed State -->
    <div class="w-full border-{position === 'left' ? 'r' : 'l'} border-gray-300 bg-gray-100 hover:bg-gray-200 cursor-pointer flex items-center justify-center transition-colors"
         onclick={toggleCollapse}
         title="Expand {name}">
      <span class="vertical-text font-medium text-xs text-gray-600 select-none">
        {name.toUpperCase()}
      </span>
    </div>
  {:else}
    <!-- Expanded State -->
    <div class="w-full border-{position === 'left' ? 'r' : 'l'} border-gray-300 flex flex-col"
         class:bg-white={bgColor === 'white'}
         class:bg-gray-50={bgColor === 'gray'}>
      
      <!-- Panel Header -->
      <div class="flex justify-between items-center text-sm text-gray-700 bg-gray-100 border-b border-gray-200 px-3 py-2">
        <h2 class="font-medium">{name}</h2>
        <div class="flex items-center space-x-1">
          {#if collapsible}
            <button onclick={toggleCollapse} class="text-gray-500 hover:text-gray-700 transition-colors" title="Collapse {name}">
              {position === 'left' ? '◀' : '▶'}
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Panel Content -->
      <div class="flex-1 overflow-hidden">
        {@render children()}
      </div>
    </div>
  {/if}
</div>

<style>
  .vertical-text { 
    writing-mode: vertical-lr; 
    text-orientation: mixed;
    letter-spacing: 0.05em;
  }
</style>