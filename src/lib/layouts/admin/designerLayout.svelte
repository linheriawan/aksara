<script lang="ts">
import '../../../app.css';
import {PnM} from '../../../scripts/pnm_elem.js';
import SctHead from '$lib/components/sct/head.svelte';
import SctFoot from '$lib/components/sct/foot.svelte';
import SctDrawer from '$lib/components/sct/drawer.svelte';
import SctModal from '$lib/components/sct/modal.svelte';
import SctMenus from '$lib/components/sct/menus.svelte';

const toggle=(x:string,y:string)=>{ PnM(`.${x}`).toggle(y) }
let {modules,info,children}=$props();

// Filter only designer-related modules
const designerModules = modules.filter((m: any) => 
  m.path && (m.path.startsWith('designer') || m.name.toLowerCase() === 'designer')
);
</script>

<div class="designer-layout h-screen bg-slate-50">
  <!-- Admin Header -->
  <header class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <h1 class="text-xl font-bold text-gray-900">🎨 {info.name} Designer</h1>
      <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Admin Panel</span>
    </div>
    <div class="flex items-center space-x-4">
      <span class="text-sm text-gray-600">👤 {info.user}</span>
      <button onclick={()=>toggle('drawer','hidden')} class="p-2 hover:bg-gray-100 rounded-md">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  </header>

  <!-- Admin Sidebar -->
  <div class="flex flex-1 overflow-hidden">
    <aside class="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav class="p-4">
        <div class="space-y-2">
          {#each designerModules as module}
            <a href="/{module.path}" 
               class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900">
              <span class="mr-3 text-lg">{module.icon === 'logo' ? '🏗️' : '📊'}</span>
              {module.name}
            </a>
            {#if module.children}
              <div class="ml-6 space-y-1">
                {#each module.children as child}
                  <a href="/{child.path}" 
                     class="flex items-center px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
                    <span class="mr-3">•</span>
                    {child.name}
                  </a>
                {/each}
              </div>
            {/if}
          {/each}
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 bg-gray-50 overflow-auto">
      {@render children()}
    </main>
  </div>

  <!-- Hidden drawer for mobile -->
  <SctDrawer items={designerModules} />
  
  <SctFoot>
    <svelte:fragment slot='modal'>
      <SctModal id="modules-menu" act="top" clicks={()=>toggle('modules-menu','show')}>
        <SctMenus items={designerModules} />
      </SctModal>
    </svelte:fragment>
  </SctFoot>
</div>

<style>
.designer-layout {
  /* Admin-specific styling */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.designer-layout header {
  /* Sticky admin header */
  position: sticky;
  top: 0;
  z-index: 40;
}

.designer-layout aside {
  /* Admin sidebar styling */
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
}
</style>