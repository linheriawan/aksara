<script lang="ts">
  import Text from '$lib/components/inp/text.svelte';
  import Btn from '$lib/components/inp/btn.svelte';
  import Inps from '$lib/components/inps.svelte';
  import type { MenuItem } from '$lib/core/routes';
  import type { AdvancedMenuItem, RouteCategory, WebPageType, APIEndpointType, HTTPMethod } from '$lib/core/advanced-routes';
  import { RouteManager } from '$lib/core/routes';
  
  interface Props {
    selectedRoute: MenuItem | null;
    newItem: MenuItem;
    availableObjects: string[];
    availableDataSources?: string[];
    onSave: () => void;
    onReset: () => void;
    onItemChange: (item: MenuItem) => void;
  }
  
  const {
    selectedRoute,
    newItem,
    availableObjects,
    availableDataSources = [],
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
    console.log('updatePageConfig called with:', updates);
    const updated = {
      ...newItem,
      pageConfig: { ...newItem.pageConfig, ...updates }
    };
    console.log('Updated item:', updated);
    onItemChange(updated);
  }
  
  function updateAdvancedConfig(category: RouteCategory, updates: any) {
    const currentConfig = (newItem as any).advancedConfig || { category: 'web' };
    onItemChange({
      ...newItem,
      advancedConfig: {
        ...currentConfig,
        category,
        [category]: {
          ...currentConfig[category],
          ...updates
        }
      }
    });
  }
  
  function getAdvancedConfig() {
    return (newItem as any).advancedConfig || { category: 'web' };
  }
  
  function isAdvancedMode() {
    return !!(newItem as any).advancedConfig;
  }
  
  function enableAdvancedMode() {
    onItemChange({
      ...newItem,
      advancedConfig: {
        category: 'web',
        web: {
          type: 'data-list',
          dataSource: '',
          objectSchema: ''
        }
      }
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

<div class="h-full flex flex-col">
  {#if selectedRoute}
    <div class="border-b border-gray-200 p-3">
      <h3 class="font-medium text-sm text-gray-900 flex items-center">
        <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
        Properties: {selectedRoute.name}
      </h3>
    </div>
    
    
    <div class="space-y-3">
      <!-- Page Description -->
      <div class="border border-gray-200 p-3 rounded bg-white">
        <h3 class="font-semibold mb-3">Page Details</h3>
        <Text 
          id="page_description" 
          name="description" 
          label="Page Description" 
          value={newItem.pageConfig.description || ''}
          input={(e) => updatePageConfig({ description: e.target.value })} />
          
        {#if !isAdvancedMode()}
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
        {:else}
          <Inps 
            type="select" 
            label="Route Category" 
            value={getAdvancedConfig().category || 'web'}
            items={[
              { label: "Web Application", value: "web" },
              { label: "API Endpoint", value: "api" },
              { label: "System Route", value: "system" }
            ]}
            change={(value) => updateAdvancedConfig(value as RouteCategory, {})} />
        {/if}
      
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
          name="objectRef"
          value={newItem.pageConfig.objectRef || ''}
          items={(() => {
            const items = [{ label: "None", value: "" }, ...availableObjects.map(obj => ({ 
              label: obj, 
              value: obj 
            }))];
            console.log('Object Reference items:', items, 'current value:', newItem.pageConfig.objectRef);
            return items;
          })()}
          change={(e) => {
            console.log('Object Reference changed:', e.target.value);
            updatePageConfig({ objectRef: e.target.value });
          }} />
        
        <!-- Advanced Mode Toggle -->
        <div class="flex items-center gap-2 mt-3">
          <input 
            type="checkbox" 
            id="advanced_mode" 
            checked={isAdvancedMode()}
            onchange={(e) => e.target.checked ? enableAdvancedMode() : onItemChange({ ...newItem, advancedConfig: undefined })} />
          <label for="advanced_mode" class="text-sm font-medium">Enable Advanced Configuration</label>
        </div>
      </div>
      
      <!-- Advanced Configuration -->
      {#if isAdvancedMode()}
        {#if getAdvancedConfig().category === 'web'}
          <div class="border p-3 rounded">
            <h4 class="font-medium mb-3">Web Application Configuration</h4>
            <div class="space-y-3">
              <Inps 
                type="select" 
                label="Page Type" 
                value={getAdvancedConfig().web?.type || 'data-list'}
                items={[
                  { label: "Data List (Table/Grid)", value: "data-list" },
                  { label: "Data View (Single Record)", value: "data-view" },
                  { label: "Data Form (Create/Edit)", value: "data-form" },
                  { label: "Dashboard", value: "dashboard" },
                  { label: "Custom Component", value: "custom" },
                  { label: "Redirect", value: "redirect" }
                ]}
                change={(value) => updateAdvancedConfig('web', { type: value })} />
              
              {#if getAdvancedConfig().web?.type !== 'custom' && getAdvancedConfig().web?.type !== 'redirect'}
                <Inps 
                  type="select" 
                  label="Data Source" 
                  name="webDataSource"
                  value={getAdvancedConfig().web?.dataSource || ''}
                  items={[{ label: "Select Data Source", value: "" }, ...availableDataSources.map(ds => ({ label: ds, value: ds }))]}
                  change={(e) => updateAdvancedConfig('web', { dataSource: e.target.value })} />
                
                <Inps 
                  type="select" 
                  label="Object Schema" 
                  name="webObjectSchema"
                  value={getAdvancedConfig().web?.objectSchema || ''}
                  items={[{ label: "Select Object Schema", value: "" }, ...availableObjects.map(obj => ({ label: obj, value: obj }))]}
                  change={(e) => updateAdvancedConfig('web', { objectSchema: e.target.value })} />
              {/if}
              
              {#if getAdvancedConfig().web?.type === 'data-list'}
                <Text 
                  id="columns_advanced" 
                  name="columns" 
                  label="Display Columns (comma-separated)" 
                  value={getAdvancedConfig().web?.dataList?.columns?.join(', ') || ''}
                  placeholder="id, name, email, status"
                  input={(e) => updateAdvancedConfig('web', { 
                    dataList: { 
                      ...getAdvancedConfig().web?.dataList, 
                      columns: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    } 
                  })} />
                
                <Text 
                  id="search_fields" 
                  name="searchFields" 
                  label="Searchable Fields (comma-separated)" 
                  value={getAdvancedConfig().web?.dataList?.searchFields?.join(', ') || ''}
                  placeholder="name, email"
                  input={(e) => updateAdvancedConfig('web', { 
                    dataList: { 
                      ...getAdvancedConfig().web?.dataList, 
                      searchFields: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    } 
                  })} />
                
                <input 
                  type="number" 
                  placeholder="Page Size" 
                  value={getAdvancedConfig().web?.dataList?.pagination?.pageSize || 20}
                  onchange={(e) => updateAdvancedConfig('web', { 
                    dataList: { 
                      ...getAdvancedConfig().web?.dataList, 
                      pagination: { 
                        ...getAdvancedConfig().web?.dataList?.pagination, 
                        pageSize: parseInt(e.target.value) 
                      } 
                    } 
                  })}
                  class="mt-1 w-full border rounded px-2 py-1" />
              {:else if getAdvancedConfig().web?.type === 'data-form'}
                <Inps 
                  type="select" 
                  label="Form Mode" 
                  value={getAdvancedConfig().web?.dataForm?.mode || 'create'}
                  items={[
                    { label: "Create", value: "create" },
                    { label: "Edit", value: "edit" },
                    { label: "View", value: "view" }
                  ]}
                  change={(value) => updateAdvancedConfig('web', { 
                    dataForm: { 
                      ...getAdvancedConfig().web?.dataForm, 
                      mode: value 
                    } 
                  })} />
                
                <Text 
                  id="form_fields" 
                  name="fields" 
                  label="Form Fields (comma-separated)" 
                  value={getAdvancedConfig().web?.dataForm?.sections?.[0]?.fields?.join(', ') || ''}
                  placeholder="name, email, role, active"
                  input={(e) => updateAdvancedConfig('web', { 
                    dataForm: { 
                      ...getAdvancedConfig().web?.dataForm, 
                      sections: [{ 
                        id: 'main', 
                        title: 'Main Information', 
                        fields: e.target.value.split(',').map(s => s.trim()).filter(s => s), 
                        layout: 'two-column' 
                      }] 
                    } 
                  })} />
              {:else if getAdvancedConfig().web?.type === 'custom'}
                <Text 
                  id="component_path_advanced" 
                  name="componentPath" 
                  label="Component Path" 
                  value={getAdvancedConfig().web?.custom?.componentPath || ''}
                  placeholder="$lib/components/pages/CustomPage.svelte"
                  input={(e) => updateAdvancedConfig('web', { 
                    custom: { 
                      ...getAdvancedConfig().web?.custom, 
                      componentPath: e.target.value 
                    } 
                  })} />
              {:else if getAdvancedConfig().web?.type === 'redirect'}
                <Text 
                  id="redirect_target" 
                  name="target" 
                  label="Redirect Target" 
                  value={getAdvancedConfig().web?.redirect?.target || ''}
                  placeholder="/other/page or https://external.com"
                  input={(e) => updateAdvancedConfig('web', { 
                    redirect: { 
                      ...getAdvancedConfig().web?.redirect, 
                      target: e.target.value 
                    } 
                  })} />
                
                <div class="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="permanent_redirect" 
                    checked={getAdvancedConfig().web?.redirect?.permanent || false}
                    onchange={(e) => updateAdvancedConfig('web', { 
                      redirect: { 
                        ...getAdvancedConfig().web?.redirect, 
                        permanent: e.target.checked 
                      } 
                    })} />
                  <label for="permanent_redirect">Permanent Redirect (301)</label>
                </div>
              {/if}
            </div>
          </div>
        {:else if getAdvancedConfig().category === 'api'}
          <div class="border p-3 rounded">
            <h4 class="font-medium mb-3">API Endpoint Configuration</h4>
            <div class="space-y-3">
              <Inps 
                type="select" 
                label="API Type" 
                value={getAdvancedConfig().api?.type || 'crud'}
                items={[
                  { label: "CRUD Operations", value: "crud" },
                  { label: "Custom Handler", value: "custom" },
                  { label: "Proxy to External API", value: "proxy" },
                  { label: "Webhook Receiver", value: "webhook" }
                ]}
                change={(value) => updateAdvancedConfig('api', { type: value })} />
              
              {#if getAdvancedConfig().api?.type === 'crud'}
                <Inps 
                  type="select" 
                  label="Data Source" 
                  name="apiDataSource"
                  value={getAdvancedConfig().api?.crud?.dataSource || ''}
                  items={[{ label: "Select Data Source", value: "" }, ...availableDataSources.map(ds => ({ label: ds, value: ds }))]}
                  change={(e) => updateAdvancedConfig('api', { 
                    crud: { 
                      ...getAdvancedConfig().api?.crud, 
                      dataSource: e.target.value 
                    } 
                  })} />
                
                <Inps 
                  type="select" 
                  label="Object Schema" 
                  name="apiObjectSchema"
                  value={getAdvancedConfig().api?.crud?.objectSchema || ''}
                  items={[{ label: "Select Object Schema", value: "" }, ...availableObjects.map(obj => ({ label: obj, value: obj }))]}
                  change={(e) => updateAdvancedConfig('api', { 
                    crud: { 
                      ...getAdvancedConfig().api?.crud, 
                      objectSchema: e.target.value 
                    } 
                  })} />
                
                <div class="mt-3">
                  <label class="block font-medium mb-2">CRUD Operations:</label>
                  <div class="grid grid-cols-2 gap-2">
                    {#each ['create', 'read', 'update', 'delete', 'list'] as operation}
                      <label class="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={getAdvancedConfig().api?.crud?.operations?.includes(operation) || false}
                          onchange={(e) => {
                            const current = getAdvancedConfig().api?.crud?.operations || [];
                            const updated = e.target.checked 
                              ? [...current, operation]
                              : current.filter(op => op !== operation);
                            updateAdvancedConfig('api', { 
                              crud: { 
                                ...getAdvancedConfig().api?.crud, 
                                operations: updated 
                              } 
                            });
                          }} />
                        <span class="capitalize">{operation}</span>
                      </label>
                    {/each}
                  </div>
                </div>
              {:else if getAdvancedConfig().api?.type === 'custom'}
                <Inps 
                  type="select" 
                  label="HTTP Method" 
                  value={getAdvancedConfig().api?.custom?.method || 'GET'}
                  items={[
                    { label: "GET", value: "GET" },
                    { label: "POST", value: "POST" },
                    { label: "PUT", value: "PUT" },
                    { label: "PATCH", value: "PATCH" },
                    { label: "DELETE", value: "DELETE" }
                  ]}
                  change={(value) => updateAdvancedConfig('api', { 
                    custom: { 
                      ...getAdvancedConfig().api?.custom, 
                      method: value 
                    } 
                  })} />
                
                <Text 
                  id="handler_path" 
                  name="handler" 
                  label="Handler Path" 
                  value={getAdvancedConfig().api?.custom?.handler || ''}
                  placeholder="src/routes/api/custom-handler/+server.ts"
                  input={(e) => updateAdvancedConfig('api', { 
                    custom: { 
                      ...getAdvancedConfig().api?.custom, 
                      handler: e.target.value 
                    } 
                  })} />
              {:else if getAdvancedConfig().api?.type === 'proxy'}
                <Text 
                  id="proxy_target" 
                  name="targetUrl" 
                  label="Target URL" 
                  value={getAdvancedConfig().api?.proxy?.targetUrl || ''}
                  placeholder="https://api.external.com/v1"
                  input={(e) => updateAdvancedConfig('api', { 
                    proxy: { 
                      ...getAdvancedConfig().api?.proxy, 
                      targetUrl: e.target.value 
                    } 
                  })} />
                
                <div class="mt-3">
                  <label class="block font-medium mb-2">Allowed Methods:</label>
                  <div class="grid grid-cols-3 gap-2">
                    {#each ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as method}
                      <label class="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={getAdvancedConfig().api?.proxy?.method?.includes(method) || false}
                          onchange={(e) => {
                            const current = getAdvancedConfig().api?.proxy?.method || [];
                            const updated = e.target.checked 
                              ? [...current, method]
                              : current.filter(m => m !== method);
                            updateAdvancedConfig('api', { 
                              proxy: { 
                                ...getAdvancedConfig().api?.proxy, 
                                method: updated 
                              } 
                            });
                          }} />
                        <span>{method}</span>
                      </label>
                    {/each}
                  </div>
                </div>
              {:else if getAdvancedConfig().api?.type === 'webhook'}
                <Text 
                  id="webhook_handler" 
                  name="handler" 
                  label="Handler Path" 
                  value={getAdvancedConfig().api?.webhook?.handler || ''}
                  placeholder="src/routes/api/webhook-handler/+server.ts"
                  input={(e) => updateAdvancedConfig('api', { 
                    webhook: { 
                      ...getAdvancedConfig().api?.webhook, 
                      handler: e.target.value 
                    } 
                  })} />
                
                <Inps 
                  type="select" 
                  label="Content Type" 
                  value={getAdvancedConfig().api?.webhook?.contentType || 'json'}
                  items={[
                    { label: "JSON", value: "json" },
                    { label: "Form Data", value: "form" },
                    { label: "Raw", value: "raw" }
                  ]}
                  change={(value) => updateAdvancedConfig('api', { 
                    webhook: { 
                      ...getAdvancedConfig().api?.webhook, 
                      contentType: value 
                    } 
                  })} />
                
                <Inps 
                  type="select" 
                  label="Validation" 
                  value={getAdvancedConfig().api?.webhook?.validation || 'none'}
                  items={[
                    { label: "None", value: "none" },
                    { label: "Signature", value: "signature" },
                    { label: "Token", value: "token" }
                  ]}
                  change={(value) => updateAdvancedConfig('api', { 
                    webhook: { 
                      ...getAdvancedConfig().api?.webhook, 
                      validation: value 
                    } 
                  })} />
              {/if}
            </div>
          </div>
        {/if}
      {:else}
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
              change={(value) => updateConfig({ layout: value })} />
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
              change={(value) => updateConfig({ targetType: value })} />
            
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

    </div>
    
    <div class="border-t border-gray-200 p-3">
      <div class="flex flex-col gap-2">
        <Btn 
          style="!bg-blue-600 hover:!bg-blue-700 !text-white text-sm" 
          clicks={onSave} 
          label="Apply Changes" />
        <Btn 
          style="!bg-gray-200 hover:!bg-gray-300 !text-gray-700 text-sm" 
          clicks={onReset} 
          label="Close Panel" />
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-center h-full p-4">
      <div class="text-center">
        <div class="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
          <span class="text-gray-400 text-xl">⚙️</span>
        </div>
        <h3 class="font-medium text-gray-900 mb-1">No Route Selected</h3>
        <p class="text-sm text-gray-500">Select a route to view advanced properties</p>
      </div>
    </div>
  {/if}
</div>