<script lang="ts">
  import Text from '$lib/components/inp/text.svelte';
  import Btn from '$lib/components/inp/btn.svelte';
  import Inps from '$lib/components/inps.svelte';
  import type { MenuItem } from './route';
  import { RouteManager } from './route';
  
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

<div class="p-3 space-y-3">
  <h3 class="font-semibold">
    {editingIndex === undefined ? 'Add New Route' : 'Edit Route'}
  </h3>
  
  <Inps 
    type="select" 
    label="Parent Module" 
    value={selectedParentPath}
    items={availablePaths}
    onchange={(value) => onParentPathChange(value)} />
  
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

  <div class="flex gap-2 pt-4 border-t">
    <Btn 
      style="!bg-green-300 hover:!bg-blue-300" 
      clicks={onSave} 
      label={editingIndex === undefined ? 'Add' : 'Update'} />
    <Btn 
      style="!bg-gray-300 hover:!bg-gray-400" 
      clicks={onReset} 
      label="Reset" />
    {#if editingIndex !== undefined && onDelete}
      <Btn 
        style="!bg-red-300 hover:!bg-red-400" 
        clicks={onDelete} 
        label="Delete" />
    {/if}
  </div>
</div>