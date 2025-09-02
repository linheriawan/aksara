<script lang="ts">
let {isPinned=false as boolean, width = 260 as number, name="Panel", bgColor="white", tabIndex = 0 as number}=$props();
let isVisible = $state(isPinned);
let isResizing=$state(false);

// Calculate tab position based on index (horizontal positioning)
const tabWidth = 32; // Width of each collapsed tab
const tabOffset = $derived(tabIndex * tabWidth);
  function togglePin() { isPinned = !isPinned; isVisible = isPinned; }
  function togglePanel() { isVisible = !isVisible; }
  function onMouseDown(event: MouseEvent) {
    event.preventDefault();
    isResizing = true;
    const startX = event.clientX;
    const startWidth = width;
    const onMouseMove = (e: MouseEvent) => {
      const dx = startX - e.clientX;
      width = Math.min(Math.max(150, startWidth + dx), 800); // Clamp width
    };
    const onMouseUp = () => {
      isResizing = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
</script>

<style>
  .resize-handle { cursor: ew-resize; width: 2px; }
  .floating-panel { transition: transform 0.25s ease-out; }
  .vertical-text { 
    writing-mode: vertical-lr; 
    text-orientation: mixed;
    letter-spacing: 0.05em;
  }
</style>

<div class="relative h-full">
  <aside class="top-0 right-0 shadow-lg z-40 h-full border-l border-gray-300 floating-panel
      {isPinned ? 'relative' : 'absolute'}"
    class:bg-white={bgColor === 'white'}
    class:bg-gray-50={bgColor === 'gray'}
    onmouseenter={() => !isPinned && (isVisible = true)}
    onmouseleave={() => !isPinned && (isVisible = false)} 
    style="width:{width}px; 
      {!isPinned && !isVisible ? `transform: translateX(${width - 8}px)` : 'transform: translateX(0px)'};">
    
    <!-- Panel Header -->
    {#if isPinned || isVisible}
      <div class="flex justify-between items-center text-sm text-gray-700 bg-gray-100 border-b border-gray-200 px-3 py-2">
        <h2 class="font-medium">{name}</h2>
        <div class="flex items-center space-x-1">
          {#if !isPinned}
            <button onclick={togglePanel} class="text-gray-500 hover:text-gray-700" title="Collapse Panel">
              ▶
            </button>
          {/if}
          <button onclick={togglePin} class="text-gray-500 hover:text-gray-700" title={isPinned ? "Unpin" : "Pin"}>
            {isPinned ? '📌' : '📍'}
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Panel Content -->
    <div class="h-full overflow-hidden">
      <slot />
    </div>
    
    <!-- Resize Handle -->
    <div class="h-full absolute left-0 top-0 resize-handle bg-gray-400 opacity-50 hover:opacity-100" onmousedown={onMouseDown}></div>
    
    <!-- Collapsed Vertical Tab (Accordion Style) -->
    {#if !isPinned && !isVisible}
      <div class="absolute top-0 h-full bg-gray-100 border border-r-0 {tabIndex > 0 ? 'border-l-0' : ''} border-gray-300 hover:bg-gray-200 cursor-pointer flex items-center justify-center transition-colors"
           style="right: {tabOffset}px; width: {tabWidth}px;"
           onclick={togglePanel}
           onmouseenter={() => isVisible = true}
           title="Show {name}">
        <span class="vertical-text font-medium text-xs text-gray-600 select-none">
          {name.toUpperCase()}
        </span>
      </div>
    {/if}
  </aside>
</div>
