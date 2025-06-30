<script lang="ts">
  import SctForm from '$lib/components/sct/form.svelte';
  import TabNav from '$lib/components/sct/tabnav.svelte';
  import PanelRight from '$lib/components/sct/panelRight.svelte';
  import RouteItem from './RouteItem.svelte';
  import RouteEditor from './RouteEditor.svelte';
  import RouteSettings from './RouteSettings.svelte';
  import RouteStats from './RouteStats.svelte';
  import * as yaml from 'yaml';

  import type { MenuItem, RouteConfig } from './route';
  import { 
    listPaths, 
    getNodeByPath, 
    reorderItems, 
    moveItemToParent, 
    createDefaultMenuItem,
    RouteManager,
    RouteConfigManager
  } from './route';

  const tabs = [
    { id: 'modules', label: 'Modules' },
    { id: 'settings', label: 'Settings' },
    { id: 'profile', label: 'Profile' }
  ];
  let currentTab = $state('modules');

  // Route configuration state
  let routeConfig: RouteConfig = $state({
    version: "1.0",
    lastModified: new Date().toISOString(),
    routes: []
  });

  // Selection and editing state
  let selectedRoute: MenuItem | null = $state(null);
  let selectedParentPath = $state('');
  let editingIndex = $state<number | undefined>(undefined);
  let editingPath = $state<string>('');
  let newItem = $state<MenuItem>(createDefaultMenuItem('', ''));

  // Drag and drop state
  let draggedItem: MenuItem | null = null;
  let draggedIndex: number = -1;
  let draggedParentPath: string = '';
  let dropZoneActive = $state(false);
  
  // Available objects from your existing Object Definition module
  let availableObjects = $state(['User', 'Route', 'ObjectDef', 'FormDef', 'OAuthClient', 'UserProfile']);

  // Derived values
  const availablePaths = $derived([
    { label: "(root)", value: "" }, 
    ...listPaths(routeConfig.routes).map(p => ({ label: p, value: p }))
  ]);

  // Load config on mount
  $effect(() => {
    loadRouteConfig();
  });

  // Initialize page config when type changes
  $effect(() => {
    if (newItem.pageConfig.type) {
      RouteManager.initializePageConfig(newItem, newItem.pageConfig.type);
    }
  });

  async function loadRouteConfig() {
    routeConfig = await RouteConfigManager.load();
  }

  function selectItemForEdit(route: MenuItem, path: string, index: number) {
    selectedRoute = route;
    selectedParentPath = path;
    editingPath = path;
    newItem = JSON.parse(JSON.stringify(route));
    editingIndex = index;
    
    // Ensure all required fields exist
    if (!newItem.pageConfig.title) newItem.pageConfig.title = '';
    if (!newItem.pageConfig.description) newItem.pageConfig.description = '';
    if (!newItem.pageConfig.componentPath) newItem.pageConfig.componentPath = '';
    if (!newItem.pageConfig.objectRef) newItem.pageConfig.objectRef = '';
    if (!newItem.pageConfig.config) {
      newItem.pageConfig.config = {};
    }
    if (!newItem.pageConfig.config.props) {
      newItem.pageConfig.config.props = {};
    }
  }

  function resetForm() {
    selectedRoute = null;
    newItem = createDefaultMenuItem('', '');
    editingIndex = undefined;
    selectedParentPath = '';
    editingPath = '';
  }

  function remove(path: string, index: number) {
    routeConfig = RouteManager.removeItem(routeConfig, path, index);
    
    if (editingIndex === index && editingPath === path) {
      resetForm();
    }
  }

  function save() {
    routeConfig = RouteManager.saveItem(routeConfig, newItem, selectedParentPath, editingIndex);
    
    // Update selected route reference
    if (editingIndex !== undefined) {
      selectedRoute = newItem;
    }
    
    resetForm();
    currentTab = 'modules';
  }

  async function persist() {
    try {
      await RouteConfigManager.persist(routeConfig);
      routeConfig.lastModified = new Date().toISOString();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }

  // Drag and Drop Functions
  function handleDragStart(event: DragEvent, item: MenuItem, index: number, parentPath: string) {
    if (!event.dataTransfer) return;
    
    draggedItem = item;
    draggedIndex = index;
    draggedParentPath = parentPath;
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', '');
    
    const element = event.target as HTMLElement;
    element.classList.add('dragging');
  }

  function handleDragEnd(event: DragEvent) {
    const element = event.target as HTMLElement;
    element.classList.remove('dragging');
    dropZoneActive = false;
    
    draggedItem = null;
    draggedIndex = -1;
    draggedParentPath = '';
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    dropZoneActive = true;
  }

  function handleDragLeave(event: DragEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      dropZoneActive = false;
    }
  }

  function handleDrop(event: DragEvent, targetIndex: number, targetParentPath: string) {
    event.preventDefault();
    dropZoneActive = false;
    
    if (!draggedItem || draggedIndex === -1) return;
    if (draggedIndex === targetIndex && draggedParentPath === targetParentPath) return;
    
    const newData = JSON.parse(JSON.stringify(routeConfig));
    
    if (draggedParentPath === targetParentPath) {
      const parent = targetParentPath ? getNodeByPath(newData.routes, targetParentPath) : undefined;
      const items = parent ? parent.children! : newData.routes;
      
      const reorderedItems = reorderItems(items, draggedIndex, targetIndex);
      
      if (parent) {
        parent.children = reorderedItems;
      } else {
        newData.routes = reorderedItems;
      }
    } else {
      newData.routes = moveItemToParent(newData.routes, draggedItem.id, targetParentPath, targetIndex);
    }
    
    newData.lastModified = new Date().toISOString();
    routeConfig = newData;
  }

  function handleParentPathChange(path: string) {
    selectedParentPath = path;
  }

  function handleItemChange(item: MenuItem) {
    newItem = item;
  }

  function handleDeleteFromEditor() {
    remove(editingPath, editingIndex || 0);
  }
</script>

<style>
  .drop-zone-active {
    background-color: rgba(59, 130, 246, 0.1);
    border: 2px dashed #3b82f6;
  }
</style>

<SctForm>
  <svelte:fragment slot="pos">
    <TabNav {tabs} current={currentTab} onSelect={(id) => currentTab = id} />
  </svelte:fragment>
  <div slot="act">
    <button class="btn-small border rounded-md px-2 hover:bg-blue-300" onclick={persist}>
      Save Configuration
    </button>
    <span class="text-sm text-gray-500 ml-2">
      Last modified: {new Date(routeConfig.lastModified).toLocaleString()}
    </span>
  </div>

  <div class="h-full max-w-full overflow-hidden">
    
    {#if currentTab === 'modules'}
      <div class="h-full flex gap-1">
        <!-- Routes List -->
        <div class="flex-1 flex flex-col">
          {#if routeConfig.routes.length === 0}
            <div class="p-4 text-center">
              <p class="text-gray-500 mb-4">No routes defined yet!</p>
            </div>
          {:else}
            <div role="none" class="flex-1 overflow-scroll" class:drop-zone-active={dropZoneActive}
                 ondragover={handleDragOver} 
                 ondragleave={handleDragLeave}>
              {#each routeConfig.routes.sort((a, b) => a.order - b.order) as route, index (route.id)}
                <RouteItem 
                  {route}
                  {index}
                  parentPath=""
                  level={0}
                  {selectedRoute}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onSelect={selectItemForEdit}
                  onDelete={remove} />
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Right Panel for Basic Route Info -->
        <PanelRight isPinned={true}>
          <RouteEditor 
            {newItem}
            {selectedParentPath}
            {editingIndex}
            {availablePaths}
            onSave={save}
            onReset={resetForm}
            onDelete={editingIndex !== undefined ? handleDeleteFromEditor : undefined}
            onParentPathChange={handleParentPathChange}
            onItemChange={handleItemChange} />
        </PanelRight>
      </div>
      
    {:else if currentTab === 'settings'}
      <RouteSettings 
        {selectedRoute}
        {newItem}
        {availableObjects}
        onSave={save}
        onReset={resetForm}
        onItemChange={handleItemChange} />
      
    {:else if currentTab === 'profile'}
      <RouteStats 
        {routeConfig}
        {availableObjects} />
    {/if}
  </div>
  
</SctForm>