<!-- src/lib/components/InterfaceSelector.svelte -->
<script lang="ts">
import { onMount } from 'svelte';

interface InterfaceOption {
  name: string;
  file: string;
  fields: string[];
}

interface Props {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  class?: string;
  includeEmpty?: boolean;
  emptyText?: string;
  filePaths?: string[];
  showFileInfo?: boolean;
  groupByFile?: boolean;
  onchange?: (value: string, interfaceInfo?: InterfaceOption) => void;
}

let {
  value = $bindable(''),
  placeholder = 'Select an interface...',
  disabled = false,
  class: className = '',
  includeEmpty = true,
  emptyText = 'None',
  filePaths = undefined,
  showFileInfo = true,
  groupByFile = false,
  onchange = () => {}
}: Props = $props();

// State
let interfaces = $state<InterfaceOption[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);
let groupedInterfaces = $state<Map<string, InterfaceOption[]>>(new Map());

// Load interfaces on mount
onMount(async () => {
  await loadInterfaces();
});

// Group interfaces by file when data changes
$effect(() => {
  if (groupByFile && interfaces.length > 0) {
    const grouped = new Map<string, InterfaceOption[]>();
    
    interfaces.forEach(iface => {
      if (!grouped.has(iface.file)) {
        grouped.set(iface.file, []);
      }
      grouped.get(iface.file)!.push(iface);
    });
    
    groupedInterfaces = grouped;
  }
});

async function loadInterfaces() {
  isLoading = true;
  error = null;
  
  try {
    const response = await fetch('/designer/data/scan-interfaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePaths })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      interfaces = data.interfaces || [];
      if (data.error) {
        error = `Warning: ${data.error}`;
      }
    } else {
      throw new Error(data.error || 'Failed to load interfaces');
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load interfaces';
    console.error('Error loading interfaces:', err);
  } finally {
    isLoading = false;
  }
}

function handleSelectionChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const selectedValue = target.value;
  
  value = selectedValue;
  
  // Find the selected interface info
  const selectedInterface = interfaces.find(iface => iface.name === selectedValue);
  
  // Call the onchange callback
  onchange(selectedValue, selectedInterface);
}

function refreshInterfaces() {
  loadInterfaces();
}

// Computed values
const sortedInterfaces = $derived(
  interfaces.slice().sort((a, b) => a.name.localeCompare(b.name))
);

const hasInterfaces = $derived(interfaces.length > 0);
const selectedInterface = $derived(
  interfaces.find(iface => iface.name === value)
);
</script>

<div class="interface-selector {className}">
  <div class="flex items-center space-x-2">
    <div class="flex-1 relative">
      <select
        {value}
        {disabled}
        onchange={handleSelectionChange}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        class:opacity-50={isLoading}
      >
        {#if includeEmpty}
          <option value="">{emptyText}</option>
        {/if}
        
        {#if isLoading}
          <option value="" disabled>Loading interfaces...</option>
        {:else if !hasInterfaces}
          <option value="" disabled>No interfaces found</option>
        {:else if groupByFile}
          {#each Array.from(groupedInterfaces.entries()) as [file, fileInterfaces]}
            <optgroup label={file}>
              {#each fileInterfaces as iface}
                <option value={iface.name}>
                  {iface.name} {showFileInfo ? `(${iface.fields.length} fields)` : ''}
                </option>
              {/each}
            </optgroup>
          {/each}
        {:else}
          {#each sortedInterfaces as iface}
            <option value={iface.name}>
              {iface.name} {showFileInfo ? `- ${iface.file} (${iface.fields.length} fields)` : ''}
            </option>
          {/each}
        {/if}
      </select>
      
      {#if isLoading}
        <div class="absolute right-8 top-1/2 transform -translate-y-1/2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      {/if}
    </div>
    
    <!-- Refresh Button -->
    <button
      onclick={refreshInterfaces}
      disabled={isLoading}
      class="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
      title="Refresh interfaces"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  </div>
  
  <!-- Error Display -->
  {#if error}
    <div class="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
      {error}
    </div>
  {/if}
  
  <!-- Selected Interface Info -->
  {#if selectedInterface && showFileInfo}
    <div class="mt-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-2">
      <div class="font-medium">{selectedInterface.name}</div>
      <div class="text-xs">
        File: {selectedInterface.file} • Fields: {selectedInterface.fields.join(', ') || 'None'}
      </div>
    </div>
  {/if}
  
  <!-- Interface Count -->
  {#if hasInterfaces && !isLoading}
    <div class="mt-1 text-xs text-gray-500">
      {interfaces.length} interface{interfaces.length !== 1 ? 's' : ''} available
    </div>
  {/if}
</div>