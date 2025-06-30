<!-- src/routes/designer/data/ConfigurationReview.svelte -->
<script lang="ts">
import type {DataSource, ObjectDef, ObjField} from "./conf"

const { 
  dataSourceConfig, 
  currentObject, 
  onComplete,
  onBack 
} = $props<{
  dataSourceConfig: DataSource | null;
  currentObject: ObjectDef | null;
  onComplete: (object: ObjectDef) => void;
  onBack: () => void;
}>();

// State
let isProcessing = $state(false);
let changeInfo = $state<{
  isNew: boolean;
  changes: {
    newFields: string[];
    removedFields: string[];
    modifiedFields: string[];
  };
} | null>(null);

// Load change information
$effect(() => {
  if (currentObject && dataSourceConfig) {
    async function loadChanges() {
      try {
        const response = await fetch('/designer/data/analyze-changes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectName: currentObject.name,
            dataSourceName: dataSourceConfig.name,
            newObject: currentObject
          })
        });
        
        if (response.ok) {
          changeInfo = await response.json();
        }
      } catch (error) {
        console.error('Error analyzing changes:', error);
      }
    }
    
    loadChanges();
  }
});

// Derived state
const canComplete = $derived(
  dataSourceConfig !== null && currentObject !== null && currentObject.fields.length > 0
);

const totalFields = $derived(
  currentObject?.fields.length || 0
);

const requiredFields = $derived(
  currentObject?.fields.filter((f: ObjField) => f.required).length || 0
);

const hasPrimaryKey = $derived(
  currentObject?.primaryKey && currentObject.primaryKey.trim() !== ''
);

async function handleComplete() {
  if (!canComplete || !currentObject) return;
  
  isProcessing = true;
  try {
    await onComplete(currentObject);
  } finally {
    isProcessing = false;
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

function getFieldTypeIcon(type: string): string {
  switch (type) {
    case 'string': return '📝';
    case 'number': return '🔢';
    case 'boolean': return '✅';
    case 'date': return '📅';
    case 'array': return '📋';
    case 'object': return '📦';
    default: return '❓';
  }
}
</script>

<div class="space-y-8">
  <div>
    <h2 class="text-2xl font-semibold mb-2">Configuration Review</h2>
    <p class="text-gray-600">Review your complete data access configuration before saving. This will create the necessary mappings and connections.</p>
  </div>

  <!-- Configuration Summary -->
  <div class="bg-blue-50 rounded-lg p-6 border border-blue-200">
    <h3 class="text-lg font-semibold text-blue-900 mb-4">Configuration Summary</h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-700">1</div>
        <div class="text-sm text-blue-600">Object Configured</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-700">{totalFields}</div>
        <div class="text-sm text-blue-600">Total Fields</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-700">{requiredFields}</div>
        <div class="text-sm text-blue-600">Required Fields</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-700">{hasPrimaryKey ? '1' : '0'}</div>
        <div class="text-sm text-blue-600">With Primary Key</div>
      </div>
    </div>
  </div>

  <!-- Data Source Configuration -->
  {#if dataSourceConfig}
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
        </svg>
        Data Source Configuration
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Configuration Name</label>
          <div class="p-3 bg-gray-50 rounded-md border">
            <span class="font-medium text-gray-900">{dataSourceConfig.name}</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <div class="p-3 bg-gray-50 rounded-md border">
            <span class="font-medium text-gray-900">{getDataSourceDisplayName(dataSourceConfig.type)}</span>
          </div>
        </div>
      </div>

      <!-- Connection Details (sanitized) -->
      <div class="mt-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Connection Details</label>
        <div class="bg-gray-50 rounded-md p-4">
          {#if dataSourceConfig.type === 'mysql'}
            {@const mysqlConfig = dataSourceConfig.config as import('./conf').DS_DBConf}
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="font-medium">Server:</span> {mysqlConfig.server}</div>
              <div><span class="font-medium">Port:</span> {mysqlConfig.port}</div>
              <div><span class="font-medium">Database:</span> {mysqlConfig.database}</div>
              <div><span class="font-medium">Username:</span> {mysqlConfig.username}</div>
            </div>
          {:else if dataSourceConfig.type === 'rest'}
            {@const restConfig = dataSourceConfig.config as import('./conf').DS_APIConf}
            <div class="grid grid-cols-1 gap-2 text-sm">
              <div><span class="font-medium">Base URL:</span> {restConfig.baseUrl}</div>
              <div><span class="font-medium">Authentication:</span> {restConfig.authentication}</div>
            </div>
          {:else if dataSourceConfig.type === 'filesystem'}
            {@const fsConfig = dataSourceConfig.config as import('./conf').DS_FSConf}
            <div class="grid grid-cols-1 gap-2 text-sm">
              <div><span class="font-medium">Base Path:</span> {fsConfig.basePath}</div>
              <div><span class="font-medium">Format:</span> {fsConfig.format}</div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Object Configuration -->
  {#if currentObject}
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2-5l4-4M7.835 8.17l4.83-4.83" />
        </svg>
        Object Configuration: {currentObject.name}
        {#if changeInfo?.isNew}
          <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            New Object
          </span>
        {:else if changeInfo && (changeInfo.changes.newFields.length > 0 || changeInfo.changes.removedFields.length > 0 || changeInfo.changes.modifiedFields.length > 0)}
          <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Modified
          </span>
        {/if}
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Object Name</label>
          <div class="p-3 bg-gray-50 rounded-md border">
            <span class="font-medium text-gray-900">{currentObject.name}</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <div class="p-3 bg-gray-50 rounded-md border">
            <span class="font-medium text-gray-900">{currentObject.source}</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Primary Key</label>
          <div class="p-3 bg-gray-50 rounded-md border">
            <span class="font-medium text-gray-900">{currentObject.primaryKey || 'Not set'}</span>
          </div>
        </div>
      </div>

      <!-- Fields List -->
      <div>
        <h4 class="text-md font-medium mb-3">
          Field Mappings ({currentObject.fields.length})
          {#if changeInfo && !changeInfo.isNew}
            <span class="text-sm text-gray-500 ml-2">
              ({changeInfo.changes.newFields.length} new, {changeInfo.changes.modifiedFields.length} modified, {changeInfo.changes.removedFields.length} removed)
            </span>
          {/if}
        </h4>
        
        <!-- Change Summary -->
        {#if changeInfo && !changeInfo.isNew && (changeInfo.changes.newFields.length > 0 || changeInfo.changes.removedFields.length > 0 || changeInfo.changes.modifiedFields.length > 0)}
          <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div class="flex">
              <svg class="flex-shrink-0 h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Configuration Changes Detected</h3>
                <div class="mt-2 text-sm text-yellow-700">
                  <ul class="list-disc pl-5 space-y-1">
                    {#if changeInfo.changes.newFields.length > 0}
                      <li><strong>New fields:</strong> {changeInfo.changes.newFields.join(', ')}</li>
                    {/if}
                    {#if changeInfo.changes.modifiedFields.length > 0}
                      <li><strong>Modified fields:</strong> {changeInfo.changes.modifiedFields.join(', ')}</li>
                    {/if}
                    {#if changeInfo.changes.removedFields.length > 0}
                      <li><strong>Removed fields:</strong> {changeInfo.changes.removedFields.join(', ')}</li>
                    {/if}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        {/if}
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Mapping</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each currentObject.fields as objField}
                {@const isNew = changeInfo?.changes.newFields.includes(objField.name)}
                {@const isModified = changeInfo?.changes.modifiedFields.includes(objField.name)}
                <tr class="{isNew ? 'bg-green-50' : isModified ? 'bg-yellow-50' : ''}">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {objField.name}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="inline-flex items-center">
                      <span class="mr-1">{getFieldTypeIcon(objField.type)}</span>
                      {objField.type}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {objField.mapping}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {#if objField.required}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    {:else}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Optional
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {#if isNew}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        New
                      </span>
                    {:else if isModified}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Modified
                      </span>
                    {:else}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Unchanged
                      </span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Validation Status -->
      <div class="mt-6 p-4 rounded-lg {canComplete ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            {#if canComplete}
              <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            {:else}
              <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            {/if}
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium {canComplete ? 'text-green-800' : 'text-yellow-800'}">
              {canComplete ? 'Configuration Ready' : 'Configuration Issues'}
            </h3>
            <div class="mt-2 text-sm {canComplete ? 'text-green-700' : 'text-yellow-700'}">
              {#if canComplete}
                <p>Your configuration is complete and ready to be saved.</p>
              {:else}
                <ul class="list-disc pl-5 space-y-1">
                  {#if !dataSourceConfig}
                    <li>Data source configuration is missing</li>
                  {/if}
                  {#if !currentObject}
                    <li>Object configuration is missing</li>
                  {:else if currentObject.fields.length === 0}
                    <li>At least one field mapping is required</li>
                  {/if}
                </ul>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="text-center py-8 text-gray-500">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m-6 4h6m6-8h6m-6 4h6m-6 4h6" />
        </svg>
        <p class="text-lg font-medium">No object configuration found</p>
        <p class="mt-1">Please complete the previous steps to configure your object</p>
      </div>
    </div>
  {/if}

  <!-- Final Actions -->
  <div class="flex justify-between pt-4 border-t">
    <button 
      onclick={onBack}
      disabled={isProcessing}
      class="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      ← Back to Mapping
    </button>
    <button 
      onclick={handleComplete}
      disabled={!canComplete || isProcessing}
      class="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
    >
      {#if isProcessing}
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span>Saving Configuration...</span>
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Save Configuration</span>
      {/if}
    </button>
  </div>
</div>