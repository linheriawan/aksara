import type { RequestHandler } from '@sveltejs/kit';
import type { MenuItem, RouteConfig, PageConfig } from './route';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

const configFilePath = path.resolve('src/lib/generated/routes.yaml');
const rdir = 'src/routes/';

// Simple page template that just loads your existing components
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
    const yamlContent = await fs.readFile(configFilePath, 'utf-8');
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
    
    // Process routes and generate simple page files
    const generationResults = await processRoutes(routeConfig.routes);
    
    // Save the YAML configuration
    const yamlString = yaml.stringify(routeConfig, { 
      indent: 2,
      lineWidth: 120,
      minContentWidth: 20 
    });
    
    await fs.writeFile(configFilePath, yamlString, 'utf-8');
    
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
      
      // Generate simple page that loads your component
      if (route.pageConfig) {
        // const pageContent = generateSimplePageTemplate(route.pageConfig);
        // const pageFilePath = path.join(rdir, fullPath, '+page.svelte');
        
        // await fs.writeFile(pageFilePath, pageContent);
        // generated.push(`Generated: ${pageFilePath}`);
        // console.log(`Generated page: ${pageFilePath}`);
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