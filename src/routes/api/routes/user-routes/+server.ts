import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'yaml';

const USER_ROUTES_PATH = join(process.cwd(), 'src/lib/workspace/routes/user-routes.yaml');

export const GET: RequestHandler = async () => {
  try {
    const yamlContent = await readFile(USER_ROUTES_PATH, 'utf-8');
    return new Response(yamlContent, {
      headers: { 'Content-Type': 'application/x-yaml' }
    });
  } catch (error) {
    console.error('Error loading user routes:', error);
    return json({ error: 'Failed to load user routes' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const yamlContent = await request.text();
    
    // Validate YAML
    try {
      yaml.parse(yamlContent);
    } catch (parseError) {
      return json({ error: 'Invalid YAML format' }, { status: 400 });
    }
    
    await writeFile(USER_ROUTES_PATH, yamlContent, 'utf-8');
    
    return json({ 
      success: true, 
      message: 'User routes saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving user routes:', error);
    return json({ error: 'Failed to save user routes' }, { status: 500 });
  }
};