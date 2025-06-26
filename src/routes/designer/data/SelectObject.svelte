<!-- src/routes/designer/data/SelectObject.svelte -->
<script lang="ts">
import type {DataSource, ObjectDef} from "./conf"

const { 
  dataSourceConfig, 
  objects, 
  onObjectSelect,
  onNewObject,
  onBack 
} = $props<{
  dataSourceConfig: DataSource | null;
  objects: ObjectDef[];
  onObjectSelect: (object: ObjectDef, index: number) => void;
  onNewObject: (object: ObjectDef) => void;
  onBack: () => void;
}>();

// State management
let newObjectName = $state('');
let selectedSource = $state('');
let loadingObjects = $state(false);

// Filter objects by current data source
let dataSourceObjects = $state<ObjectDef[]>([]);

// Update filtered objects when objects or dataSourceConfig changes
$effect(() => {
  if (!dataSourceConfig) {
    dataSourceObjects = [];
  } else {
    dataSourceObjects = objects.filter((obj:ObjectDef) => obj.dataSource === dataSourceConfig.name);
  }
});

// Derived state
const canCreateNew = $derived(newObjectName.trim() !== '' && selectedSource !== '');

// State for available sources
let availableSources = $state<string[]>([]);
let loadingSources = $state(false);

// Load available sources when data source config changes
$effect(() => {
  if (!dataSourceConfig) {
    availableSources = [];
    return;
  }

  async function loadSources() {
    loadingSources = true;
    try {
      if (dataSourceConfig.type === 'mysql' && dataSourceConfig.schema) {
        availableSources = dataSourceConfig.schema;
      } else {
        // Fetch available sources from the server
        const response = await fetch('/designer/data/available-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: dataSourceConfig.type, 
            config: dataSourceConfig.config 
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          availableSources = result.sources || [];
        } else {
          console.error('Failed to load available sources');
          availableSources = [];
        }
      }
    } catch (error) {
      console.error('Error loading available sources:', error);
      availableSources = [];
    } finally {
      loadingSources = false;
    }
  }

  loadSources();
});

function handleNewObject() {
  if (canCreateNew) {
    const newObject: ObjectDef = {
      name: newObjectName.trim(),
      source: selectedSource,
      fields: [{ name: '', type: 'string', required: false, mapping: '' }],
      primaryKey: '',
      dataSource: dataSourceConfig?.name || ''
    };
    onNewObject(newObject);
    // Reset form
    newObjectName = '';
    selectedSource = '';
  }
}

function handleSelectObject(object: ObjectDef, index: number) {
  onObjectSelect(object, index);
}
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-semibold mb-2">Select or Create Object Schema</h2>
    <p class="text-gray-600">Choose an existing object schema to edit or create a new one. Object schemas define the structure and field mappings for data entities within your data source.</p>
  </div>

  <!-- Existing Object Schemas List -->
  <div>
    <h3 class="text-lg font-medium mb-4">
      Existing Object Schemas for Data Source: {dataSourceConfig?.name} ({dataSourceObjects.length})
    </h3>
    
    {#if dataSourceObjects.length > 0}
      <div class="grid gap-4 mb-8">
        {#each dataSourceObjects as objectSchema, index}
          <div class="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
               onclick={() => handleSelectObject(objectSchema, index)}>
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h4 class="font-medium text-lg text-gray-900">{objectSchema.name}</h4>
                <div class="mt-2 space-y-1 text-sm text-gray-600">
                  <p><span class="font-medium">Data Source:</span> {objectSchema.source}</p>
                  <p><span class="font-medium">Object Fields:</span> {objectSchema.fields.length}</p>
                  {#if objectSchema.primaryKey}
                    <p><span class="font-medium">Primary Key:</span> {objectSchema.primaryKey}</p>
                  {/if}
                  <div class="flex items-center mt-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {dataSourceConfig?.type.toUpperCase()} Schema
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg mb-8">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5a2 2 0 00-2 2v8a2 2 0 002 2h14m15-11v6a2 2 0 01-2 2H15a2 2 0 01-2-2V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h4a2 2 0 012 2v2m0 0h2a2 2 0 012 2v2M9 21h6m-6 4h6m6-8h6m-6 4h6" />
        </svg>
        <p class="text-lg font-medium">No object schemas for this data source</p>
        <p class="mt-1">Create your first object schema for <strong>{dataSourceConfig?.name}</strong></p>
      </div>
    {/if}
  </div>

  <!-- Create New Object Schema -->
  <div class="border-t pt-6">
    <h3 class="text-lg font-medium mb-4">Create New Object Schema</h3>
    <p class="text-sm text-gray-600 mb-4">Object schemas will be saved as YAML files in <code class="bg-gray-100 px-1 rounded">src/lib/datadef/{dataSourceConfig?.name}/</code></p>
    
    <div class="bg-gray-50 rounded-lg p-6 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Object Schema Name</label>
          <input 
            type="text" 
            bind:value={newObjectName}
            placeholder="e.g., User, Product, Order"
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="mt-1 text-xs text-gray-500">Choose a descriptive name for your object schema (will be saved as {newObjectName || 'ObjectName'}.yaml)</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Data Source Entity</label>
          <div class="relative">
            <select 
              bind:value={selectedSource}
              disabled={loadingSources}
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">
                {loadingSources ? 'Loading sources...' : 'Select a source entity...'}
              </option>
              {#each availableSources as source}
                <option value={source}>{source}</option>
              {/each}
            </select>
            {#if loadingSources}
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            {/if}
          </div>
          <p class="mt-1 text-xs text-gray-500">Choose the source table, API endpoint, or data file to map</p>
        </div>
      </div>
      
      <!-- Navigation Buttons -->
      <div class="flex justify-between pt-4 border-t">
        <button 
          onclick={onBack}
          class="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          ← Back to Data Source
        </button>
        <button onclick={handleNewObject}
          disabled={!canCreateNew}
          class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create & Configure Schema</span>
        </button>
      </div>
    </div>
  </div>
</div>