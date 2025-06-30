<script lang="ts">
  import Text from '$lib/components/inp/text.svelte';
  import Btn from '$lib/components/inp/btn.svelte';
  import Inps from '$lib/components/inps.svelte';
  import type { MenuItem } from './route';
  import { RouteManager } from './route';
  
  interface Props {
    selectedRoute: MenuItem | null;
    newItem: MenuItem;
    availableObjects: string[];
    onSave: () => void;
    onReset: () => void;
    onItemChange: (item: MenuItem) => void;
  }
  
  const {
    selectedRoute,
    newItem,
    availableObjects,
    onSave,
    onReset,
    onItemChange
  }: Props = $props();
  
  // String representations for easier editing
  let strings = $state({
    columnsString: '',
    filtersString: '',
    sectionsString: '',
    widgetsString: '',
    propsJsonString: '{}'
  });
  
  // Sync strings when newItem changes
  $effect(() => {
    if (newItem) {
      strings = RouteManager.getStringsFromItem(newItem);
    }
  });
  
  function updateConfigFromStrings() {
    RouteManager.updateConfigFromStrings(newItem, strings);
    onItemChange(newItem);
  }
  
  function updateItem(updates: Partial<MenuItem>) {
    onItemChange({ ...newItem, ...updates });
  }
  
  function updatePageConfig(updates: Partial<MenuItem['pageConfig']>) {
    onItemChange({
      ...newItem,
      pageConfig: { ...newItem.pageConfig, ...updates }
    });
  }
  
  function updateConfig(updates: Record<string, any>) {
    onItemChange({
      ...newItem,
      pageConfig: {
        ...newItem.pageConfig,
        config: { ...newItem.pageConfig.config, ...updates }
      }
    });
  }
</script>

<div class="h-full overflow-scroll p-4">
  {#if selectedRoute}
    <h2 class="text-xl font-semibold mb-4">
      Advanced Settings: {selectedRoute.name}
    </h2>
    
    <div class="space-y-4">
      <!-- Page Description -->
      <div class="border p-3 rounded">
        <h3 class="font-semibold mb-3">Page Details</h3>
        <Text 
          id="page_description" 
          name="description" 
          label="Page Description" 
          value={newItem.pageConfig.description || ''}
          input={(e) => updatePageConfig({ description: e.target.value })} />
          
        <Inps 
          type="select" 
          label="Page Type" 
          value={newItem.pageConfig.type}
          items={[
            { label: "Listing", value: "listing" },
            { label: "Dashboard", value: "dashboard" },
            { label: "Form", value: "form" },
            { label: "Component", value: "component" },
            { label: "Link", value: "link" }
          ]}
          change={(value) => updatePageConfig({ type: value })} />
      
        <Inps 
          type="text" 
          id="page_title" 
          name="title" 
          label="Page Title" 
          value={newItem.pageConfig.title || ''}
          input={(e) => updatePageConfig({ title: e.target.value })} />
        
        <Inps 
          type="text" 
          id="component_path" 
          name="componentPath" 
          label="Component Path" 
          value={newItem.pageConfig.componentPath || ''}
          placeholder="$lib/components/pages/MyPage.svelte"
          input={(e) => updatePageConfig({ componentPath: e.target.value })} />
        
        <Inps 
          type="select" 
          label="Object Reference" 
          value={newItem.pageConfig.objectRef || ''}
          items={[{ label: "None", value: "" }, ...availableObjects.map(obj => ({ 
            label: obj, 
            value: obj 
          }))]}
          onchange={(value) => updatePageConfig({ objectRef: value })} />
      </div>
          
      <!-- Page Type Specific Configuration -->
      {#if newItem.pageConfig.type === 'listing'}
        <div class="border p-3 rounded">
          <h4 class="font-medium mb-3">Listing Configuration</h4>
          <div class="space-y-3">
            <Text 
              id="columns" 
              name="columns" 
              label="Columns (comma-separated)" 
              value={strings.columnsString}
              placeholder="name, email, status"
              input={(e) => { strings.columnsString = e.target.value; updateConfigFromStrings(); }} />
            
            <Text 
              id="filters" 
              name="filters" 
              label="Filters (comma-separated)" 
              value={strings.filtersString}
              placeholder="status, role, active"
              input={(e) => { strings.filtersString = e.target.value; updateConfigFromStrings(); }} />
            
            <input 
              type="number" 
              placeholder="Page Size" 
              value={newItem.pageConfig.config?.pageSize || 20}
              onchange={(e) => updateConfig({ pageSize: parseInt(e.target.value) })}
              class="mt-1 w-full border rounded px-2 py-1" />
          </div>
        </div>
        
      {:else if newItem.pageConfig.type === 'form'}
        <div class="border p-3 rounded">
          <h4 class="font-medium mb-3">Form Configuration</h4>
          <div class="space-y-3">
            <Text 
              id="sections" 
              name="sections" 
              label="Sections (comma-separated)" 
              value={strings.sectionsString}
              placeholder="basic, details, settings"
              input={(e) => { strings.sectionsString = e.target.value; updateConfigFromStrings(); }} />
            
            <Inps 
              type="select" 
              label="Layout" 
              value={newItem.pageConfig.config?.layout || 'single'}
              items={[
                { label: "Single", value: "single" },
                { label: "Tabbed", value: "tabbed" },
                { label: "Modal", value: "modal" }
              ]}
              onchange={(value) => updateConfig({ layout: value })} />
          </div>
        </div>
        
      {:else if newItem.pageConfig.type === 'link'}
        <div class="border p-3 rounded">
          <h4 class="font-medium mb-3">Link Configuration</h4>
          <div class="space-y-3">
            <Inps 
              type="select" 
              label="Target Type" 
              value={newItem.pageConfig.config?.targetType || 'route'}
              items={[
                { label: "Route", value: "route" },
                { label: "Component", value: "component" },
                { label: "External", value: "external" }
              ]}
              onchange={(value) => updateConfig({ targetType: value })} />
            
            <Text 
              id="target" 
              name="target" 
              label="Target" 
              value={newItem.pageConfig.config?.target || ''}
              placeholder={newItem.pageConfig.config?.targetType === 'external' ? 'https://example.com' : 
                         newItem.pageConfig.config?.targetType === 'component' ? '$lib/components/Component.svelte' : '/route/path'}
              input={(e) => updateConfig({ target: e.target.value })} />
            
            <div class="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="new_tab" 
                checked={newItem.pageConfig.config?.openInNewTab || false}
                onchange={(e) => updateConfig({ openInNewTab: e.target.checked })} />
              <label for="new_tab">Open in New Tab</label>
            </div>
          </div>
        </div>
        
      {:else if newItem.pageConfig.type === 'dashboard'}
        <div class="border p-3 rounded">
          <h4 class="font-medium mb-3">Dashboard Configuration</h4>
          <div class="space-y-3">
            <Text 
              id="widgets" 
              name="widgets" 
              label="Widgets (comma-separated)" 
              value={strings.widgetsString}
              placeholder="userCount, chartRevenue, tableRecent"
              input={(e) => { strings.widgetsString = e.target.value; updateConfigFromStrings(); }} />
          </div>
        </div>
      {/if}
      
      <!-- Additional Props -->
      <div class="border p-3 rounded">
        <h4 class="font-medium mb-3">Additional Props</h4>
        <div>
          <label class="block font-medium mb-2">Props (JSON):</label>
          <textarea 
            bind:value={strings.propsJsonString}
            placeholder='&#123;"theme": "dark", "editable": true&#125;' 
            class="w-full border rounded px-2 py-1 text-sm font-mono" 
            rows="3"
            oninput={updateConfigFromStrings}></textarea>
        </div>
      </div>

      <div class="flex gap-2 pt-4 border-t">
        <Btn 
          style="!bg-green-300 hover:!bg-blue-300" 
          clicks={onSave} 
          label="Update Settings" />
        <Btn 
          style="!bg-gray-300 hover:!bg-gray-400" 
          clicks={onReset} 
          label="Cancel" />
      </div>
    </div>
  {:else}
    <div class="p-4 text-center">
      <h2 class="text-xl font-semibold mb-4">Advanced Route Settings</h2>
      <p class="text-gray-500 mb-4">Select a route from the Modules tab to configure advanced settings.</p>            
    </div>
  {/if}
</div>