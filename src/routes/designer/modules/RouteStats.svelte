<script lang="ts">
  import type { RouteConfig } from './route';
  import { RouteManager } from './route';
  
  interface Props {
    routeConfig: RouteConfig;
    availableObjects: string[];
  }
  
  const { routeConfig, availableObjects }: Props = $props();
  
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
</script>

<div class="h-full overflow-scroll p-4">
  <h2 class="text-xl font-semibold mb-4">Route Statistics</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="border rounded p-4">
      <h3 class="font-medium text-lg">{totalRoutes}</h3>
      <p class="text-sm text-gray-600">Total Routes</p>
    </div>
    
    <div class="border rounded p-4">
      <h3 class="font-medium text-lg">{visibleRoutes}</h3>
      <p class="text-sm text-gray-600">Visible Routes</p>
    </div>
    
    <div class="border rounded p-4">
      <h3 class="font-medium text-lg">{componentPages}</h3>
      <p class="text-sm text-gray-600">Component Pages</p>
    </div>
  </div>
  
  <div class="mt-6">
    <h3 class="font-medium mb-2">Page Types Distribution</h3>
    <div class="space-y-2">
      {#each typeDistribution as { type, count }}
        <div class="flex justify-between items-center">
          <span class="capitalize">{type}</span>
          <span class="bg-gray-100 px-2 py-1 rounded text-sm">{count}</span>
        </div>
      {/each}
    </div>
  </div>
  
  <div class="mt-6">
    <h3 class="font-medium mb-2">Object References</h3>
    <div class="space-y-2">
      {#each objectRefUsage as { object, count }}
        <div class="flex justify-between items-center">
          <span>{object || 'No object'}</span>
          <span class="bg-gray-100 px-2 py-1 rounded text-sm">{count}</span>
        </div>
      {/each}
    </div>
  </div>
  
  <div class="mt-6">
    <h3 class="font-medium mb-2">Available Objects</h3>
    <div class="space-y-2">
      {#each availableObjects as objectName}
        <div class="border p-2 rounded bg-gray-50">
          <div class="font-medium">{objectName}</div>
          <div class="text-sm text-gray-600">
            Available for forms, listings, and components
          </div>
        </div>
      {/each}
    </div>
    
    <div class="mt-3 text-sm text-gray-600">
      <p><strong>Note:</strong> To add or modify objects, use your existing Object Definition module.</p>
    </div>
  </div>
</div>