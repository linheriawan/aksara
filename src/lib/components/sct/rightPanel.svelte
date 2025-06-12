<script lang="ts">
  let isPinned = false;
  let isVisible = false;
  let width = 260;
  let isResizing=false;
  function togglePin() { isPinned = !isPinned; isVisible = isPinned; }
  function togglePanel() { isVisible = !isVisible; }
  function onMouseDown(event: MouseEvent) {
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
  .floating-panel { transition: transform 0.3s ease; will-change: transform; }
</style>

<div class="relative h-full">
  <aside class="bg-gray-200 shadow-xl z-40 h-full
      {isPinned ? 'relative' : 'absolute floating-panel'}"
    style="width: {width}px; top: 0; right: 0;
      transform: translateX({!isPinned && !isVisible ? `${width}px` : '0'});"
    on:mouseenter={() => !isPinned && (isVisible = true)}
    on:mouseleave={() => !isPinned && (isVisible = false)} >
    <div class="flex justify-between items-center text-sm text-white bg-gray-600 px-2">
      <h2 class="font-semibold">Panel</h2>
      <div>
        <button on:click={togglePin} class="" title={isPinned ? "Unpin" : "Pin"}>
        {isPinned ? '📍' : '📌'}
        </button>
      </div>
    </div>
    <slot />
    <div class="h-full absolute left-0 top-0 resize-handle bg-gray-500" on:mousedown={onMouseDown}></div>
    {#if !isVisible}
    <button on:click={togglePanel}
        class="absolute top-0 -left-4 text-sm text-white p-0 px-1 rounded-l bg-gray-600">
        {isVisible ? '▶' : '◀'}
    </button>
    {/if}
  </aside>
</div>
