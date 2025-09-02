import type { RequestHandler } from '@sveltejs/kit';
import type { MenuItem, RouteConfig, PageConfig } from './route';
import type { AdvancedMenuItem, HTTPMethod, CRUDOperation } from '$lib/core/advanced-routes';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

const workspaceFilePath = path.resolve('src/lib/workspace/routes.yaml');
const defaultsFilePath = path.resolve('src/lib/defaults/routes-default.json');
const runtimeFilePath = path.resolve('src/lib/runtime/routes.json');
const rdir = 'src/routes/';

// Route compilation function
async function compileRoutes(): Promise<void> {
  try {
    console.log('🔧 Compiling routes...');
    
    // Load default system routes
    let defaultRoutes: MenuItem[] = [];
    try {
      const defaultData = JSON.parse(await fs.readFile(defaultsFilePath, 'utf-8'));
      defaultRoutes = defaultData.routes || [];
    } catch (error) {
      console.warn('⚠️ No default routes found');
    }
    
    // Load workspace routes  
    let workspaceRoutes: MenuItem[] = [];
    try {
      const workspaceData = yaml.parse(await fs.readFile(workspaceFilePath, 'utf-8'));
      workspaceRoutes = workspaceData.routes || [];
    } catch (error) {
      console.warn('⚠️ No workspace routes found');
    }
    
    // Combine routes (workspace first, then defaults)
    const allRoutes = [
      ...workspaceRoutes.map(route => ({ ...route, system: false, readonly: false })),
      ...defaultRoutes.map(route => ({ ...route, system: true, readonly: true }))
    ];
    
    // Sort by order
    const sortedRoutes = allRoutes.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    // Create final configuration
    const finalConfig = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      routes: sortedRoutes
    };
    
    // Write to runtime
    await fs.writeFile(runtimeFilePath, JSON.stringify(finalConfig, null, 2), 'utf-8');
    console.log('✅ Routes compiled to runtime/routes.json');
    
  } catch (error) {
    console.error('❌ Route compilation failed:', error);
    throw error;
  }
}

// Generate advanced web page templates
function generateAdvancedPageTemplate(route: AdvancedMenuItem): string {
  const advancedConfig = (route as any).advancedConfig;
  
  if (!advancedConfig || advancedConfig.category !== 'web') {
    return generateSimplePageTemplate(route.pageConfig);
  }
  
  const webConfig = advancedConfig.web;
  const pageType = webConfig?.type || 'custom';
  
  switch (pageType) {
    case 'data-list':
      return generateDataListTemplate(route, webConfig);
    case 'data-form':
      return generateDataFormTemplate(route, webConfig);
    case 'data-view':
      return generateDataViewTemplate(route, webConfig);
    case 'dashboard':
      return generateDashboardTemplate(route, webConfig);
    case 'redirect':
      return generateRedirectTemplate(route, webConfig);
    default:
      return generateCustomPageTemplate(route, webConfig);
  }
}

// Generate API endpoint templates
function generateAPIEndpointTemplate(route: AdvancedMenuItem): string {
  const advancedConfig = (route as any).advancedConfig;
  
  if (!advancedConfig || advancedConfig.category !== 'api') {
    return '';
  }
  
  const apiConfig = advancedConfig.api;
  const apiType = apiConfig?.type || 'custom';
  
  switch (apiType) {
    case 'crud':
      return generateCRUDEndpointTemplate(route, apiConfig.crud);
    case 'custom':
      return generateCustomAPITemplate(route, apiConfig.custom);
    case 'proxy':
      return generateProxyEndpointTemplate(route, apiConfig.proxy);
    case 'webhook':
      return generateWebhookEndpointTemplate(route, apiConfig.webhook);
    default:
      return '';
  }
}

// Data List page template
function generateDataListTemplate(route: AdvancedMenuItem, webConfig: any): string {
  const { dataSource, objectSchema, dataList } = webConfig;
  
  return `<script lang="ts">
  import Dynagrid from '$lib/components/sct/dynagrid.svelte';
  import SctForm from '$lib/components/sct/form.svelte';
  import { goto } from '$app/navigation';
  
  const config = {
    dataSource: '${dataSource}',
    objectSchema: '${objectSchema}',
    pageSize: ${dataList?.pagination?.pageSize || 20},
    actions: ${JSON.stringify(dataList?.actions || [])}
  };
  
  let data = $state([]);
  let loading = $state(true);
  
  // For API mode, use the API endpoint
  const apiConfig = {
    apiurl: \`/api/\${config.dataSource}/\${config.objectSchema}\`,
    token: '' // Add token if needed
  };
  
  function handleRowClick(row) {
    // Navigate to edit/view page
    const editAction = config.actions.find(a => a.type === 'link' && a.id === 'edit');
    if (editAction) {
      goto(editAction.target.replace('{id}', row.id));
    } else {
      // Default: go to edit page
      goto('/${route.path}/\${row.id}');
    }
  }
  
  function handleAction(action, item) {
    if (action.confirmation && !confirm(action.confirmation)) {
      return;
    }
    
    switch (action.type) {
      case 'link':
        goto(action.target.replace('{id}', item.id));
        break;
      case 'api':
        // Handle API action
        fetch(action.target.replace('{id}', item.id), { method: action.method || 'POST' })
          .then(() => location.reload());
        break;
    }
  }
</script>

<svelte:head>
  <title>${route.pageConfig?.title || route.name}</title>
</svelte:head>

<SctForm>
  <svelte:fragment slot="pos">
    <h1 class="text-xl font-semibold">${route.pageConfig?.title || route.name}</h1>
  </svelte:fragment>
  
  <div class="h-full">
    <Dynagrid 
      data={apiConfig}
      title="${route.pageConfig?.title || route.name}"
      rowclick={handleRowClick}
      show={{ page: config.pageSize, filter: true, conf: true }} />
  </div>
</SctForm>`;
}

// Data Form page template  
function generateDataFormTemplate(route: AdvancedMenuItem, webConfig: any): string {
  const { dataSource, objectSchema, dataForm } = webConfig;
  
  return `<script lang="ts">
  import SctForm from '$lib/components/sct/form.svelte';
  import Btn from '$lib/components/inp/btn.svelte';
  import Text from '$lib/components/inp/text.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  const config = {
    dataSource: '${dataSource}',
    objectSchema: '${objectSchema}',
    mode: '${dataForm?.mode || 'create'}',
    submitAction: '${dataForm?.submitAction || 'saveAndClose'}'
  };
  
  let formData = $state({});
  let loading = $state(false);
  let saving = $state(false);
  let errors = $state({});
  
  const isReadonly = $derived(config.mode === 'view');
  const isNew = $derived(config.mode === 'create');
  
  // Load data for edit mode
  $effect(async () => {
    if (config.mode === 'edit' || config.mode === 'view') {
      const id = $page.params.id;
      if (id) {
        loading = true;
        try {
          const response = await fetch(\`/api/\${config.dataSource}/\${config.objectSchema}/\${id}\`);
          if (response.ok) {
            formData = await response.json();
          }
        } catch (error) {
          console.error('Failed to load data:', error);
        } finally {
          loading = false;
        }
      }
    }
  });
  
  async function handleSubmit(e) {
    e.preventDefault();
    saving = true;
    errors = {};
    
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew 
        ? \`/api/\${config.dataSource}/\${config.objectSchema}\`
        : \`/api/\${config.dataSource}/\${config.objectSchema}/\${$page.params.id}\`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        if (config.submitAction === 'saveAndClose') {
          goto('/${route.path.replace(/\/\[id\].*$/, '')}');
        } else if (config.submitAction === 'saveAndNew') {
          formData = {};
        }
      } else {
        const errorData = await response.json();
        errors = errorData.errors || { general: 'Save failed' };
      }
    } catch (error) {
      console.error('Save error:', error);
      errors = { general: 'Network error' };
    } finally {
      saving = false;
    }
  }
  
  function goBack() {
    goto('/${route.path.replace(/\/\[id\].*$/, '')}');
  }
</script>

<svelte:head>
  <title>${route.pageConfig?.title || route.name}</title>
</svelte:head>

<SctForm>
  <svelte:fragment slot="pos">
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center space-x-4">
        <button onclick={goBack} class="text-gray-500 hover:text-gray-700">← Back</button>
        <h1 class="text-xl font-semibold">
          {isNew ? 'Create' : config.mode === 'view' ? 'View' : 'Edit'} ${route.pageConfig?.title || route.name}
        </h1>
      </div>
    </div>
  </svelte:fragment>
  
  <div class="h-full overflow-y-auto">
    {#if loading}
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    {:else}
      <form onsubmit={handleSubmit} class="p-6 space-y-6">
        {#if errors.general}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        {/if}
        
        <!-- Dynamic form fields based on formData keys -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each Object.keys(formData) as field}
            <div>
              <Text 
                id={field}
                name={field}
                label={field.replace(/[_-]/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
                value={formData[field] || ''}
                disabled={isReadonly}
                error={errors[field]}
                input={(e) => formData[field] = e.target.value} />
            </div>
          {/each}
        </div>
        
        {#if !isReadonly}
          <div class="flex justify-end space-x-3 pt-6 border-t">
            <Btn 
              style="!bg-gray-200 hover:!bg-gray-300 !text-gray-700" 
              clicks={goBack}
              label="Cancel" />
            <Btn 
              style="!bg-blue-600 hover:!bg-blue-700 !text-white" 
              type="submit"
              disabled={saving}
              label={saving ? 'Saving...' : isNew ? 'Create' : 'Save'} />
          </div>
        {/if}
      </form>
    {/if}
  </div>
</SctForm>`;
}

// CRUD API endpoint template
function generateCRUDEndpointTemplate(route: AdvancedMenuItem, crudConfig: any): string {
  const { dataSource, objectSchema, operations = [] } = crudConfig;
  
  return `import type { RequestHandler } from '@sveltejs/kit';
import { DataAccessManager } from '$lib/core/data-server';

const dataAccess = new DataAccessManager();
const dataSource = '${dataSource}';
const objectSchema = '${objectSchema}';

${operations.includes('list') ? generateListEndpoint() : ''}
${operations.includes('create') ? generateCreateEndpoint() : ''}
${operations.includes('read') ? generateReadEndpoint() : ''}
${operations.includes('update') ? generateUpdateEndpoint() : ''}
${operations.includes('delete') ? generateDeleteEndpoint() : ''}

// Error handling utility
function handleError(error: any) {
  console.error('API Error:', error);
  return new Response(
    JSON.stringify({ error: error.message || 'Internal server error' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}

// Validation utility
function validateData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  // Add your validation logic here based on objectSchema
  return { valid: errors.length === 0, errors };
}`;
}

function generateListEndpoint(): string {
  return `
export const GET: RequestHandler = async ({ url }) => {
  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const size = parseInt(url.searchParams.get('size') || '20');
    const search = url.searchParams.get('search') || '';
    const sort = url.searchParams.get('sort') || 'id';
    const order = url.searchParams.get('order') || 'asc';
    
    const result = await dataAccess.list(dataSource, objectSchema, {
      page,
      size,
      search,
      sort,
      order
    });
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return handleError(error);
  }
};`;
}

function generateCreateEndpoint(): string {
  return `
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    const validation = validateData(data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await dataAccess.create(dataSource, objectSchema, data);
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return handleError(error);
  }
};`;
}

function generateReadEndpoint(): string {
  return `
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const result = await dataAccess.read(dataSource, objectSchema, id);
    
    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Record not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return handleError(error);
  }
};`;
}

function generateUpdateEndpoint(): string {
  return `
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const data = await request.json();
    
    const validation = validateData(data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await dataAccess.update(dataSource, objectSchema, id, data);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return handleError(error);
  }
};`;
}

function generateDeleteEndpoint(): string {
  return `
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    await dataAccess.delete(dataSource, objectSchema, id);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Record deleted' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
};`;
}

// Additional template generators for other page types
function generateDataViewTemplate(route: AdvancedMenuItem, webConfig: any): string {
  return generateSimplePageTemplate(route.pageConfig);
}

function generateDashboardTemplate(route: AdvancedMenuItem, webConfig: any): string {
  return generateSimplePageTemplate(route.pageConfig);
}

function generateRedirectTemplate(route: AdvancedMenuItem, webConfig: any): string {
  const target = webConfig?.redirect?.target || '/';
  const permanent = webConfig?.redirect?.permanent || false;
  
  return `<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    goto('${target}', { replaceState: ${permanent} });
  });
</script>`;
}

function generateCustomPageTemplate(route: AdvancedMenuItem, webConfig: any): string {
  const componentPath = webConfig?.custom?.componentPath || route.pageConfig?.componentPath;
  const props = webConfig?.custom?.props || {};
  
  if (!componentPath) {
    return generateSimplePageTemplate(route.pageConfig);
  }
  
  return `<script lang="ts">
  import CustomComponent from '${componentPath}';
  
  const props = ${JSON.stringify(props, null, 2)};
</script>

<svelte:head>
  <title>${route.pageConfig?.title || route.name}</title>
</svelte:head>

<CustomComponent {...props} />`;
}

function generateCustomAPITemplate(route: AdvancedMenuItem, customConfig: any): string {
  const method = customConfig?.method || 'GET';
  const handler = customConfig?.handler || '';
  
  return `import type { RequestHandler } from '@sveltejs/kit';

export const ${method}: RequestHandler = async ({ request, params, url }) => {
  try {
    // Custom API logic here
    // Handler path: ${handler}
    
    const result = {
      message: 'Custom API endpoint',
      method: '${method}',
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};`;
}

function generateProxyEndpointTemplate(route: AdvancedMenuItem, proxyConfig: any): string {
  const targetUrl = proxyConfig?.targetUrl || '';
  const methods = proxyConfig?.method || ['GET'];
  
  const methodHandlers = methods.map((method: string) => `
export const ${method}: RequestHandler = async ({ request, url }) => {
  try {
    const targetUrl = '${targetUrl}' + url.pathname + url.search;
    
    const response = await fetch(targetUrl, {
      method: '${method}',
      headers: request.headers,
      body: ['GET', 'HEAD'].includes('${method}') ? null : await request.text()
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Proxy error' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};`).join('');
  
  return `import type { RequestHandler } from '@sveltejs/kit';
${methodHandlers}`;
}

function generateWebhookEndpointTemplate(route: AdvancedMenuItem, webhookConfig: any): string {
  const handler = webhookConfig?.handler || '';
  const contentType = webhookConfig?.contentType || 'json';
  const validation = webhookConfig?.validation || 'none';
  
  return `import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Webhook validation
    ${validation === 'signature' ? 'const signature = request.headers.get(\'signature\');' : ''}
    ${validation === 'token' ? 'const token = request.headers.get(\'authorization\');' : ''}
    
    // Parse webhook payload
    let payload: any;
    const contentType = '${contentType}';
    
    if (contentType === 'json') {
      payload = await request.json();
    } else if (contentType === 'form') {
      payload = await request.formData();
    } else {
      payload = await request.text();
    }
    
    // Process webhook
    console.log('Webhook received:', payload);
    
    // Handler path: ${handler}
    // Add your webhook processing logic here
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: RequestHandler = async () => {
  return new Response('Webhook endpoint active', { status: 200 });
};`;
}

// Simple page template that just loads your existing components (backward compatibility)
function generateSimplePageTemplate(config: PageConfig): string {
  const componentPath = config.componentPath || '$lib/components/DefaultPage.svelte';
  
  return `<script lang="ts">
  ${componentPath ? `import PageComponent from '${componentPath}';` : ''}
  
  // Page configuration from route definition
  const pageConfig = ${JSON.stringify(config, null, 2)};
  
  // Pass configuration to your component
  const componentProps = {
    pageConfig,
    objectRef: pageConfig.objectRef,
    config: pageConfig.config || {},
    ...(pageConfig.config?.props || {})
  };
</script>

<svelte:head>
  <title>{pageConfig.title || 'Page'}</title>
  {#if pageConfig.description}
    <meta name="description" content={pageConfig.description} />
  {/if}
</svelte:head>

${componentPath ? 
  `<PageComponent {...componentProps} />` : 
  `<div class="p-4">
    <h1 class="text-2xl font-bold">{pageConfig.title || 'Page'}</h1>
    <p class="text-gray-600">Component path not configured: {pageConfig.componentPath || 'Not set'}</p>
    <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h2 class="font-medium">Configuration:</h2>
      <pre class="text-sm mt-2 overflow-auto">{JSON.stringify(pageConfig, null, 2)}</pre>
    </div>
  </div>`}`;
}

export const GET: RequestHandler = async () => {
  try {
    const yamlContent = await fs.readFile(workspaceFilePath, 'utf-8');
    return new Response(yamlContent, {
      status: 200,
      headers: { 'Content-Type': 'application/x-yaml' }
    });
  } catch (err) {
    return new Response('Configuration not found', { status: 404 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type');
    let routeConfig: RouteConfig;
    
    if (contentType?.includes('application/x-yaml')) {
      const yamlContent = await request.text();
      routeConfig = yaml.parse(yamlContent) as RouteConfig;
    } else {
      const jsonData = await request.json();
      routeConfig = jsonData as RouteConfig;
    }
    
    if (!routeConfig.routes || !Array.isArray(routeConfig.routes)) {
      throw new Error('Invalid route configuration: routes array is required');
    }
    
    // Process routes and generate page/API files
    const generationResults = await processRoutes(routeConfig.routes);
    
    // Save the YAML configuration to workspace
    const yamlString = yaml.stringify(routeConfig, { 
      indent: 2,
      lineWidth: 120,
      minContentWidth: 20 
    });
    
    await fs.writeFile(workspaceFilePath, yamlString, 'utf-8');
    
    // Compile routes: defaults + workspace → runtime
    await compileRoutes();
    
    return new Response(JSON.stringify({ 
      success: true, 
      generated: generationResults,
      message: 'Configuration saved and route files generated successfully'
    }), { status: 200 });
    
  } catch (err) {
    console.error('Error processing routes:', err);
    return new Response(JSON.stringify({ 
      error: `Failed to process configuration: ${err instanceof Error ? err.message : 'Unknown error'}` 
    }), { status: 500 });
  }
};

async function processRoutes(routes: MenuItem[]): Promise<string[]> {
  const generated: string[] = [];
  
  for (const route of routes) {
    try {
      const fullPath = route.path;
      console.log(`Processing route: ${fullPath}...`);
      
      await ensureRouteDir(fullPath);
      
      // Generate page or API endpoint based on configuration
      const advancedConfig = (route as any).advancedConfig;
      
      if (advancedConfig) {
        if (advancedConfig.category === 'web') {
          // Generate web page
          const pageContent = generateAdvancedPageTemplate(route as AdvancedMenuItem);
          const pageFilePath = path.join(rdir, fullPath, '+page.svelte');
          
          await fs.writeFile(pageFilePath, pageContent);
          generated.push(`Generated web page: ${pageFilePath}`);
          console.log(`Generated web page: ${pageFilePath}`);
          
        } else if (advancedConfig.category === 'api') {
          // Generate API endpoint
          const apiContent = generateAPIEndpointTemplate(route as AdvancedMenuItem);
          if (apiContent) {
            const apiFilePath = path.join(rdir, 'api', fullPath, '+server.ts');
            await fs.mkdir(path.dirname(apiFilePath), { recursive: true });
            
            await fs.writeFile(apiFilePath, apiContent);
            generated.push(`Generated API endpoint: ${apiFilePath}`);
            console.log(`Generated API endpoint: ${apiFilePath}`);
          }
        }
      } else if (route.pageConfig) {
        // Backward compatibility: generate simple page
        const pageContent = generateSimplePageTemplate(route.pageConfig);
        const pageFilePath = path.join(rdir, fullPath, '+page.svelte');
        
        await fs.writeFile(pageFilePath, pageContent);
        generated.push(`Generated page: ${pageFilePath}`);
        console.log(`Generated page: ${pageFilePath}`);
      }
      
      // Process children recursively
      if (route.children && route.children.length > 0) {
        const childResults = await processRoutes(route.children);
        generated.push(...childResults);
      }
      
    } catch (err) {
      console.error(`Error processing route ${route.path}:`, err);
      generated.push(`Error: ${route.path} - ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
  
  return generated;
}

async function ensureRouteDir(routePath: string): Promise<void> {
  const dirPath = path.join(rdir, routePath);
  await fs.mkdir(dirPath, { recursive: true });
}