<script lang="ts">
let {isPinned=false as boolean,width = 260 as number, name="Panel"}=$props();
let isVisible = $state(isPinned);
let isResizing=$state(false);
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
  .floating-panel { transition: transform 0.3s ease; will-change: transform; }
</style>

<div class="relative h-full">
  <aside class="floating-panel z-40 h-full bg-white shadow-xl
    {isPinned ? 'relative' : 'absolute top-0 left-0'}"
    style="width: {width}px; transform: translateX({!isPinned && !isVisible ?  `-${width-20}px`:`0` });"
    on:mouseenter={() => !isPinned && (isVisible = true)}
    on:mouseleave={() => !isPinned && (isVisible = false)} >

    <h2 class="font-semibold text-sm text-white bg-gray-600 px-2">{name}</h2>
    <div class="grid" style="grid-template-columns:1fr auto;">
        <slot />
    
        {#if !isVisible || isPinned}
        <div class="resize-handle bg-gray-500" style="width:{isPinned?"2px":"20px"}" on:mousedown={onMouseDown}>
            {#if !isVisible}
            <div class="font-semibold text-sm text-white px-2" style="transform:rotate(90deg)">
                {name}
            </div>
            {/if}
        </div>
        {/if}
    </div>
    
    
    <button on:click={togglePin}
        class="absolute top-0 right-0 text-sm text-white p-0 px-1 bg-gray-600">
        {isPinned ? '📍' : isVisible ? '▶':''}
    </button>
    
  </aside>
</div>
