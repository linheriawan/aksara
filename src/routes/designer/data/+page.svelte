<!-- src/routes/designer/data/+page.svelte -->
<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import type { DataSource, ObjectDef } from './conf';

// State management
let dataSources = $state<DataSource[]>([]);
let objectSchemas = $state<ObjectDef[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Interface status tracking
let interfaceStatuses = $state(new Map<string, { exists: boolean; interfaceName: string; isGenerating?: boolean }>());

// Grouped object schemas by data source
let groupedSchemas = $state(new Map<string, ObjectDef[]>());

// Update grouped schemas when data changes
$effect(() => {
  const grouped = new Map<string, ObjectDef[]>();
  
  // Initialize with all data sources
  dataSources.forEach(ds => {
    grouped.set(ds.name, []);
  });
  
  // Group object schemas by data source
  objectSchemas.forEach(schema => {
    if (grouped.has(schema.dataSource)) {
      grouped.get(schema.dataSource)!.push(schema);
    }
  });
  
  groupedSchemas = grouped;
});

// Check interface statuses when object schemas change
$effect(() => {
  if (objectSchemas.length > 0) {
    checkAllInterfaceStatuses();
  }
});

// Load data sources and object schemas
onMount(async () => {
  await loadDataSourcesAndSchemas();
});

async function loadDataSourcesAndSchemas() {
  isLoading = true;
  error = null;
  
  try {
    const response = await fetch('/designer/data/load-configs');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    dataSources = data.configs || [];
    objectSchemas = data.objects || [];
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load data sources';
    console.error('Error loading data sources:', err);
  } finally {
    isLoading = false;
  }
}

async function checkAllInterfaceStatuses() {
  const statusPromises = objectSchemas.map(async (schema) => {
    try {
      const response = await fetch('/designer/data/check-interface-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectName: schema.name })
      });
      
      if (response.ok) {
        const status = await response.json();
        interfaceStatuses.set(schema.name, status);
      }
    } catch (err) {
      console.error(`Error checking interface status for ${schema.name}:`, err);
    }
  });
  
  await Promise.all(statusPromises);
  // Trigger reactivity
  interfaceStatuses = new Map(interfaceStatuses);
}

async function generateInterface(schema: ObjectDef) {
  // Set generating state
  const currentStatus = interfaceStatuses.get(schema.name) || { exists: false, interfaceName: '' };
  interfaceStatuses.set(schema.name, { ...currentStatus, isGenerating: true });
  interfaceStatuses = new Map(interfaceStatuses);
  
  try {
    const response = await fetch('/designer/data/generate-interface', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectSchema: schema })
    });
    
    if (response.ok) {
      const result = await response.json();
      interfaceStatuses.set(schema.name, { 
        exists: true, 
        interfaceName: result.interfaceName,
        isGenerating: false 
      });
      
      // Show success message
      showSuccessMessage(`Interface ${result.interfaceName} generated successfully!`);
    } else {
      throw new Error('Failed to generate interface');
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to generate interface';
    interfaceStatuses.set(schema.name, { ...currentStatus, isGenerating: false });
  }
  
  interfaceStatuses = new Map(interfaceStatuses);
}

function startWizard() {
  goto('/designer/data/wizard');
}

function editObjectSchema(dataSourceName: string, objectName: string) {
  goto(`/designer/data/wizard?dataSource=${dataSourceName}&object=${objectName}&mode=edit`);
}

function createObjectSchema(dataSourceName: string) {
  goto(`/designer/data/wizard?dataSource=${dataSourceName}&mode=create`);
}

function editDataSource(dataSourceName: string) {
  goto(`/designer/data/wizard?dataSource=${dataSourceName}&mode=editSource`);
}

async function deleteObjectSchema(dataSourceName: string, objectName: string) {
  if (confirm(`Are you sure you want to delete the object schema "${objectName}"?`)) {
    try {
      const response = await fetch('/designer/data/delete-object', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSourceName, objectName })
      });
      
      if (response.ok) {
        await loadDataSourcesAndSchemas(); // Refresh the list
        showSuccessMessage(`Object schema "${objectName}" deleted successfully!`);
      } else {
        throw new Error('Failed to delete object schema');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete object schema';
    }
  }
}

function getDataSourceDisplayName(type: string): string {
  switch (type) {
    case 'mysql': return 'MySQL Database';
    case 'rest': return 'REST API';
    case 'filesystem': return 'File System';
    default: return type.toUpperCase();
  }
}

function getDataSourceIcon(type: string): string {
  switch (type) {
    case 'mysql': return '🗄️';
    case 'rest': return '🌐';
    case 'filesystem': return '📁';
    default: return '💾';
  }
}

function getInterfaceStatusIcon(status: { exists: boolean; isGenerating?: boolean }): string {
  if (status.isGenerating) return '⏳';
  return status.exists ? '✅' : '❌';
}

function getInterfaceStatusText(status: { exists: boolean; interfaceName: string; isGenerating?: boolean }): string {
  if (status.isGenerating) return 'Generating...';
  return status.exists ? `Interface: ${status.interfaceName}` : 'No interface';
}

function dismissError() {
  error = null;
}

// Success message state
let successMessage = $state<string | null>(null);

function showSuccessMessage(message: string) {
  successMessage = message;
  setTimeout(() => {
    successMessage = null;
  }, 5000);
}

function dismissSuccess() {
  successMessage = null;
}
</script>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Data Sources & Object Schemas</h1>
        <p class="text-gray-600 mt-2">Manage your data sources and their object schema definitions</p>
      </div>
      <button 
        onclick={startWizard}
        class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>Start Configuration Wizard</span>
      </button>
    </div>

    <!-- Success Message -->
    {#if successMessage}
      <div class="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-medium">Success:</p>
            <p class="mt-1">{successMessage}</p>
          </div>
          <button 
            onclick={dismissSuccess}
            class="text-green-600 hover:text-green-800 font-medium text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    {/if}

    <!-- Error Display -->
    {#if error}
      <div class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-medium">Error:</p>
            <p class="mt-1">{error}</p>
          </div>
          <button 
            onclick={dismissError}
            class="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    {/if}

    <!-- Loading State -->
    {#if isLoading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading data sources...</span>
      </div>
    {:else if dataSources.length === 0}
      <!-- Empty State -->
      <div class="text-center py-12">
        <svg class="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5a2 2 0 00-2 2v8a2 2 0 002 2h14m15-11v6a2 2 0 01-2 2H15a2 2 0 01-2-2V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h4a2 2 0 012 2v2m0 0h2a2 2 0 012 2v2M9 21h6m-6 4h6m6-8h6m-6 4h6" />
        </svg>
        <h3 class="text-xl font-medium text-gray-900 mb-2">No Data Sources Configured</h3>
        <p class="text-gray-600 mb-6">Get started by configuring your first data source and creating object schemas</p>
        <button 
          onclick={startWizard}
          class="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Start Configuration Wizard</span>
        </button>
      </div>
    {:else}
      <!-- Data Sources Grid -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each dataSources as dataSource}
          {@const schemas = groupedSchemas.get(dataSource.name) || []}
          <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <!-- Data Source Header -->
            <div class="p-6 border-b">
              <div class="flex items-start justify-between">
                <div class="flex items-center space-x-3">
                  <span class="text-2xl">{getDataSourceIcon(dataSource.type)}</span>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">{dataSource.name}</h3>
                    <p class="text-sm text-gray-600">{getDataSourceDisplayName(dataSource.type)}</p>
                  </div>
                </div>
                <button 
                  onclick={() => editDataSource(dataSource.name)}
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit Data Source"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              
              <!-- Data Source Stats -->
              <div class="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2-5l4-4M7.835 8.17l4.83-4.83" />
                  </svg>
                  {schemas.length} schema{schemas.length !== 1 ? 's' : ''}
                </span>
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m6-8h6m-6 4h6m-6 4h6" />
                  </svg>
                  {schemas.reduce((sum: number, s: ObjectDef) => sum + s.fields.length, 0)} field{schemas.reduce((sum: number, s: ObjectDef) => sum + s.fields.length, 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <!-- Object Schemas List -->
            <div class="p-6">
              {#if schemas.length > 0}
                <div class="space-y-3">
                  {#each schemas as schema}
                    {@const interfaceStatus = interfaceStatuses.get(schema.name) || { exists: false, interfaceName: '' }}
                    <div class="border rounded-md p-3 bg-gray-50">
                      <div class="flex items-start justify-between mb-2">
                        <div class="flex-1">
                          <h4 class="font-medium text-gray-900">{schema.name}</h4>
                          <div class="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                            <span>Source: {schema.source}</span>
                            <span>Fields: {schema.fields.length}</span>
                            {#if schema.primaryKey}
                              <span>Key: {schema.primaryKey}</span>
                            {/if}
                          </div>
                        </div>
                        <div class="flex items-center space-x-2">
                          <button 
                            onclick={() => editObjectSchema(dataSource.name, schema.name)}
                            class="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit Schema"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onclick={() => deleteObjectSchema(dataSource.name, schema.name)}
                            class="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete Schema"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <!-- Interface Status Section -->
                      <div class="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div class="flex items-center space-x-2 text-sm">
                          <span class="text-lg">{getInterfaceStatusIcon(interfaceStatus)}</span>
                          <span class={interfaceStatus.exists ? 'text-green-600' : 'text-gray-500'}>
                            {getInterfaceStatusText(interfaceStatus)}
                          </span>
                        </div>
                        
                        {#if !interfaceStatus.exists && !interfaceStatus.isGenerating}
                          <button 
                            onclick={() => generateInterface(schema)}
                            class="bg-purple-600 text-white px-3 py-1 rounded-md text-xs hover:bg-purple-700 transition-colors flex items-center space-x-1"
                            title="Generate TypeScript Interface"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            <span>Generate Interface</span>
                          </button>
                        {:else if interfaceStatus.isGenerating}
                          <div class="flex items-center space-x-2 text-xs text-gray-500">
                            <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                            <span>Generating...</span>
                          </div>
                        {:else}
                          <button 
                            onclick={() => generateInterface(schema)}
                            class="bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700 transition-colors flex items-center space-x-1"
                            title="Regenerate TypeScript Interface"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Regenerate</span>
                          </button>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-gray-500 text-sm text-center py-4">No object schemas defined</p>
              {/if}
              
              <!-- Add New Schema Button -->
              <button 
                onclick={() => createObjectSchema(dataSource.name)}
                class="w-full mt-4 border-2 border-dashed border-gray-300 rounded-md p-3 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Object Schema</span>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>