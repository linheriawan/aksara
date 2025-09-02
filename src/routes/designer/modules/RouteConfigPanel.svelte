<script lang="ts">
  import Text from '$lib/components/inp/text.svelte';
  import Btn from '$lib/components/inp/btn.svelte';
  import Inps from '$lib/components/inps.svelte';
  import type { RouteConfiguration, CustomPageConfig, CustomEndpointConfig } from '$lib/core/advanced-routes';
  import { RouteConfigurationManager } from '$lib/core/advanced-routes';
  import { generateId } from '$lib/core/routes';
  
  interface Props {
    config?: RouteConfiguration;
    availableDataSources: string[];
    availableObjects: string[];
    availableForms?: string[];
    onSave: (config: RouteConfiguration) => void;
    onCancel: () => void;
  }
  
  const {
    config,
    availableDataSources,
    availableObjects,
    availableForms = [],
    onSave,
    onCancel
  }: Props = $props();
  
  // Initialize configuration
  let routeConfig = $state<RouteConfiguration>(config || {
    id: generateId(),
    name: '',
    basePath: '',
    dataSource: '',
    objectSchema: '',
    description: '',
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
    createdAt: config?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Track previous config to avoid infinite loops
  let previousConfigId = config?.id;

  // Update routeConfig only when config prop changes (check by id)
  $effect(() => {
    if (config && config.id !== previousConfigId) {
      routeConfig = { ...config };
      previousConfigId = config.id;
    }
  });
  
  let showWebSection = $state(true);
  let showAPISection = $state(true);
  let previewMode = $state(false);
  
  // Auto-generate path from name (only for new configs, not when editing existing ones)
  $effect(() => {
    // Only auto-generate if this is a new config (no existing config passed) and basePath is empty
    if (routeConfig.name && !config && !routeConfig.basePath) {
      routeConfig.basePath = routeConfig.name
        .toLowerCase()
        .replace(/\\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }
  });
  
  function addCustomPage() {
    if (!routeConfig.web) return;
    
    const newPage: CustomPageConfig = {
      id: generateId(),
      name: '',
      path: '',
      component: '',
      title: '',
      permissions: []
    };
    
    routeConfig.web.customPages = [...routeConfig.web.customPages, newPage];
  }
  
  function removeCustomPage(pageId: string) {
    if (!routeConfig.web) return;
    routeConfig.web.customPages = routeConfig.web.customPages.filter(p => p.id !== pageId);
  }
  
  function addCustomEndpoint() {
    if (!routeConfig.api) return;
    
    const newEndpoint: CustomEndpointConfig = {
      id: generateId(),
      name: '',
      method: 'GET',
      path: '',
      handler: '',
      description: '',
      permissions: []
    };
    
    routeConfig.api.customEndpoints = [...routeConfig.api.customEndpoints, newEndpoint];
  }
  
  function removeCustomEndpoint(endpointId: string) {
    if (!routeConfig.api) return;
    routeConfig.api.customEndpoints = routeConfig.api.customEndpoints.filter(e => e.id !== endpointId);
  }
  
  function toggleWebSection() {
    showWebSection = !showWebSection;
    if (!showWebSection) {
      routeConfig.web = undefined;
    } else {
      routeConfig.web = {
        enableList: true,
        enableCreate: true,
        enableView: true,
        enableEdit: true,
        unifiedViewEdit: true,
        customPages: [],
        formDesign: '',
        listColumns: [],
        formFields: []
      };
    }
  }
  
  function toggleAPISection() {
    showAPISection = !showAPISection;
    if (!showAPISection) {
      routeConfig.api = undefined;
    } else {
      routeConfig.api = {
        standardEndpoints: {
          fetchAll: true,
          getOne: true,
          upsert: true,
          create: false,
          update: false
        },
        customEndpoints: []
      };
    }
  }
  
  function generatePreview() {
    previewMode = true;
  }
  
  function saveConfiguration() {
    routeConfig.updatedAt = new Date().toISOString();
    onSave(routeConfig);
  }
  
  const previewRoutes = $derived(() => {
    if (!previewMode) return [];
    try {
      return RouteConfigurationManager.generateRoutesFromConfig(routeConfig);
    } catch (error) {
      console.error('Preview generation error:', error);
      return [];
    }
  });
</script>

<div class="h-full flex flex-col bg-white">
  <div class="flex-1 overflow-hidden flex">
    <!-- Main Configuration -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      
      <!-- Basic Settings -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium">Basic Settings</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Text 
            id="name"
            name="name"
            label="Name"
            value={routeConfig.name}
            placeholder="e.g., User Management"
            input={(e) => routeConfig.name = e.target.value} />
          
          <Text 
            id="basePath"
            name="basePath"
            label="Base Path"
            value={routeConfig.basePath}
            placeholder="e.g., users"
            input={(e) => routeConfig.basePath = e.target.value} />
        </div>
        
        <Text 
          id="description"
          name="description"
          label="Description"
          value={routeConfig.description || ''}
          placeholder="Brief description of this module"
          input={(e) => routeConfig.description = e.target.value} />
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Inps 
            type="select"
            label="Data Source"
            value={routeConfig.dataSource}
            items={[{ label: "Select Data Source", value: "" }, ...availableDataSources.map(ds => ({ label: ds, value: ds }))]}
            change={(e) => routeConfig.dataSource = e.target.value} />
          
          <Inps 
            type="select"
            label="Object Schema"
            value={routeConfig.objectSchema}
            items={[{ label: "Select Object Schema", value: "" }, ...availableObjects.map(obj => ({ label: obj, value: obj }))]}
            change={(e) => routeConfig.objectSchema = e.target.value} />
        </div>
      </div>
      
      <!-- Web Application Section -->
      <div class="border border-gray-200 rounded-lg">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <label class="flex items-center space-x-2">
            <input type="checkbox" checked={showWebSection} onchange={toggleWebSection} />
            <span class="font-medium">Web Application</span>
          </label>
        </div>
        
        {#if showWebSection && routeConfig.web}
          <div class="p-4 space-y-4">
            <!-- Page Settings -->
            <div>
              <h4 class="font-medium mb-3">Pages</h4>
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center space-x-2">
                  <input type="checkbox" bind:checked={routeConfig.web.enableList} />
                  <span class="text-sm">List Page (/{routeConfig.basePath})</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" bind:checked={routeConfig.web.enableCreate} />
                  <span class="text-sm">Create Page (/{routeConfig.basePath}/)</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" bind:checked={routeConfig.web.enableView} />
                  <span class="text-sm">View Page (/{routeConfig.basePath}/[id])</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" bind:checked={routeConfig.web.enableEdit} />
                  <span class="text-sm">Edit Page (/{routeConfig.basePath}/[id])</span>
                </label>
              </div>
            </div>
            
            {#if routeConfig.web.enableView && routeConfig.web.enableEdit}
              <label class="flex items-center space-x-2">
                <input type="checkbox" bind:checked={routeConfig.web.unifiedViewEdit} />
                <span class="text-sm">Unified View/Edit (same page with mode toggle)</span>
              </label>
            {/if}
            
            <!-- Form Configuration -->
            <div>
              <h4 class="font-medium mb-3">Form Configuration</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Inps 
                  type="select"
                  label="Form Design"
                  value={routeConfig.web.formDesign || ''}
                  items={[{ label: "Default Form", value: "" }, ...availableForms.map(form => ({ label: form, value: form }))]}
                  change={(value) => routeConfig.web!.formDesign = value} />
                
                <Text 
                  id="formFields"
                  name="formFields"
                  label="Form Fields (comma-separated)"
                  value={routeConfig.web.formFields?.join(', ') || ''}
                  placeholder="name, email, role, active"
                  input={(e) => {
                    const fields = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    routeConfig.web!.formFields = fields;
                  }} />
              </div>
              
              <!-- Form Management -->
              <div class="mt-4 border border-gray-200 rounded-lg p-3">
                <div class="flex justify-between items-center mb-3">
                  <h5 class="font-medium text-sm">Form Management</h5>
                  <a href="/designer/form/new" target="_blank" 
                     class="text-sm text-blue-600 hover:text-blue-700">
                    + Create New Form
                  </a>
                </div>
                
                {#if availableForms.length > 0}
                  <div class="space-y-2">
                    {#each availableForms as form}
                      <div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <span class="text-sm">{form}</span>
                        <div class="flex space-x-2">
                          <button 
                            onclick={() => routeConfig.web!.formDesign = form}
                            class="text-xs text-blue-600 hover:text-blue-700"
                            class:font-medium={routeConfig.web.formDesign === form}>
                            {routeConfig.web.formDesign === form ? '✓ Selected' : 'Select'}
                          </button>
                          <a href="/designer/form/{form}" target="_blank"
                             class="text-xs text-green-600 hover:text-green-700">
                            Edit
                          </a>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <p class="text-sm text-gray-500 text-center py-2">
                    No forms available. Create your first form to get started.
                  </p>
                {/if}
              </div>
            </div>
            
            {#if routeConfig.web.enableList}
              <Text 
                id="listColumns"
                name="listColumns"
                label="List Columns (comma-separated)"
                value={routeConfig.web.listColumns?.join(', ') || ''}
                placeholder="id, name, email, status"
                input={(e) => {
                  const columns = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                  routeConfig.web!.listColumns = columns;
                }} />
            {/if}
            
            <!-- Custom Pages -->
            <div>
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-medium">Custom Pages</h4>
                <button onclick={addCustomPage} class="text-sm text-blue-600 hover:text-blue-700">
                  + Add Custom Page
                </button>
              </div>
              
              {#each routeConfig.web.customPages as customPage}
                <div class="border border-gray-200 p-3 rounded space-y-2 mb-3">
                  <div class="flex justify-between items-start">
                    <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Text 
                        id={`page_name_${customPage.id}`}
                        name="name"
                        label="Name"
                        value={customPage.name}
                        placeholder="Receipt"
                        input={(e) => customPage.name = e.target.value} />
                      
                      <Text 
                        id={`page_path_${customPage.id}`}
                        name="path"
                        label="Path"
                        value={customPage.path}
                        placeholder="receipt"
                        input={(e) => customPage.path = e.target.value} />
                      
                      <Text 
                        id={`page_component_${customPage.id}`}
                        name="component"
                        label="Component"
                        value={customPage.component}
                        placeholder="$lib/components/UserReceipt.svelte"
                        input={(e) => customPage.component = e.target.value} />
                    </div>
                    <button onclick={() => removeCustomPage(customPage.id)} class="text-red-600 hover:text-red-700 ml-2">
                      ×
                    </button>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Text 
                      id={`page_title_${customPage.id}`}
                      name="title"
                      label="Title"
                      value={customPage.title}
                      placeholder="User Receipt"
                      input={(e) => customPage.title = e.target.value} />
                    
                    <div class="flex items-end space-x-2">
                      <div class="flex-1">
                        <label class="text-xs text-gray-600">Form (optional)</label>
                        <select 
                          class="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          bind:value={customPage.formDesign}>
                          <option value="">No form</option>
                          {#each availableForms as form}
                            <option value={form}>{form}</option>
                          {/each}
                        </select>
                      </div>
                      {#if customPage.formDesign}
                        <a href="/designer/form/{customPage.formDesign}" target="_blank"
                           class="text-xs text-green-600 hover:text-green-700 px-2 py-1 border border-green-200 rounded">
                          Edit Form
                        </a>
                      {:else}
                        <a href="/designer/form/new?name={customPage.name}Form" target="_blank"
                           class="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 border border-blue-200 rounded">
                          Create Form
                        </a>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      
      <!-- API Section -->
      <div class="border border-gray-200 rounded-lg">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <label class="flex items-center space-x-2">
            <input type="checkbox" checked={showAPISection} onchange={toggleAPISection} />
            <span class="font-medium">API Endpoints</span>
          </label>
        </div>
        
        {#if showAPISection && routeConfig.api}
          <div class="p-4 space-y-4">
            <!-- Standard Endpoints -->
            <div>
              <h4 class="font-medium mb-3">Standard Endpoints</h4>
              <div class="space-y-2">
                <label class="flex items-center space-x-2">
                  <input type="checkbox" bind:checked={routeConfig.api.standardEndpoints.fetchAll} />
                  <span class="text-sm font-mono">POST /api/{routeConfig.basePath}</span>
                  <span class="text-sm text-gray-500">(fetchAll with filtering)</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" bind:checked={routeConfig.api.standardEndpoints.getOne} />
                  <span class="text-sm font-mono">GET /api/{routeConfig.basePath}/[id]</span>
                  <span class="text-sm text-gray-500">(getOne)</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" bind:checked={routeConfig.api.standardEndpoints.upsert} />
                  <span class="text-sm font-mono">PUT /api/{routeConfig.basePath}/[id]</span>
                  <span class="text-sm text-gray-500">(upsert - insert or update)</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" bind:checked={routeConfig.api.standardEndpoints.create} />
                  <span class="text-sm font-mono">POST /api/{routeConfig.basePath}</span>
                  <span class="text-sm text-gray-500">(create separate)</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" bind:checked={routeConfig.api.standardEndpoints.update} />
                  <span class="text-sm font-mono">PATCH /api/{routeConfig.basePath}/[id]</span>
                  <span class="text-sm text-gray-500">(update separate)</span>
                </label>
              </div>
            </div>
            
            <!-- Custom Endpoints -->
            <div>
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-medium">Custom Endpoints</h4>
                <button onclick={addCustomEndpoint} class="text-sm text-blue-600 hover:text-blue-700">
                  + Add Custom Endpoint
                </button>
              </div>
              
              {#each routeConfig.api.customEndpoints as endpoint}
                <div class="border border-gray-200 p-3 rounded space-y-2 mb-3">
                  <div class="flex justify-between items-start">
                    <div class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <Text 
                        id={`endpoint_name_${endpoint.id}`}
                        name="name"
                        label="Name"
                        value={endpoint.name}
                        placeholder="Activate"
                        input={(e) => endpoint.name = e.target.value} />
                      
                      <Inps 
                        type="select"
                        label="Method"
                        value={endpoint.method}
                        items={[
                          { label: "GET", value: "GET" },
                          { label: "POST", value: "POST" },
                          { label: "PUT", value: "PUT" },
                          { label: "PATCH", value: "PATCH" },
                          { label: "DELETE", value: "DELETE" }
                        ]}
                        change={(value) => endpoint.method = value} />
                      
                      <Text 
                        id={`endpoint_path_${endpoint.id}`}
                        name="path"
                        label="Path"
                        value={endpoint.path}
                        placeholder="activate"
                        input={(e) => endpoint.path = e.target.value} />
                      
                      <Text 
                        id={`endpoint_handler_${endpoint.id}`}
                        name="handler"
                        label="Handler"
                        value={endpoint.handler}
                        placeholder="activateUser"
                        input={(e) => endpoint.handler = e.target.value} />
                    </div>
                    <button onclick={() => removeCustomEndpoint(endpoint.id)} class="text-red-600 hover:text-red-700 ml-2">
                      ×
                    </button>
                  </div>
                  <Text 
                    id={`endpoint_desc_${endpoint.id}`}
                    name="description"
                    label="Description"
                    value={endpoint.description || ''}
                    placeholder="Activate a user account"
                    input={(e) => endpoint.description = e.target.value} />
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Preview Panel -->
    {#if previewMode}
      <div class="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
        <div class="p-4">
          <h3 class="font-medium mb-4">Generated Routes Preview</h3>
          
          {#if previewRoutes.length > 0}
            <div class="space-y-3">
              {#each previewRoutes as route}
                <div class="bg-white p-3 rounded border border-gray-200">
                  <div class="font-mono text-xs text-blue-600">{route.path}</div>
                  <div class="text-sm font-medium">{route.pageConfig?.title || route.name}</div>
                  <div class="text-xs text-gray-500">
                    {route.category} • {route.pageConfig?.category === 'web' ? route.pageConfig.web?.type : route.pageConfig?.category === 'api' ? route.pageConfig.api?.type : 'unknown'}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-gray-500">Configure settings to see preview</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Footer -->
  <div class="border-t border-gray-200 p-4">
    <div class="flex justify-between">
      <Btn 
        style="!bg-gray-200 hover:!bg-gray-300 !text-gray-700" 
        clicks={onCancel}
        label="Cancel" />
      <button 
          onclick={generatePreview}
          class="text-sm text-blue-600 hover:text-blue-700">
          {previewMode ? 'Hide Preview' : 'Show Preview'}
        </button>
      <Btn 
        style="!bg-blue-600 hover:!bg-blue-700 !text-white" 
        clicks={saveConfiguration}
        disabled={!routeConfig.name || !routeConfig.basePath || !routeConfig.dataSource || !routeConfig.objectSchema}
        label={config ? "Update Configuration" : "Create Configuration"} />
    </div>
  </div>
</div>