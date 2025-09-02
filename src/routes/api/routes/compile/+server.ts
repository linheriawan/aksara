import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'yaml';

const DEFAULT_ROUTES_PATH = join(process.cwd(), 'src/lib/defaults/default-routes.json');
const USER_ROUTES_PATH = join(process.cwd(), 'src/lib/workspace/routes/user-routes.yaml');
const RUNTIME_ROUTES_PATH = join(process.cwd(), 'src/lib/runtime/routes.json');

export const POST: RequestHandler = async () => {
  try {
    console.log('Starting route compilation...');
    
    // Load default routes (system/designer routes)
    const defaultRoutesContent = await readFile(DEFAULT_ROUTES_PATH, 'utf-8');
    const defaultRoutes = JSON.parse(defaultRoutesContent);
    console.log('Loaded default routes:', defaultRoutes.routes.length);
    
    // Load user routes
    let userRoutes = { routes: [] };
    try {
      const userRoutesContent = await readFile(USER_ROUTES_PATH, 'utf-8');
      userRoutes = yaml.parse(userRoutesContent);
      console.log('Loaded user routes:', userRoutes.routes.length);
    } catch (error) {
      console.warn('No user routes found, using empty array');
    }
    
    // Merge routes: user routes first, then system routes (higher order)
    const compiledRoutes = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      routes: [
        ...userRoutes.routes || [],
        ...defaultRoutes.routes || []
      ]
    };
    
    // Sort routes by order
    compiledRoutes.routes.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    
    // Write to runtime/routes.json
    await writeFile(RUNTIME_ROUTES_PATH, JSON.stringify(compiledRoutes, null, 2), 'utf-8');
    
    console.log('Routes compiled successfully:', compiledRoutes.routes.length, 'total routes');
    
    return json({ 
      success: true, 
      message: 'Routes compiled successfully',
      totalRoutes: compiledRoutes.routes.length,
      userRoutes: userRoutes.routes?.length || 0,
      defaultRoutes: defaultRoutes.routes?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error compiling routes:', error);
    return json({ error: 'Failed to compile routes', details: error.message }, { status: 500 });
  }
};