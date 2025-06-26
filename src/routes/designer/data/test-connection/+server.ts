// src/routes/designer/data/test-connection/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import mysql from 'mysql2/promise';
import { existsSync } from 'fs';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { type, config } = await request.json();
    
    let result;
    switch (type) {
      case 'mysql':
        result = await testMySQLConnection(config);
        break;
      case 'rest':
        result = await testRESTConnection(config);
        break;
      case 'filesystem':
        result = await testFileSystemConnection(config);
        break;
      default:
        return json({ 
          success: false, 
          message: 'Unsupported connection type' 
        }, { status: 400 });
    }
    
    return json(result);
  } catch (error) {
    console.error('Connection test error:', error);
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Connection test failed'
    });
  }
};

async function testMySQLConnection(config: any) {
  const connection = await mysql.createConnection({
    host: config.server,
    port: parseInt(config.port) || 3306,
    user: config.username,
    password: config.password,
    database: config.database
  });

  try {
    // Test connection and get table list
    const [tables] = await connection.execute('SHOW TABLES');
    const schema = (tables as any[]).map(row => Object.values(row)[0] as string);
    
    return {
      success: true,
      message: `Connected successfully to ${config.database}`,
      schema
    };
  } finally {
    await connection.end();
  }
}

async function testRESTConnection(config: any) {
  const headers = getTestAuthHeaders(config);
  
  try {
    const response = await fetch(config.baseUrl, { 
      method: 'GET', 
      headers
    });
    
    if (response.ok) {
      return {
        success: true,
        message: `Connected successfully to ${config.baseUrl}`
      };
    } else {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function testFileSystemConnection(config: any) {
  try {
    const fullPath = join(process.cwd(), config.basePath);
    
    if (!existsSync(fullPath)) {
      return {
        success: false,
        message: `Path does not exist: ${config.basePath}`
      };
    }
    
    return {
      success: true,
      message: `File system path verified: ${config.basePath}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Path verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function getTestAuthHeaders(config: any): Record<string, string> {
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