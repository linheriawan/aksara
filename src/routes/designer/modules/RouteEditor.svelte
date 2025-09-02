<script lang="ts">
  import Text from '$lib/components/inp/text.svelte';
  import Btn from '$lib/components/inp/btn.svelte';
  import Inps from '$lib/components/inps.svelte';
  import type { MenuItem } from '$lib/core/routes';
  import { RouteManager } from '$lib/core/routes';
  
  interface Props {
    newItem: MenuItem;
    selectedParentPath: string;
    editingIndex?: number;
    availablePaths: Array<{ label: string; value: string }>;
    onSave: () => void;
    onReset: () => void;
    onDelete?: () => void;
    onParentPathChange: (path: string) => void;
    onItemChange: (item: MenuItem) => void;
  }
  
  const {
    newItem,
    selectedParentPath,
    editingIndex,
    availablePaths,
    onSave,
    onReset,
    onDelete,
    onParentPathChange,
    onItemChange
  }: Props = $props();
  
  function updateItem(updates: Partial<MenuItem>) {
    onItemChange({ ...newItem, ...updates });
  }
  
  function updatePageConfig(updates: Partial<MenuItem['pageConfig']>) {
    onItemChange({
      ...newItem,
      pageConfig: { ...newItem.pageConfig, ...updates }
    });
  }
</script>

<div class="h-full flex flex-col">
  <div class="border-b border-gray-200 p-3">
    <h3 class="font-medium text-sm text-gray-900">
      {editingIndex === undefined ? 'Add New Route' : 'Edit Route'}
    </h3>
  </div>
  
  <div class="flex-1 overflow-y-auto p-3 space-y-3">
  
  <Inps 
    type="select" 
    label="Parent Module" 
    value={selectedParentPath}
    items={availablePaths}
    change={(value) => onParentPathChange(value)} />
  
  <Text 
    id="new_name" 
    name="name" 
    label="Name" 
    value={newItem.name}
    input={(e) => updateItem({ name: e.target.value })} />
    
  <Text 
    id="new_path" 
    name="path" 
    label="Path" 
    value={newItem.path}
    input={(e) => updateItem({ path: e.target.value })} />
    
  <Text 
    id="new_icon" 
    name="icon" 
    label="SVG Icon" 
    value={newItem.icon}
    input={(e) => updateItem({ icon: e.target.value })} />
  
  <div class="flex items-center gap-2">
    <input 
      type="checkbox" 
      id="visible" 
      checked={newItem.visible}
      onchange={(e) => updateItem({ visible: e.target.checked })} />
    <label for="visible">Visible in navigation</label>
  </div>

  </div>
  
  <div class="border-t border-gray-200 p-3">
    <div class="flex flex-col gap-2">
      <Btn 
        style="!bg-blue-600 hover:!bg-blue-700 !text-white text-sm" 
        clicks={onSave} 
        label={editingIndex === undefined ? 'Add Route' : 'Update Route'} />
      <div class="flex gap-2">
        <Btn 
          style="!bg-gray-200 hover:!bg-gray-300 !text-gray-700 text-sm flex-1" 
          clicks={onReset} 
          label="Reset" />
        {#if editingIndex !== undefined && onDelete}
          <Btn 
            style="!bg-red-100 hover:!bg-red-200 !text-red-700 text-sm flex-1" 
            clicks={onDelete} 
            label="Delete" />
        {/if}
      </div>
    </div>
  </div>
</div>