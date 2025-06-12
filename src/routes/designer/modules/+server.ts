import type { RequestHandler } from '@sveltejs/kit';
import type { MenuItem } from '$lib/types/routes';
import * as fs from 'fs/promises';
import * as nfs from 'fs';
import * as path from 'path';

const filePath = path.resolve('src/lib/generated/routes.json');
const rdir = 'src/routes/';
const DEFAULT_PAGE_FILE = '+page.svelte';
const DEFAULT_PAGE_TEMPLATE = `<script>
  // Auto-generated page
</script>
<h1>Page</h1>
`;
export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  try {
    const write=await processRoutes(data.routes);
    nfs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return new Response(JSON.stringify({ success: true, write }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: `Failed to write file `+ err }), { status: 500 });
  }
};

async function processRoutes(routes: MenuItem[]) {
  for (const route of routes) {
    const fullPath = route.path;
    console.log(`checking ${fullPath}...`)
    await ensureRouteDir(fullPath);
    if (route.children && route.children.length > 0) {
      await processRoutes(route.children);
    }
  }
}
async function ensureRouteDir(routePath: string) {
  const dirPath = path.join(rdir, routePath);
  const pageFilePath = path.join(dirPath, DEFAULT_PAGE_FILE);

  // 1. Create directory if it doesn't exist
  await fs.mkdir(dirPath, { recursive: true });

  // 2. Create +page.svelte file if not exists
  try {
    await fs.access(pageFilePath);
    // File exists, do nothing
  } catch {
    // File doesn't exist, create it
    await fs.writeFile(pageFilePath, DEFAULT_PAGE_TEMPLATE);
    console.log(`Created: ${pageFilePath}`);
  }
}