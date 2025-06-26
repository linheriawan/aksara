// src/routes/designer/data/file-fields/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFileSync } from 'fs';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { config, filename } = await request.json();
    
    const filePath = join(process.cwd(), config.basePath, filename);
    const content = readFileSync(filePath, 'utf8');
    
    let data;
    if (config.format === 'json') {
      data = JSON.parse(content);
    } else {
      throw new Error(`Unsupported file format: ${config.format}`);
    }
    
    const fields = inferFieldsFromData(data);
    
    return json({ success: true, fields });
  } catch (error) {
    console.error('Error fetching file fields:', error);
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to fetch file fields'
    }, { status: 500 });
  }
};

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