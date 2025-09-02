<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Btn from '$lib/components/inp/btn.svelte';
  import Text from '$lib/components/inp/text.svelte';
  
  interface Props {
    enableView?: boolean;
    enableEdit?: boolean;
    unifiedMode?: boolean;
    formDesign?: string;
    dataSource?: string;
    objectSchema?: string;
  }
  
  const {
    enableView = true,
    enableEdit = true,
    unifiedMode = true,
    formDesign,
    dataSource,
    objectSchema
  }: Props = $props();
  
  // Get record ID from URL params
  const recordId = $derived($page.params.id);
  const isNewRecord = $derived(recordId === undefined);
  
  // Mode management
  let currentMode = $state<'view' | 'edit' | 'create'>(
    isNewRecord ? 'create' : (enableView ? 'view' : 'edit')
  );
  
  // Data state
  let formData = $state({});
  let loading = $state(false);
  let saving = $state(false);
  let hasChanges = $state(false);
  
  // Derived states
  const isEditing = $derived(currentMode === 'edit' || currentMode === 'create');
  const isViewing = $derived(currentMode === 'view');
  const canEdit = $derived(enableEdit && !isNewRecord);
  const canView = $derived(enableView && !isNewRecord);
  
  // Load data when component mounts or ID changes
  $effect(async () => {
    if (!isNewRecord && recordId) {
      await loadData();
    }
  });
  
  async function loadData() {
    if (!dataSource || !objectSchema || !recordId) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/${dataSource}/${objectSchema}/${recordId}`);
      if (response.ok) {
        formData = await response.json();
      } else {
        console.error('Failed to load data:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  }
  
  async function saveData() {
    if (!dataSource || !objectSchema) return;
    
    saving = true;
    try {
      const method = isNewRecord ? 'POST' : 'PUT';
      const url = isNewRecord 
        ? `/api/${dataSource}/${objectSchema}`
        : `/api/${dataSource}/${objectSchema}/${recordId}`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        hasChanges = false;
        if (isNewRecord) {
          // Navigate to the new record's view page
          const newRecord = await response.json();
          goto(`${$page.url.pathname.replace('/new', '')}/${newRecord.id}`);
        } else {
          // Switch to view mode after saving
          if (unifiedMode && enableView) {
            currentMode = 'view';
          }
        }
      } else {
        console.error('Save failed:', response.statusText);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      saving = false;
    }
  }
  
  function switchMode(newMode: 'view' | 'edit') {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to continue?')) {
        return;
      }
    }
    currentMode = newMode;
    hasChanges = false;
  }
  
  function goBack() {
    const basePath = $page.url.pathname.split('/').slice(0, -1).join('/');
    goto(basePath || '/');
  }

  function handleFieldChange(field: string, value: any) {
    formData[field] = value;
    hasChanges = true;
  }
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <div class="border-b border-gray-200 p-4">
    <div class="flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <button onclick={goBack} class="text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h1 class="text-xl font-semibold">
          {#if isNewRecord}
            Create New Record
          {:else}
            Record #{recordId}
          {/if}
        </h1>
        {#if hasChanges}
          <span class="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
            Unsaved changes
          </span>
        {/if}
      </div>
      
      <!-- Mode Toggle & Actions -->
      <div class="flex items-center space-x-2">
        {#if !isNewRecord && unifiedMode}
          <div class="flex rounded-lg border border-gray-300 overflow-hidden">
            {#if canView}
              <button 
                onclick={() => switchMode('view')}
                class="px-3 py-1 text-sm {isViewing ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
              >
                View
              </button>
            {/if}
            {#if canEdit}
              <button 
                onclick={() => switchMode('edit')}
                class="px-3 py-1 text-sm {isEditing ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
              >
                Edit
              </button>
            {/if}
          </div>
        {/if}
        
        {#if isEditing}
          <div class="flex space-x-2">
            <Btn 
              style="!bg-gray-200 hover:!bg-gray-300 !text-gray-700 text-sm" 
              clicks={() => isNewRecord ? goBack() : switchMode('view')}
              label="Cancel" />
            <Btn 
              style="!bg-blue-600 hover:!bg-blue-700 !text-white text-sm" 
              clicks={saveData}
              disabled={saving}
              label={saving ? 'Saving...' : 'Save'} />
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- Content -->
  <div class="flex-1 overflow-hidden">
    {#if loading}
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    {:else}
      <!-- Form Component -->
      <div class="h-full overflow-y-auto">
        {#if formDesign}
          <!-- Use Form Designer component if specified -->
          <div class="p-4">
            <p class="text-gray-500">Form Designer integration: {formDesign}</p>
            <!-- TODO: Integrate with actual Form Designer component -->
          </div>
        {:else}
          <!-- Standard form fields -->
          <form onsubmit={(e) => { e.preventDefault(); saveData(); }} class="p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {#each Object.keys(formData) as field}
                <div>
                  <Text 
                    id={field}
                    name={field}
                    label={field.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    value={formData[field] || ''}
                    disabled={isViewing}
                    input={(e) => handleFieldChange(field, e.target.value)} />
                </div>
              {/each}
            </div>
          </form>
        {/if}
      </div>
    {/if}
  </div>
</div>