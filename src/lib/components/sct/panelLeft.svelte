<script lang="ts">
let {isPinned=false as boolean, width = 260 as number, name="Panel", tabIndex = 0 as number}=$props();
let isVisible = $state(isPinned);
let isResizing=$state(false);

// Calculate tab position based on index (horizontal positioning)
const tabWidth = 32; // Width of each collapsed tab
const tabOffset = $derived(tabIndex * tabWidth);
function togglePin() { isPinned = !isPinned; isVisible = isPinned; }
function onMouseDown(event: MouseEvent) {
    event.preventDefault();
    isResizing = true;
    const startX = event.clientX;
    const startWidth = width;
    const onMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        width = Math.min(Math.max(100, startWidth + dx), 800); // Clamp width
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
  .resize-handle { cursor: ew-resize; }
  .floating-panel { transition: transform 0.25s ease-out; will-change: transform; }
  .vertical-text { 
    writing-mode: vertical-lr; 
    text-orientation: mixed;
    letter-spacing: 0.05em;
  }
</style>

<div class="relative h-full">
  <aside class="floating-panel z-40 h-full bg-white shadow-xl border-r border-gray-300
    {isPinned ? 'relative' : 'absolute top-0 left-0'}"
    style="width: {width}px; transform: translateX({!isPinned && !isVisible ? `-${width-8}px` : `0`});"
    onmouseenter={() => !isPinned && (isVisible = true)}
    onmouseleave={() => !isPinned && (isVisible = false)}>

    <!-- Panel Header -->
    {#if isPinned || isVisible}
      <div class="flex justify-between items-center text-sm text-gray-700 bg-gray-100 border-b border-gray-200 px-3 py-2">
        <h2 class="font-medium">{name}</h2>
        <div class="flex items-center space-x-1">
          {#if !isPinned}
            <button onclick={() => isVisible = false} class="text-gray-500 hover:text-gray-700" title="Collapse Panel">
              ◀
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
    {#if isPinned || isVisible}
      <div class="h-full absolute right-0 top-0 resize-handle bg-gray-400 opacity-50 hover:opacity-100" style="width: 2px;" onmousedown={onMouseDown}></div>
    {/if}
    
    <!-- Collapsed Vertical Tab (Accordion Style) -->
    {#if !isPinned && !isVisible}
      <div class="absolute top-0 h-full bg-gray-100 border border-l-0 {tabIndex > 0 ? 'border-r-0' : ''} border-gray-300 hover:bg-gray-200 cursor-pointer flex items-center justify-center transition-colors"
           style="left: {tabOffset}px; width: {tabWidth}px;"
           onclick={() => isVisible = true}
           onmouseenter={() => isVisible = true}
           title="Show {name}">
        <span class="vertical-text font-medium text-xs text-gray-600 select-none">
          {name.toUpperCase()}
        </span>
      </div>
    {/if}
  </aside>
</div>
