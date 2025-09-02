<script lang="ts">
  import { writable } from 'svelte/store';
  
  interface Panel {
    id: string;
    name: string;
    isPinned: boolean;
    isVisible: boolean;
    width: number;
    position: 'left' | 'right';
  }
  
  let { side = 'right' as 'left' | 'right', children } = $props();
  
  // Store for managing panel states
  const panels = writable<Panel[]>([]);
  let collapsedPanels = $state<Panel[]>([]);
  let visiblePanels = $state<Panel[]>([]);
  
  // Update panel lists when panels change
  panels.subscribe(panelList => {
    collapsedPanels = panelList.filter(p => !p.isPinned && !p.isVisible && p.position === side);
    visiblePanels = panelList.filter(p => (p.isPinned || p.isVisible) && p.position === side);
  });
  
  function registerPanel(panel: Panel) {
    panels.update(list => {
      const existing = list.find(p => p.id === panel.id);
      if (existing) {
        Object.assign(existing, panel);
        return list;
      }
      return [...list, panel];
    });
  }
  
  function updatePanel(id: string, updates: Partial<Panel>) {
    panels.update(list => 
      list.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  }
  
  function showPanel(id: string) {
    updatePanel(id, { isVisible: true });
  }
  
  // Export context for child panels
  export { registerPanel, updatePanel, showPanel };
</script>

<div class="relative h-full flex {side === 'left' ? 'flex-row' : 'flex-row-reverse'}">
  <!-- Collapsed Panel Tabs (Accordion Style) -->
  {#if collapsedPanels.length > 0}
    <div class="flex {side === 'left' ? 'flex-col' : 'flex-col'} h-full bg-gray-100 border-{side === 'left' ? 'r' : 'l'} border-gray-300">
      {#each collapsedPanels as panel}
        <button
          class="w-8 h-20 flex items-center justify-center bg-gray-100 border-b border-gray-300 hover:bg-gray-200 cursor-pointer text-xs text-gray-600 font-medium"
          onclick={() => showPanel(panel.id)}
          onmouseenter={() => showPanel(panel.id)}
          title="Show {panel.name}"
        >
          <span class="vertical-text select-none transform {side === 'left' ? 'rotate-180' : ''}">
            {panel.name.toUpperCase()}
          </span>
        </button>
      {/each}
    </div>
  {/if}
  
  <!-- Panel Content Area -->
  <div class="flex h-full {side === 'left' ? 'flex-row' : 'flex-row-reverse'}">
    {@render children({ registerPanel, updatePanel, showPanel })}
  </div>
</div>

<style>
  .vertical-text { 
    writing-mode: vertical-lr; 
    text-orientation: mixed;
    letter-spacing: 0.05em;
  }
</style>