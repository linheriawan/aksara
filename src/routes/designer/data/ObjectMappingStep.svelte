<!-- src/routes/designer/data/ObjectMappingStep.svelte -->
<script lang="ts">
// import type { Field } from "mysql2/typings/mysql/lib/parsers/typeCast";
import type {DataSource,ObjectDef,Field} from "./conf"
const { dataSourceConfig,Objects,onBack, onComplete } = $props<{
      dataSourceConfig: DataSource|null;
      Objects:ObjectDef[];
      onBack:()=>void;
      onComplete: ( objects:ObjectDef[] ) => void;
}>();
let objects=Objects;
let currentObject = {
name: '',
source: '',
fields: [],
primaryKey: ''
};

let showObjectForm = false;
let editingIndex = -1;
let availableSources = [];
let fieldTemplate:Field = { name: '', type: 'string', required: false, mapping: '' };

// Load available sources based on data source type
$: {
if (dataSourceConfig.type === 'mysql' && dataSourceConfig.schema) {
    availableSources = dataSourceConfig.schema;
} else if (dataSourceConfig.type === 'rest') {
    availableSources = ['users', 'products', 'orders']; // Example endpoints
} else if (dataSourceConfig.type === 'filesystem') {
    availableSources = ['users.json', 'products.json', 'orders.json']; // Example files
}
}

function addObject() {
  showObjectForm = true;
  currentObject = {
      name: '',
      source: '',
      fields: [{ ...fieldTemplate }],
      primaryKey: ''
  };
  editingIndex = -1;
}

function editObject(index:number) {
    showObjectForm = true;
    currentObject = { ...objects[index] };
    editingIndex = index;
}

function deleteObject(index:number) {
    if (confirm('Are you sure you want to delete this object?')) {
        objects = objects.filter((_, i) => i !== index);
    }
}

function addField() {
    currentObject.fields = [...currentObject.fields, { ...fieldTemplate }];
}

function removeField(index:number) {
    currentObject.fields = currentObject.fields.filter((_, i) => i !== index);
}

function saveObject() {
    // Check for duplicate names
    const existingNames = [...Objects, ...objects.filter((_, i) => i !== editingIndex)].map(obj => obj.name);

    if (existingNames.includes(currentObject.name)) {
        alert('Object name already exists. Please choose a different name.');
        return;
    }

    if (editingIndex >= 0) {
        objects[editingIndex] = { ...currentObject };
    } else {
        objects = [...objects, { ...currentObject }];
    }

    showObjectForm = false;
    currentObject = {
        name: '',
        source: '',
        fields: [],
        primaryKey: ''
    };
}

function cancelObject() {
    showObjectForm = false;
    currentObject = {
        name: '',
        source: '',
        fields: [],
        primaryKey: ''
    };
}

async function loadTableFields() {
    if (dataSourceConfig.type === 'mysql' && currentObject.source) {
        try {
        const response = await fetch('/designer/data/table-fields', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            config: dataSourceConfig.config,
            table: currentObject.source
            })
        });
        
        const result = await response.json();
        if (result.success) {
            currentObject.fields = result.fields.map((field:Field) => ({
            name: field.name,
            type: field.type,
            required: field.required,
            mapping: field.name
            }));
        }
        } catch (error) {
        console.error('Error loading table fields:', error);
        }
    }
}

$: canComplete = objects.length > 0;
$: canSaveObject = currentObject.name && currentObject.source && currentObject.fields.length > 0;
</script>

<div>
  <h2 class="text-2xl font-semibold mb-6">Define Object Mappings</h2>
  
  <div class="mb-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium">Objects</h3>
      <button onclick={addObject}
        class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
        Add Object
      </button>
    </div>
    
    {#if objects.length > 0}
      <div class="space-y-3">
        {#each objects as object, index}
          <div class="border border-gray-300 rounded-md p-4">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium text-lg">{object.name}</h4>
                <p class="text-gray-600">Source: {object.source}</p>
                <p class="text-gray-600">Fields: {object.fields.length}</p>
                {#if object.primaryKey}
                  <p class="text-gray-600">Primary Key: {object.primaryKey}</p>
                {/if}
              </div>
              <div class="flex space-x-2">
                <button on:click={() => editObject(index)}
                  class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700" >
                  Edit
                </button>
                <button on:click={() => deleteObject(index)}
                  class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700" >
                  Delete
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if !showObjectForm}
      <div class="text-center py-8 text-gray-500">
        <p>No objects defined yet. Click "Add Object" to get started.</p>
      </div>
    {/if}
  </div>
  
  <!-- Object Form Modal -->
  {#if showObjectForm}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-full overflow-y-auto">
        <h3 class="text-xl font-semibold mb-4">
          {editingIndex >= 0 ? 'Edit' : 'Add'} Object
        </h3>
        
        <div class="space-y-4">
          <!-- Object Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Object Name</label>
            <input 
              type="text" 
              bind:value={currentObject.name}
              placeholder="e.g., user, product, order"
              class="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <!-- Data Source -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
            <select 
              bind:value={currentObject.source}
              on:change={loadTableFields}
              class="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a source...</option>
              {#each availableSources as source}
                <option value={source}>{source}</option>
              {/each}
            </select>
          </div>
          
          <!-- Primary Key -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Primary Key Field</label>
            <select 
              bind:value={currentObject.primaryKey}
              class="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select primary key...</option>
              {#each currentObject.fields as field}
                <option value={field.name}>{field.name}</option>
              {/each}
            </select>
          </div>
          
          <!-- Fields -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">Fields</label>
              <button 
                on:click={addField}
                class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Add Field
              </button>
            </div>
            
            {#if currentObject.fields.length > 0}
              <div class="space-y-3 max-h-60 overflow-y-auto">
                {#each currentObject.fields as field:Field, fieldIndex}
                  <div class="border border-gray-200 rounded p-3">
                    <div class="grid grid-cols-12 gap-2 items-center">
                      <div class="col-span-3">
                        <input 
                          type="text" 
                          bind:value={field.name}
                          placeholder="Field name"
                          class="w-full p-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div class="col-span-2">
                        <select 
                          bind:value={field.type}
                          class="w-full p-1 border border-gray-300 rounded text-sm"
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
                          placeholder="Source mapping"
                          class="w-full p-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div class="col-span-2">
                        <label class="flex items-center text-sm">
                          <input 
                            type="checkbox" 
                            bind:checked={field.required}
                            class="mr-1"
                          />
                          Required
                        </label>
                      </div>
                      <div class="col-span-2">
                        <button 
                          on:click={() => removeField(fieldIndex)}
                          class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-gray-500 text-sm">No fields defined. Click "Add Field" to start.</p>
            {/if}
          </div>
        </div>
        
        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button 
            on:click={cancelObject}
            class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
          <button 
            on:click={saveObject}
            disabled={!canSaveObject}
            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {editingIndex >= 0 ? 'Update' : 'Save'} Object
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Navigation -->
  <div class="flex justify-between">
    <button class="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700" onclick={onBack}>
      Back
    </button>
    <button 
      onclick={onComplete(objects)}
      disabled={!canComplete}
      class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
    >
      Complete Setup
    </button>
  </div>
</div>