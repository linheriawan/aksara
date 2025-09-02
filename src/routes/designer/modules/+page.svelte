<script lang="ts">
  import SctForm from '$lib/components/sct/form.svelte';
  import FlexPanel from '$lib/components/sct/FlexPanel.svelte';
  import Modal from '$lib/components/sct/modal.svelte';
  import RouteItem from './RouteItem.svelte';
  import RouteConfigPanel from './RouteConfigPanel.svelte';
  import Text from '$lib/components/inp/text.svelte';
  import Btn from '$lib/components/inp/btn.svelte';
  import Inps from '$lib/components/inps.svelte';
  import * as yaml from 'yaml';
  import {PnM} from '../../../scripts/pnm_elem.js';

  import type { MenuItem, RouteConfig } from '$lib/core/routes';
  import type { RouteConfiguration } from '$lib/core/advanced-routes';
  import { 
    listPaths, 
    getNodeByPath, 
    reorderItems, 
    moveItemToParent, 
    createDefaultMenuItem,
    RouteManager,
    RouteConfigManager
  } from '$lib/core/routes';
  import { RouteConfigurationManager } from '$lib/core/advanced-routes';

  // Panel references for controlling collapse state
  let routeEditorPanel: any;
  
  // Route configuration state
  let editingRouteConfig: RouteConfiguration | undefined = $state(undefined);

  // Route configuration state
  let routeConfig: RouteConfig = $state({
    version: "1.0",
    lastModified: new Date().toISOString(),
    routes: []
  });

  // Selection and editing state
  let selectedRoute: MenuItem | null = $state(null);
  let selectedParentPath = $state('');
  let originalParentPath = $state(''); // Track original parent path to detect moves
  let editingIndex = $state<number | undefined>(undefined);
  let editingPath = $state<string>('');
  let newItem = $state<MenuItem>(createDefaultMenuItem('', ''));

  // Drag and drop state
  let draggedItem: MenuItem | null = null;
  let draggedIndex: number = -1;
  let draggedParentPath: string = '';
  let dropZoneActive = $state(false);
  
  // Available objects (loaded from data module)
  let availableObjects = $state<string[]>([]);
  
  // Available data sources (loaded from data module)
  let availableDataSources = $state<string[]>([]);
  
  // Available forms (loaded from form designer)
  let availableForms = $state([]);

  // Derived values
  const availablePaths = $derived([
    { label: "(root)", value: "" }, 
    ...listPaths(routeConfig.routes).map(p => ({ label: p, value: p }))
  ]);

  // Load config on mount
  $effect(() => {
    loadRouteConfig();
    loadAvailableResources();
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
  
  // Load available data sources and objects
  async function loadAvailableResources() {
    // Load data sources from data configuration
    try {
      const dataSourcesResponse = await fetch('/designer/data/sources');
      if (dataSourcesResponse.ok) {
        const dataSources = await dataSourcesResponse.json();
        availableDataSources = dataSources.map((ds: any) => ds.name || ds.id);
      } else {
        const errorText = await dataSourcesResponse.text();
        console.error('Data sources error response:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.error('Error loading data sources:', error);
    }
    
    // Load object schemas
    try {
      const objectsResponse = await fetch('/designer/data/objects');
      if (objectsResponse.ok) {
        const objects = await objectsResponse.json();
        availableObjects = objects.map((obj: any) => obj.name || obj.id);
      } else {
        const errorText = await objectsResponse.text();
        console.error('Objects error response:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.error('Error loading objects:', error);
    }
    
    // Load available forms from form designer
    // TODO: Create /designer/form/list API endpoint when form module is implemented
    try {
      availableForms = []; // Temporarily empty until form module is implemented
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  }

  function selectItemForEdit(route: MenuItem, path: string, index: number) {
    selectedRoute = route;
    selectedParentPath = path;
    originalParentPath = path; // Track original parent path
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
    
    // Auto-expand route editor panel when route is selected
    if (routeEditorPanel && routeEditorPanel.isCollapsed) {
      routeEditorPanel.toggleCollapse();
    }
  }

  function resetForm() {
    selectedRoute = null;
    newItem = createDefaultMenuItem('', '');
    editingIndex = undefined;
    selectedParentPath = '';
    originalParentPath = '';
    editingPath = '';
  }

  function remove(path: string, index: number) {
    routeConfig = RouteManager.removeItem(routeConfig, path, index);
    
    if (editingIndex === index && editingPath === path) {
      resetForm();
    }
  }

  function save() {
    // Check if we're updating and the parent path has changed
    if (editingIndex !== undefined && originalParentPath !== selectedParentPath) {
      // Parent path changed - we need to move the item
      // First remove from original location
      routeConfig = RouteManager.removeItem(routeConfig, originalParentPath, editingIndex);
      // Then add to new location as a new item
      routeConfig = RouteManager.saveItem(routeConfig, newItem, selectedParentPath, undefined);
      // Reset editing state since it's now a new item in the new location
      resetForm();
    } else {
      // Normal save (same parent path or new item)
      routeConfig = RouteManager.saveItem(routeConfig, newItem, selectedParentPath, editingIndex);
      // Update selected route reference
      if (editingIndex !== undefined) {
        selectedRoute = newItem;
        // For updates, keep the form populated with updated data instead of resetting
        // This allows user to continue editing if needed
      } else {
        // Only reset form for new items (add operations)
        resetForm();
      }
    }
    console.log(`save ${selectedParentPath}:`,routeConfig)
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

  function handleParentPathChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    selectedParentPath = target.value;
  }

  function handleItemChange(item: MenuItem) {
    newItem = item;
  }

  function handleDeleteFromEditor() {
    remove(editingPath, editingIndex || 0);
  }
  
  function handleRouteConfigSave(config: RouteConfiguration) {
    try {
      // Generate routes from configuration
      const generatedRoutes = RouteConfigurationManager.generateRoutesFromConfig(config);
      
      // Add generated routes to the route config
      generatedRoutes.forEach(route => {
        routeConfig.routes.push(route as MenuItem);
      });
      
      // Update route config
      routeConfig.lastModified = new Date().toISOString();
      routeConfig = { ...routeConfig }; // Trigger reactivity
      
      // Close config panel
      PnM('.modal-routeconfig').toggle('show');
      editingRouteConfig = undefined;
      
      console.log('Generated routes:', generatedRoutes.length);
    } catch (error) {
      console.error('Failed to generate routes:', error);
    }
  }
  
  function handleRouteConfigCancel() {
    PnM('.modal-routeconfig').toggle('show');
    editingRouteConfig = undefined;
  }
  
  function handleRouteConfigure(route: MenuItem, path: string, index: number) {
    // Convert existing route to RouteConfiguration format for editing
    try {
      const routeConfig: RouteConfiguration = {
        id: route.id,
        name: route.name,
        basePath: route.path.replace(/^\//, ''), // Remove leading slash
        dataSource: route.pageConfig.objectRef || '',
        objectSchema: route.pageConfig.objectRef || '',
        description: route.pageConfig.description || '',
        web: {
          enableList: route.pageConfig.type === 'listing',
          enableCreate: true,
          enableView: true, 
          enableEdit: true,
          unifiedViewEdit: true,
          customPages: [],
          formDesign: route.pageConfig.componentPath || '',
          listColumns: Array.isArray(route.pageConfig.config?.columns) ? route.pageConfig.config.columns : [],
          formFields: []
        },
        api: {
          standardEndpoints: {
            fetchAll: true,
            getOne: true,
            upsert: true,
            create: false,
            update: false
          },
          customEndpoints: []
        },
        createdAt: route.pageConfig.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      editingRouteConfig = routeConfig;
      PnM('.modal-routeconfig').toggle('show');
    } catch (error) {
      console.error('Error converting route to configuration:', error);
      // Fall back to creating new config with existing data
      editingRouteConfig = {
        id: route.id,
        name: route.name,
        basePath: route.path.replace(/^\//, ''),
        dataSource: route.pageConfig.objectRef || '',
        objectSchema: route.pageConfig.objectRef || '',
        description: route.pageConfig.description || '',
        web: {
          enableList: true,
          enableCreate: true,
          enableView: true,
          enableEdit: true,
          unifiedViewEdit: true,
          customPages: [],
          formDesign: '',
          listColumns: [],
          formFields: []
        },
        api: {
          standardEndpoints: {
            fetchAll: true,
            getOne: true,
            upsert: true,
            create: false,
            update: false
          },
          customEndpoints: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      PnM('.modal-routeconfig').toggle('show');
    }
  }
</script>

<style>
  .drop-zone-active {
    background-color: rgba(59, 130, 246, 0.1);
    border: 2px dashed #3b82f6;
  }
  .vertical-text { 
    writing-mode: vertical-lr; 
    text-orientation: mixed;
    letter-spacing: 0.05em;
  }
</style>

<SctForm>
  <svelte:fragment slot="pos">
    <div class="flex items-center justify-between w-full">
      <h1 class="text-lg font-semibold">Route Modules</h1>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-500 ml-2">
          Last modified: {new Date(routeConfig.lastModified).toLocaleString()}
        </span>
      </div>      
    </div>
  </svelte:fragment>
  <div slot="act">
    <button class="btn-small border rounded-md px-2 hover:bg-blue-300" onclick={persist}>
      Save Configuration
    </button>
    <button class="btn-small border rounded-md px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700"
      onclick={() => PnM('.modal-routeconfig').toggle('show')} >
      + New Route Config
    </button>
  </div>

  <div class="h-full flex">
    <!-- Main Content Area -->
    <div class="flex-1 min-w-0 flex flex-col">
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
              onDelete={remove}
              onConfigure={handleRouteConfigure} />
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Right Panel Section -->
    <div class="flex flex-shrink-0">
      <!-- Route Editor Panel -->
      <FlexPanel 
        name="Route Editor" 
        width={400} 
        bgColor="white" 
        position="right"
        collapsible={true}
        bind:this={routeEditorPanel}>
        {#snippet children()}
          <div class="flex-1 overflow-y-auto p-3 space-y-3">
            <h3 class="font-medium text-sm">
              {editingIndex === undefined ? 'Add New Route' : 'Edit Route'}
            </h3>
            
            <Inps 
              type="select" 
              label="Parent Path" 
              value={selectedParentPath}
              items={availablePaths}
              change={handleParentPathChange} />
            
            <Inps 
              type="text" 
              id="name" 
              name="name" 
              label="Route Name" 
              value={newItem.name}
              input={(e) => handleItemChange({ ...newItem, name: e.target.value })} />
            
            <Inps 
              type="text" 
              id="path" 
              name="path" 
              label="Route Path" 
              value={newItem.path}
              input={(e) => handleItemChange({ ...newItem, path: e.target.value })} />
            
            <Inps 
              type="text" 
              id="icon" 
              name="icon" 
              label="Icon" 
              value={newItem.icon}
              input={(e) => handleItemChange({ ...newItem, icon: e.target.value })} />
            
            <div class="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="visible" 
                checked={newItem.visible}
                onchange={(e) => handleItemChange({ ...newItem, visible: e.target.checked })} />
              <label for="visible" class="text-sm">Visible in navigation</label>
            </div>
          </div>
          
          <!-- Panel Footer -->
          <div class="border-t border-gray-200 p-3 bg-white">
            <div class="flex flex-row gap-2">
              <Btn clicks={resetForm} 
                style="!bg-gray-200 hover:!bg-gray-300 !text-gray-700 text-sm" 
                label="Reset" />
              {#if editingIndex !== undefined}
                <Btn clicks={handleDeleteFromEditor} 
                  style="!bg-red-100 hover:!bg-red-200 !text-red-700 text-sm flex-1 inline" 
                  label="Delete" />
              {/if}
              <Btn clicks={save} 
                style=" inline !bg-blue-600 hover:!bg-blue-700 !text-white text-sm flex-1" 
                label={editingIndex === undefined ? 'Add Route' : 'Update Route'} />
            </div>
          </div>
        {/snippet}
      </FlexPanel>
    </div>
  </div>
  
</SctForm>

<!-- Route Configuration Modal -->
<Modal id="modal-routeconfig" act="top" size="6xl" clicks={handleRouteConfigCancel}>
  {#snippet header()}
    <div>
      <h1 class="text-xl font-semibold">
        {editingRouteConfig ? 'Edit Route Configuration' : 'Create Route Configuration'}
      </h1>
      <p class="text-sm text-gray-600 mt-1">
        Configure advanced routing, data sources, and API endpoints
      </p>
    </div>
  {/snippet}
  
  <RouteConfigPanel 
    config={editingRouteConfig}
    {availableDataSources}
    {availableObjects}
    {availableForms}
    onSave={handleRouteConfigSave}
    onCancel={handleRouteConfigCancel} />
</Modal>