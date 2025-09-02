<script lang="ts">
  import Text from '$lib/components/inp/text.svelte';
  import Btn from '$lib/components/inp/btn.svelte';
  import type { ObjectDef, ObjField, DataSource } from './conf';
  import { alerting } from '$lib/stores/notif';

  interface Props {
    objectSchema?: ObjectDef | null;
    dataSource: DataSource;
    onSave?: (objectSchema: ObjectDef) => void;
  }

  const { objectSchema, dataSource, onSave }: Props = $props();

  // State
  let name = $state(objectSchema?.name || '');
  let source = $state(objectSchema?.source || '');
  let primaryKey = $state(objectSchema?.primaryKey || 'id');
  let fields = $state<ObjField[]>(objectSchema?.fields || []);
  let saving = $state(false);
  let loading = $state(false);
  let availableSources = $state<string[]>([]);

  const isEditing = $derived(!!objectSchema);
  const isValid = $derived(name.trim().length > 0 && source.trim().length > 0 && fields.length > 0);

  // Load available sources when component mounts (for all cases, not just new objects)
  $effect(async () => {
    if (dataSource && dataSource.type === 'mysql') {
      await loadAvailableSources();
    }
  });

  async function loadAvailableSources() {
    if (!dataSource) return;
    
    loading = true;
    try {
      const response = await fetch('/designer/data/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: dataSource.type,
          config: dataSource.config
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('loadAvailableSources result:', result);
        if (result.success && result.schema) {
          availableSources = result.schema; // Array of table names from MySQL
          console.log('Loaded available sources:', availableSources);
        } else {
          console.warn('No schema data returned from test connection:', result);
          // For development: add some mock tables if connection fails but it's a valid response
          if (result.success === false && result.message.includes('connection')) {
            availableSources = ['users', 'products', 'orders', 'categories']; // Mock data for testing
            console.log('Using mock table data for development');
          } else {
            availableSources = [];
          }
        }
      } else {
        console.error('Failed to load available sources:', response.status, response.statusText);
        // For development: provide mock data when MySQL is not available
        if (dataSource.type === 'mysql') {
          availableSources = ['users', 'products', 'orders', 'categories']; // Mock data for testing
          console.log('Using mock table data due to connection failure');
        } else {
          availableSources = [];
        }
      }
    } catch (error) {
      console.error('Failed to load available sources:', error);
      // For development: provide mock data when there's an error
      if (dataSource.type === 'mysql') {
        availableSources = ['users', 'products', 'orders', 'categories']; // Mock data for testing
        console.log('Using mock table data due to error');
      } else {
        availableSources = [];
      }
    } finally {
      loading = false;
    }
  }

  async function autoDetectFields() {
    if (!source || !dataSource) return;

    loading = true;
    try {
      let endpoint = '';
      let body: any = {};

      // Use different endpoints based on data source type
      switch (dataSource.type) {
        case 'mysql':
          endpoint = '/designer/data/table-fields';
          body = {
            config: dataSource.config,
            table: source
          };
          break;
        case 'rest':
          endpoint = '/designer/data/api-fields';
          body = {
            config: dataSource.config,
            endpoint: source
          };
          break;
        case 'filesystem':
          endpoint = '/designer/data/file-fields';
          // For filesystem, we need to map the source name to actual file name
          // Try common patterns: source.json, source.toLowerCase().json, pluralized versions
          const possibleFilenames = [
            `${source}.${dataSource.config.format}`,
            `${source.toLowerCase()}.${dataSource.config.format}`,
            `${source}s.${dataSource.config.format}`, 
            `${source.toLowerCase()}s.${dataSource.config.format}`
          ];
          
          body = {
            config: dataSource.config,
            filename: possibleFilenames[0], // Start with the first attempt
            possibleFilenames // Send all possibilities for server to try
          };
          break;
        default:
          throw new Error(`Unsupported data source type: ${dataSource.type}`);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.fields) {
          fields = data.fields.map((field: any) => ({
            name: field.name,
            type: field.type,
            required: field.required || false,
            mapping: field.mapping || field.name
          }));
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Auto-detect failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alerting.flash(`Auto-detect failed: ${errorMsg}`, 5000);
    } finally {
      loading = false;
    }
  }

  function mapFieldType(sourceType: string): ObjField['type'] {
    const type = sourceType.toLowerCase();
    if (type.includes('int') || type.includes('decimal') || type.includes('float')) return 'number';
    if (type.includes('bool') || type.includes('bit')) return 'boolean';
    if (type.includes('date') || type.includes('time')) return 'date';
    if (type.includes('json') || type.includes('array')) return 'array';
    if (type.includes('object') || type.includes('text') && type.includes('json')) return 'object';
    return 'string';
  }

  function addField() {
    fields = [...fields, {
      name: '',
      type: 'string',
      required: false,
      mapping: ''
    }];
  }

  function removeField(index: number) {
    fields = fields.filter((_, i) => i !== index);
  }

  function updateField(index: number, updatedField: Partial<ObjField>) {
    fields = fields.map((field, i) => 
      i === index ? { ...field, ...updatedField } : field
    );
  }

  async function handleSave() {
    if (!isValid) return;

    saving = true;
    alerting.sync('Saving object schema...', 'load');

    try {
      const newObjectSchema: ObjectDef = {
        name: name.trim(),
        source: source.trim(),
        fields: fields.filter(f => f.name.trim() && f.mapping.trim()),
        primaryKey: primaryKey.trim(),
        dataSource: dataSource.name
      };

      const response = await fetch('/designer/data/save-object-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectSchema: newObjectSchema,
          isEdit: isEditing
        })
      });

      if (response.ok) {
        const result = await response.json();
        alerting.sync('Object schema saved successfully!', 'success');
        onSave?.(newObjectSchema);
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.message || errorData.error || 'Save failed';
        alerting.sync(`Failed to save: ${errorMsg}`, 'error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error occurred';
      alerting.sync(`Network error: ${errorMsg}`, 'error');
    } finally {
      saving = false;
    }
  }


  // Export API for parent component access
  export const api = {
    get isValid() { return isValid; },
    get saving() { return saving; },
    get isEditing() { return isEditing; },
    handleSave
  };
</script>

<!-- Content wrapper -->
<div class="p-6 space-y-6">
    <!-- Basic Info -->
    <div class="grid grid-cols-2 gap-4">
      <Text
        id="name"
        name="name"
        label="Schema Name"
        value={name}
        disabled={isEditing}
        required
        placeholder="e.g., User, Product, Order"
        input={(e) => name = e.target.value} />

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Source</label>
        <div class="flex space-x-2">
          {#if dataSource.type === 'mysql'}
            <select
              bind:value={source}
              class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select table... ({availableSources.length} available)</option>
              {#each availableSources as table}
                <option value={table}>{table}</option>
              {/each}
            </select>
          {:else}
            <Text
              id="source"
              name="source"
              label=""
              value={source}
              placeholder={dataSource.type === 'rest' ? '/api/users' : 'users.json'}
              required
              input={(e) => source = e.target.value} />
          {/if}
          <Btn
            style="!bg-green-600 hover:!bg-green-700 !text-white text-sm px-3"
            clicks={autoDetectFields}
            disabled={!source || loading}
            label={loading ? 'Detecting...' : 'Auto-detect'} />
        </div>
      </div>
    </div>

    <Text
      id="primaryKey"
      name="primaryKey"
      label="Primary Key Field"
      value={primaryKey}
      required
      placeholder="id"
      input={(e) => primaryKey = e.target.value} />

    <!-- Fields Section -->
    <div class="border-t pt-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900">Fields</h3>
        <Btn
          style="!bg-blue-600 hover:!bg-blue-700 !text-white text-sm"
          clicks={addField}
          label="+ Add Field" />
      </div>

      {#if fields.length === 0}
        <div class="text-center py-8 text-gray-500">
          <p>No fields defined yet.</p>
          <p class="text-sm">Click "Auto-detect" to analyze your data source or "Add Field" to create manually.</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each fields as field, index}
            <div class="border rounded-lg p-4 bg-gray-50">
              <div class="grid grid-cols-12 gap-4 items-start">
                <!-- Field Name -->
                <div class="col-span-3">
                  <Text
                    id={`field-name-${index}`}
                    name={`field-name-${index}`}
                    label="Field Name"
                    value={field.name}
                    placeholder="fieldName"
                    required
                    input={(e) => updateField(index, { name: e.target.value })} />
                </div>

                <!-- Field Type -->
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    bind:value={field.type}
                    onchange={(e) => updateField(index, { type: e.target.value as ObjField['type'] })}
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                  </select>
                </div>

                <!-- Source Mapping -->
                <div class="col-span-3">
                  <Text
                    id={`field-mapping-${index}`}
                    name={`field-mapping-${index}`}
                    label="Source Field"
                    value={field.mapping}
                    placeholder="source_field_name"
                    required
                    input={(e) => updateField(index, { mapping: e.target.value })} />
                </div>

                <!-- Required -->
                <div class="col-span-2 flex items-center pt-6">
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      bind:checked={field.required}
                      onchange={(e) => updateField(index, { required: e.target.checked })}
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span class="ml-2 text-sm text-gray-700">Required</span>
                  </label>
                </div>

                <!-- Actions -->
                <div class="col-span-2 pt-6">
                  <button
                    onclick={() => removeField(index)}
                    class="text-red-600 hover:text-red-800 p-1"
                    title="Remove field">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

</div>