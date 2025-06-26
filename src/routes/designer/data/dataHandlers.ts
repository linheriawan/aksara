// src/routes/designer/data/dataHandlers.ts
import { json } from '@sveltejs/kit';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import mysql from 'mysql2/promise';
import { dataConfigManager } from './dataConfig';
import type { DataSource, ObjectDef } from './conf';

// Available Sources Handler
export async function handleAvailableSources(body: any) {
  const { type, config } = body;
  let availableSources: string[] = [];

  switch (type) {
    case 'mysql':
      availableSources = await getMySQLTables(config);
      break;
    case 'rest':
      availableSources = await getRESTEndpoints(config);
      break;
    case 'filesystem':
      availableSources = await getFileSystemSources(config);
      break;
    default:
      return json({ error: 'Unsupported data source type' }, { status: 400 });
  }

  return json({ sources: availableSources });
}

// Load Configs Handler
export async function handleLoadConfigs(url: URL) {
  const dataSourceName = url.searchParams.get('dataSource');
  
  const dataSources = dataConfigManager.loadDataSources();
  
  // Load object schemas - filter by data source if specified
  let objectSchemas;
  if (dataSourceName) {
    objectSchemas = dataConfigManager.loadObjectsForDataSource(dataSourceName);
  } else {
    objectSchemas = dataConfigManager.loadObjectDefinitions();
  }
  
  return json({ configs: dataSources, objects: objectSchemas });
}

// Save Config Handler
export async function handleSaveConfig(body: any) {
  const { dataSource, object } = body;
  
  if (!dataSource || !object) {
    return json({ error: 'Missing dataSource or object schema' }, { status: 400 });
  }

  // Save data source configuration
  await dataConfigManager.saveDataSourceConfig(dataSource);
  
  // Save object schema definition as YAML
  dataConfigManager.saveObjectDefinition(object);

  return json({ 
    success: true, 
    message: 'Data source and object schema saved successfully',
    dataSource: dataSource.name,
    objectSchema: object.name
  });
}

// Test Connection Handler
export async function handleTestConnection(body: any) {
  const { type, config } = body;
  
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
}

// Field Discovery Handlers
export async function handleTableFields(body: any) {
  const { config, table } = body;
  
  const connection = await mysql.createConnection({
    host: config.server,
    port: parseInt(config.port) || 3306,
    user: config.username,
    password: config.password,
    database: config.database
  });

  try {
    const [rows] = await connection.execute(`DESCRIBE ${table}`);
    const objectFields = (rows as any[]).map(dbField => ({
      name: dbField.Field,
      type: mapMySQLType(dbField.Type),
      required: dbField.Null === 'NO',
      mapping: dbField.Field
    }));

    return json({ success: true, fields: objectFields });
  } finally {
    await connection.end();
  }
}

export async function handleApiFields(body: any) {
  const { config, endpoint } = body;
  
  const headers = getAuthHeaders(config);
  const url = `${config.baseUrl}/${endpoint}`.replace(/\/+/g, '/').replace(':/', '://');
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  const objectFields = inferFieldsFromData(data);
  
  return json({ success: true, fields: objectFields });
}

export async function handleFileFields(body: any) {
  const { config, filename } = body;
  
  const filePath = join(process.cwd(), config.basePath, filename);
  const content = readFileSync(filePath, 'utf8');
  
  let data;
  if (config.format === 'json') {
    data = JSON.parse(content);
  } else {
    throw new Error(`Unsupported file format: ${config.format}`);
  }
  
  const objectFields = inferFieldsFromData(data);
  
  return json({ success: true, fields: objectFields });
}

// Analyze Changes Handler
export async function handleAnalyzeChanges(body: any) {
  const { objectName, dataSourceName, newObjectSchema } = body;
  
  if (!objectName || !dataSourceName || !newObjectSchema) {
    return json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const result = dataConfigManager.getObjectWithChanges(
    objectName, 
    dataSourceName, 
    newObjectSchema as ObjectDef
  );

  return json({
    isNew: result.isNew,
    changes: result.changes
  });
}

// Helper Functions
async function getMySQLTables(dbConfig: any): Promise<string[]> {
  const connection = await mysql.createConnection({
    host: dbConfig.server,
    port: parseInt(dbConfig.port) || 3306,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database
  });

  try {
    const [rows] = await connection.execute('SHOW TABLES');
    return (rows as any[]).map(row => Object.values(row)[0] as string);
  } finally {
    await connection.end();
  }
}

async function getRESTEndpoints(apiConfig: any): Promise<string[]> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}/`, {
      method: 'GET',
      headers: getAuthHeaders(apiConfig)
    });
    
    if (response.ok) {
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

async function getFileSystemSources(fsConfig: any): Promise<string[]> {
  const basePath = join(process.cwd(), fsConfig.basePath);
  
  if (!existsSync(basePath)) {
    throw new Error(`Path does not exist: ${basePath}`);
  }

  try {
    const files = readdirSync(basePath);
    return files.filter(file => {
      if (fsConfig.format === 'json') {
        return file.endsWith('.json');
      }
      return true;
    });
  } catch (error) {
    throw new Error(`Error reading directory: ${error}`);
  }
}

async function testMySQLConnection(dbConfig: any) {
  const connection = await mysql.createConnection({
    host: dbConfig.server,
    port: parseInt(dbConfig.port) || 3306,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database
  });

  try {
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = (tables as any[]).map(row => Object.values(row)[0] as string);
    
    return {
      success: true,
      message: `Connected successfully to database: ${dbConfig.database}`,
      schema: tableNames
    };
  } finally {
    await connection.end();
  }
}

async function testRESTConnection(apiConfig: any) {
  const headers = getAuthHeaders(apiConfig);
  
  try {
    const response = await fetch(apiConfig.baseUrl, { 
      method: 'GET', 
      headers
    });
    
    if (response.ok) {
      return {
        success: true,
        message: `Connected successfully to API: ${apiConfig.baseUrl}`
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

async function testFileSystemConnection(fsConfig: any) {
  try {
    const fullPath = join(process.cwd(), fsConfig.basePath);
    
    if (!existsSync(fullPath)) {
      return {
        success: false,
        message: `Path does not exist: ${fsConfig.basePath}`
      };
    }
    
    return {
      success: true,
      message: `File system path verified: ${fsConfig.basePath}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Path verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function getAuthHeaders(apiConfig: any): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (apiConfig.authentication === 'apikey' && apiConfig.apiKey) {
    headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
  } else if (apiConfig.authentication === 'basic' && apiConfig.username && apiConfig.password) {
    const auth = Buffer.from(`${apiConfig.username}:${apiConfig.password}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  return headers;
}

function mapMySQLType(mysqlType: string): string {
  const type = mysqlType.toLowerCase();
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
    return 'number';
  } else if (type.includes('bool') || type.includes('bit')) {
    return 'boolean';
  } else if (type.includes('date') || type.includes('time')) {
    return 'date';
  } else if (type.includes('json')) {
    return 'object';
  } else {
    return 'string';
  }
}

function inferFieldsFromData(sourceData: any): any[] {
  const sampleRecord = Array.isArray(sourceData) ? sourceData[0] : sourceData;
  
  if (!sampleRecord || typeof sampleRecord !== 'object') {
    return [];
  }
  
  return Object.keys(sampleRecord).map(fieldName => ({
    name: fieldName,
    type: inferType(sampleRecord[fieldName]),
    required: false,
    mapping: fieldName
  }));
}

function inferType(value: any): string {
  if (value === null || value === undefined) {
    return 'string';
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