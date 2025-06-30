<!-- src/routes/designer/data/MappingStep.svelte -->
<script lang="ts">
import type {DataSource, ObjectDef, ObjField} from "./conf"

const { 
  dataSourceConfig, 
  currentObject, 
  onSave,
  onCancel 
} = $props<{
  dataSourceConfig: DataSource | null;
  currentObject: ObjectDef | null;
  onSave: (object: ObjectDef) => void;
  onCancel: () => void;
}>();

// State management with proper runes
let object = $state<ObjectDef>({
  name: '',
  source: '',
  fields: [{ name: '', type: 'string', required: false, mapping: '' }],
  primaryKey: '',
  dataSource: dataSourceConfig?.name || ''
});

// Update object when currentObject changes
$effect(() => {
  if (currentObject) {
    object = { ...currentObject };
  }
});
let scanningFields = $state(false);

// Derived state
const canSave = $derived(
  object.name.trim() !== '' && 
  object.source !== '' && 
  object.fields.length > 0
);

// Field template
const fieldTemplate: ObjField = { name: '', type: 'string', required: false, mapping: '' };

function addField() {
  object.fields = [...object.fields, { ...fieldTemplate }];
}

function removeField(index: number) {
  if (object.fields.length > 1) {
    object.fields = object.fields.filter((_, i) => i !== index);
  }
}

function handleSave() {
  if (canSave) {
    onSave(object);
  }
}

async function scanAndDefineFields() {
  if (!dataSourceConfig || !object.source) {
    alert('Please select a data source first.');
    return;
  }

  scanningFields = true;
  
  try {
    let endpoint = '';
    let requestBody: any = {};

    switch (dataSourceConfig.type) {
      case 'mysql':
        endpoint = '/designer/data/table-fields';
        requestBody = {
          config: dataSourceConfig.config,
          table: object.source
        };
        break;
      case 'rest':
        endpoint = '/designer/data/api-fields';
        requestBody = {
          config: dataSourceConfig.config,
          endpoint: object.source
        };
        break;
      case 'filesystem':
        endpoint = '/designer/data/file-fields';
        requestBody = {
          config: dataSourceConfig.config,
          filename: object.source
        };
        break;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const result = await response.json();
    if (result.success) {
      object.fields = result.fields.map((field: any) => ({
        name: field.name,
        type: field.type || 'string',
        required: field.required || false,
        mapping: field.mapping || field.name
      }) as ObjField);
      
      // Auto-select first field as primary key if none selected
      if (!object.primaryKey && object.fields.length > 0) {
        const idField = object.fields.find(f => 
          f.name.toLowerCase().includes('id') || 
          f.name.toLowerCase() === 'key'
        );
        object.primaryKey = idField ? idField.name : object.fields[0].name;
      }
    } else {
      alert(`Failed to scan fields: ${result.message}`);
    }
  } catch (error) {
    console.error('Error scanning fields:', error);
    alert('Error scanning fields. Please check your connection and try again.');
  } finally {
    scanningFields = false;
  }
}

// Initialize with at least one field if empty
$effect(() => {
  if (object.fields.length === 0) {
    object.fields = [{ ...fieldTemplate }];
  }
});
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-semibold mb-2">Configure Field Mappings</h2>
    <p class="text-gray-600">Define how your data source fields map to object properties and set up field configurations.</p>
  </div>

  <div class="bg-gray-50 rounded-lg p-6 space-y-6">
    <!-- Object Information -->
    <div class="bg-white rounded-lg p-4 border">
      <h3 class="text-lg font-medium mb-4">Object Information</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Object Name</label>
          <input 
            type="text" 
            bind:value={object.name}
            placeholder="e.g., User, Product, Order"
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
          <div class="p-3 bg-gray-100 rounded-md border">
            <span class="text-gray-800 font-medium">{object.source}</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Primary Key Field</label>
          <select 
            bind:value={object.primaryKey}
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select primary key...</option>
            {#each object.fields as field}
              <option value={field.name}>{field.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Auto-Scan Section -->
    <div class="bg-white rounded-lg p-4 border">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-medium">Auto-Detect Fields</h3>
          <p class="text-sm text-gray-600 mt-1">Automatically scan your data source to detect and configure fields</p>
        </div>
        <button 
          onclick={scanAndDefineFields}
          disabled={!object.source || scanningFields}
          class="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {#if scanningFields}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Scanning...</span>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Scan & Auto-Configure</span>
          {/if}
        </button>
      </div>
    </div>
    
    <!-- Fields Configuration -->
    <div class="bg-white rounded-lg p-4 border">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-lg font-medium">Field Mappings</h3>
          <p class="text-sm text-gray-600 mt-1">Configure how source data maps to object fields</p>
        </div>
        <button 
          onclick={addField}
          class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Field</span>
        </button>
      </div>
      
      {#if object.fields.length > 0}
        <div class="space-y-3">
          <!-- Field Headers -->
          <div class="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 border-b">
            <div class="col-span-3">Field Name</div>
            <div class="col-span-2">Type</div>
            <div class="col-span-3">Source Mapping</div>
            <div class="col-span-2">Required</div>
            <div class="col-span-2">Actions</div>
          </div>
          
          <!-- Field Rows -->
          {#each object.fields as field, fieldIndex}
            <div class="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded border">
              <div class="col-span-3">
                <input 
                  type="text" 
                  bind:value={field.name}
                  placeholder="Field name"
                  class="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div class="col-span-2">
                <select 
                  bind:value={field.type}
                  class="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                  <option value="array">Array</option>
                  <option value="object">Object</option>
                </select>
              </div>
              <div class="col-span-3">
                <input 
                  type="text" 
                  bind:value={field.mapping}
                  placeholder="Source field name"
                  class="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div class="col-span-2">
                <label class="flex items-center text-sm">
                  <input 
                    type="checkbox" 
                    bind:checked={field.required}
                    class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  Required
                </label>
              </div>
              <div class="col-span-2">
                <button 
                  onclick={() => removeField(fieldIndex)}
                  class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  disabled={object.fields.length <= 1}
                >
                  Remove
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m-6 4h6m6-8h6m-6 4h6m-6 4h6" />
          </svg>
          <p class="text-lg font-medium">No fields configured</p>
          <p class="mt-1">Add fields to define your object structure</p>
        </div>
      {/if}
    </div>
    
    <!-- Field Summary -->
    {#if object.fields.length > 0}
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 class="text-sm font-medium text-blue-900 mb-2">Configuration Summary</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-blue-700 font-medium">Total Fields:</span>
            <span class="ml-1 text-blue-900">{object.fields.length}</span>
          </div>
          <div>
            <span class="text-blue-700 font-medium">Required Fields:</span>
            <span class="ml-1 text-blue-900">{object.fields.filter(f => f.required).length}</span>
          </div>
          <div>
            <span class="text-blue-700 font-medium">Primary Key:</span>
            <span class="ml-1 text-blue-900">{object.primaryKey || 'Not set'}</span>
          </div>
          <div>
            <span class="text-blue-700 font-medium">Data Source:</span>
            <span class="ml-1 text-blue-900">{object.dataSource}</span>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Form Actions -->
    <div class="flex justify-between pt-4 border-t">
      <button 
        onclick={onCancel}
        class="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
      >
        ← Back to Object Selection
      </button>
      <button 
        onclick={handleSave}
        disabled={!canSave}
        class="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Save Object Configuration</span>
      </button>
    </div>
  </div>
</div>