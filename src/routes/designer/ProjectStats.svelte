<script lang="ts">
  import type { RouteConfig } from '$lib/core/routes';
  import { RouteManager } from '$lib/core/routes';
  import { onMount } from 'svelte';
  
  let routeConfig: RouteConfig = $state({
    version: "1.0", 
    lastModified: new Date().toISOString(),
    routes: []
  });
  let availableObjects = $state(['User', 'Route', 'ObjectDef', 'FormDef', 'OAuthClient', 'UserProfile']);
  let availableDataSources = $state(['mysql_main', 'rest_api', 'file_storage']);
  
  const totalRoutes = $derived(routeConfig.routes.length);
  const visibleRoutes = $derived(RouteManager.countVisibleRoutes(routeConfig.routes));
  const componentPages = $derived(RouteManager.countByType(routeConfig.routes, 'component'));
  const objectRefUsage = $derived(RouteManager.getObjectRefUsage(routeConfig.routes));
  
  const pageTypes = ['component', 'listing', 'form', 'dashboard', 'link'];
  const typeDistribution = $derived(
    pageTypes.map(type => ({
      type,
      count: RouteManager.countByType(routeConfig.routes, type)
    }))
  );
  
  onMount(async () => {
    await loadRouteConfig();
    await loadAvailableResources();
  });
  
  async function loadRouteConfig() {
    try {
      const response = await fetch('/designer/modules');
      if (response.ok) {
        const yamlText = await response.text();
        routeConfig = await import('yaml').then(yaml => yaml.parse(yamlText));
      }
    } catch (error) {
      console.warn('Could not load route config:', error);
    }
  }
  
  async function loadAvailableResources() {
    try {
      // Load data sources
      const dataSourcesResponse = await fetch('/designer/data/sources');
      if (dataSourcesResponse.ok) {
        const dataSources = await dataSourcesResponse.json();
        availableDataSources = dataSources.map((ds: any) => ds.name || ds.id);
      }
      
      // Load object schemas
      const objectsResponse = await fetch('/designer/data/objects');
      if (objectsResponse.ok) {
        const objects = await objectsResponse.json();
        availableObjects = objects.map((obj: any) => obj.name || obj.id);
      }
    } catch (error) {
      console.warn('Could not load available resources:', error);
    }
  }
</script>

<div class="h-full overflow-y-auto p-6 bg-gray-50">
  <div class="max-w-4xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Project Overview</h1>
      <p class="text-gray-600">Statistics and configuration overview for your no-code application</p>
    </div>
    
    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white border rounded-lg p-4">
        <h3 class="font-semibold text-2xl text-blue-600">{totalRoutes}</h3>
        <p class="text-sm text-gray-600">Total Routes</p>
      </div>
      
      <div class="bg-white border rounded-lg p-4">
        <h3 class="font-semibold text-2xl text-green-600">{visibleRoutes}</h3>
        <p class="text-sm text-gray-600">Visible Routes</p>
      </div>
      
      <div class="bg-white border rounded-lg p-4">
        <h3 class="font-semibold text-2xl text-purple-600">{availableObjects.length}</h3>
        <p class="text-sm text-gray-600">Object Schemas</p>
      </div>
      
      <div class="bg-white border rounded-lg p-4">
        <h3 class="font-semibold text-2xl text-orange-600">{availableDataSources.length}</h3>
        <p class="text-sm text-gray-600">Data Sources</p>
      </div>
    </div>
    
    <!-- Charts Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Page Types Distribution -->
      <div class="bg-white border rounded-lg p-6">
        <h3 class="font-semibold text-lg mb-4">Page Types Distribution</h3>
        <div class="space-y-3">
          {#each typeDistribution as { type, count }}
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                <span class="capitalize text-sm">{type}</span>
              </div>
              <span class="bg-gray-100 px-2 py-1 rounded text-sm font-medium">{count}</span>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Object References -->
      <div class="bg-white border rounded-lg p-6">
        <h3 class="font-semibold text-lg mb-4">Object Usage</h3>
        <div class="space-y-3">
          {#each objectRefUsage.slice(0, 6) as { object, count }}
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="text-sm">{object || 'No object'}</span>
              </div>
              <span class="bg-gray-100 px-2 py-1 rounded text-sm font-medium">{count}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
    <!-- Resources Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Available Objects -->
      <div class="bg-white border rounded-lg p-6">
        <h3 class="font-semibold text-lg mb-4">Object Schemas</h3>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          {#each availableObjects as objectName}
            <div class="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-50">
              <div>
                <div class="font-medium text-sm">{objectName}</div>
                <div class="text-xs text-gray-600">Available for forms & listings</div>
              </div>
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          {/each}
        </div>
        <div class="mt-3 text-xs text-gray-600">
          <p>Manage schemas in <strong>Designer → Data</strong></p>
        </div>
      </div>
      
      <!-- Available Data Sources -->
      <div class="bg-white border rounded-lg p-6">
        <h3 class="font-semibold text-lg mb-4">Data Sources</h3>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          {#each availableDataSources as sourceName}
            <div class="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-50">
              <div>
                <div class="font-medium text-sm">{sourceName}</div>
                <div class="text-xs text-gray-600">API/Database connection</div>
              </div>
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
          {/each}
        </div>
        <div class="mt-3 text-xs text-gray-600">
          <p>Configure sources in <strong>Designer → Data</strong></p>
        </div>
      </div>
    </div>
    
    <!-- System Information -->
    <div class="bg-white border rounded-lg p-6">
      <h3 class="font-semibold text-lg mb-4">System Information</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div class="text-gray-600">Version</div>
          <div class="font-medium">{routeConfig.version}</div>
        </div>
        <div>
          <div class="text-gray-600">Last Modified</div>
          <div class="font-medium">{new Date(routeConfig.lastModified).toLocaleString()}</div>
        </div>
        <div>
          <div class="text-gray-600">Architecture</div>
          <div class="font-medium">SvelteKit + No-Code</div>
        </div>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="bg-white border rounded-lg p-6">
      <h3 class="font-semibold text-lg mb-4">Quick Actions</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <a href="/designer/modules" class="p-3 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          <div class="font-medium text-blue-800">Modules</div>
          <div class="text-xs text-blue-600">Manage routes & pages</div>
        </a>
        <a href="/designer/data" class="p-3 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
          <div class="font-medium text-green-800">Data</div>
          <div class="text-xs text-green-600">Configure data sources</div>
        </a>
        <a href="/designer/form" class="p-3 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
          <div class="font-medium text-purple-800">Forms</div>
          <div class="text-xs text-purple-600">Design forms</div>
        </a>
        <a href="/designer/component" class="p-3 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
          <div class="font-medium text-orange-800">Components</div>
          <div class="text-xs text-orange-600">Component library</div>
        </a>
      </div>
    </div>
  </div>
</div>