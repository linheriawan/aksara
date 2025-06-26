// src/routes/designer/data/available-sources/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import mysql from 'mysql2/promise';
import type { DataSource } from '../conf';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { type, config } = await request.json();
    let sources: string[] = [];

    switch (type) {
      case 'mysql':
        sources = await getMySQLTables(config);
        break;
      case 'rest':
        sources = await getRESTEndpoints(config);
        break;
      case 'filesystem':
        sources = await getFileSystemSources(config);
        break;
      default:
        return json({ error: 'Unsupported data source type' }, { status: 400 });
    }

    return json({ sources });
  } catch (error) {
    console.error('Error fetching available sources:', error);
    return json({ 
      error: 'Failed to fetch available sources',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

async function getMySQLTables(config: any): Promise<string[]> {
  const connection = await mysql.createConnection({
    host: config.server,
    port: parseInt(config.port) || 3306,
    user: config.username,
    password: config.password,
    database: config.database
  });

  try {
    const [rows] = await connection.execute('SHOW TABLES');
    return (rows as any[]).map(row => Object.values(row)[0] as string);
  } finally {
    await connection.end();
  }
}

async function getRESTEndpoints(config: any): Promise<string[]> {
  // For REST APIs, we can try to discover endpoints or return common ones
  // This is a simplified implementation - in practice, you might want to:
  // 1. Check if there's an OpenAPI/Swagger spec
  // 2. Try common endpoint patterns
  // 3. Allow manual endpoint configuration
  
  try {
    const response = await fetch(`${config.baseUrl}/`, {
      method: 'GET',
      headers: getAuthHeaders(config)
    });
    
    if (response.ok) {
      // Try to parse response for endpoint discovery
      const data = await response.json();
      if (data.endpoints) {
        return data.endpoints;
      }
    }
  } catch (error) {
    console.log('Could not auto-discover REST endpoints:', error);
  }

  // Return common endpoint patterns as fallback
  return [
    'users',
    'products', 
    'orders',
    'categories',
    'customers',
    'items',
    'transactions',
    'accounts'
  ];
}

async function getFileSystemSources(config: any): Promise<string[]> {
  const basePath = join(process.cwd(), config.basePath);
  
  if (!existsSync(basePath)) {
    throw new Error(`Path does not exist: ${basePath}`);
  }

  try {
    const files = readdirSync(basePath);
    return files.filter(file => {
      // Filter by supported formats
      if (config.format === 'json') {
        return file.endsWith('.json');
      }
      // Add other format filters as needed
      return true;
    });
  } catch (error) {
    throw new Error(`Error reading directory: ${error}`);
  }
}
function getAuthHeaders(config: any): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (config.authentication === 'apikey' && config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  } else if (config.authentication === 'basic' && config.username && config.password) {
    const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  return headers;
}

function inferFieldsFromData(data: any): any[] {
  // Get sample item (first item if array, or the data itself)
  const sample = Array.isArray(data) ? data[0] : data;
  
  if (!sample || typeof sample !== 'object') {
    return [];
  }
  
  return Object.keys(sample).map(key => ({
    name: key,
    type: inferType(sample[key]),
    required: false, // Default to optional, user can adjust
    mapping: key
  }));
}

function inferType(value: any): string {
  if (value === null || value === undefined) {
    return 'string'; // Default fallback
  }
  
  if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
    return 'date';
  } else if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'object') {
    return 'object';
  } else {
    return 'string';
  }
}
