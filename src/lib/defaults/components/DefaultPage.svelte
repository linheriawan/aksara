<script lang="ts">
// Default fallback page component
export let pageConfig: any = {};
export let objectRef: string = '';
export let config: any = {};

const componentName = pageConfig?.componentPath?.split('/').pop()?.replace('.svelte', '') || 'Unknown';
</script>

<div class="default-page p-6 bg-gray-50 min-h-64">
  <div class="max-w-2xl mx-auto">
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">
        {pageConfig.title || 'Default Page'}
      </h1>
      
      {#if pageConfig.description}
        <p class="text-gray-600 mb-4">{pageConfig.description}</p>
      {/if}
      
      <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Component Not Found</h3>
            <p class="mt-1 text-sm text-yellow-700">
              The component <code class="bg-yellow-100 px-1 rounded">{componentName}</code> 
              could not be loaded. Using default fallback page.
            </p>
          </div>
        </div>
      </div>
      
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-medium text-gray-900">Configuration</h3>
          <dl class="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-gray-500">Object Reference</dt>
              <dd class="text-sm text-gray-900">{objectRef || 'None'}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Component Path</dt>
              <dd class="text-sm text-gray-900 font-mono">{pageConfig.componentPath || 'Not set'}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Page Type</dt>
              <dd class="text-sm text-gray-900">{pageConfig.type || 'component'}</dd>
            </div>
          </dl>
        </div>
        
        {#if Object.keys(config).length > 0}
          <div>
            <h3 class="text-lg font-medium text-gray-900">Config Data</h3>
            <pre class="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">{JSON.stringify(config, null, 2)}</pre>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
.default-page {
  /* Default page styles - readonly system component */
}
</style>