// src/routes/designer/data/dataHandlers.ts
import { json } from '@sveltejs/kit';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import mysql from 'mysql2/promise';
import yaml from 'yaml';
import { dataConfigManager } from './dataConfig';
import type { DataSource, ObjectDef } from './conf';
import { 
  checkInterfaceExists, 
  addInterfaceToFile, 
  removeInterfaceFromFile 
} from '$lib/core/interfaces-server';
import { scanForInterfaces } from '$lib/utils/interfaceScanner';

// Check Interface Status Handler
export async function handleCheckInterfaceStatus(body: any) {
  const { objectName } = body;
  
  if (!objectName) {
    return json({ error: 'Missing objectName' }, { status: 400 });
  }

  try {
    const status = checkInterfaceExists(objectName);
    return json(status);
  } catch (error) {
    return json({ 
      error: 'Failed to check interface status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generate Interface Handler
export async function handleGenerateInterface(body: any) {
  const { objectSchema } = body;
  
  if (!objectSchema) {
    return json({ error: 'Missing objectSchema' }, { status: 400 });
  }

  try {
    addInterfaceToFile(objectSchema as ObjectDef);
    const status = checkInterfaceExists(objectSchema.name);
    
    return json({ 
      success: true, 
      message: `Interface ${status.interfaceName} generated successfully`,
      interfaceName: status.interfaceName
    });
  } catch (error) {
    return json({ 
      error: 'Failed to generate interface',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Remove Interface Handler
export async function handleRemoveInterface(body: any) {
  const { objectName } = body;
  
  if (!objectName) {
    return json({ error: 'Missing objectName' }, { status: 400 });
  }

  try {
    const removed = removeInterfaceFromFile(objectName);
    
    if (removed) {
      return json({ 
        success: true, 
        message: `Interface for ${objectName} removed successfully`
      });
    } else {
      return json({ 
        success: false, 
        message: `Interface for ${objectName} not found`
      }, { status: 404 });
    }
  } catch (error) {
    return json({ 
      error: 'Failed to remove interface',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Scan Interfaces Handler
export async function handleScanInterfaces(body: any) {
  const { filePaths } = body;
  
  try {
    const scanResult = scanForInterfaces(filePaths);
    
    return json({
      success: true,
      interfaces: scanResult.interfaces.map(iface => ({
        name: iface.name,
        file: iface.relativePath,
        fields: iface.fields || []
      })),
      files: scanResult.files.map(file => file.replace(process.cwd(), '').replace(/^[\/\\]/, '')),
      totalCount: scanResult.interfaces.length,
      error: scanResult.error
    });
  } catch (error) {
    return json({ 
      success: false,
      error: 'Failed to scan interfaces',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get Interface Details Handler
export async function handleGetInterfaceDetails(body: any) {
  const { interfaceName, filePaths } = body;
  
  if (!interfaceName) {
    return json({ error: 'Missing interfaceName' }, { status: 400 });
  }

  try {
    const scanResult = scanForInterfaces(filePaths);
    const interfaceInfo = scanResult.interfaces.find(iface => iface.name === interfaceName);
    
    if (!interfaceInfo) {
      return json({ 
        success: false, 
        error: `Interface '${interfaceName}' not found` 
      }, { status: 404 });
    }
    
    return json({
      success: true,
      interface: {
        name: interfaceInfo.name,
        file: interfaceInfo.relativePath,
        source: interfaceInfo.source,
        fields: interfaceInfo.fields || []
      }
    });
  } catch (error) {
    return json({ 
      success: false,
      error: 'Failed to get interface details',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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
// Save just data source (without object schema)
export async function handleSaveDataSource(body: any) {
  const { dataSource, isEdit, originalName } = body;
  
  console.log('handleSaveDataSource received:', { dataSource, isEdit, originalName });
  
  if (!dataSource) {
    return json({ error: 'Missing dataSource' }, { status: 400 });
  }

  try {
    // Save data source configuration with original name for proper updates
    console.log('Calling saveDataSourceConfig with:', { dataSource, originalName });
    await dataConfigManager.saveDataSourceConfig(dataSource, originalName);
    
    return json({ 
      success: true, 
      message: `Data source ${isEdit ? 'updated' : 'created'} successfully`,
      dataSource 
    });
  } catch (error) {
    return json({ 
      error: 'Failed to save data source',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete data source
export async function handleDeleteDataSource(body: any) {
  const { dataSourceName } = body;
  
  if (!dataSourceName) {
    return json({ error: 'Missing dataSourceName' }, { status: 400 });
  }

  try {
    const success = dataConfigManager.deleteDataSource(dataSourceName);
    
    if (success) {
      return json({ 
        success: true, 
        message: `Data source "${dataSourceName}" deleted successfully`
      });
    } else {
      return json({ 
        error: 'Failed to delete data source',
        message: 'Data source not found or could not be deleted'
      }, { status: 404 });
    }
  } catch (error) {
    return json({ 
      error: 'Failed to delete data source',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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

export async function handleSaveObjectSchema(body: any) {
  const { objectSchema } = body;
  
  if (!objectSchema) {
    return json({ error: 'Missing object schema' }, { status: 400 });
  }

  try {
    // Save object schema definition as YAML
    dataConfigManager.saveObjectDefinition(objectSchema);

    return json({ 
      success: true, 
      message: 'Object schema saved successfully',
      objectSchema: objectSchema.name
    });
  } catch (error) {
    console.error('Error saving object schema:', error);
    return json({ 
      error: 'Failed to save object schema',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Test Connection Handler
export async function handleTestConnection(body: any) {
  try {
    console.log('handleTestConnection received body:', JSON.stringify(body, null, 2));
    
    const { type, config } = body;
    
    if (!type || !config) {
      return json({
        success: false,
        message: 'Missing required parameters: type and config'
      }, { status: 400 });
    }
    
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
          message: `Unsupported connection type: ${type}` 
        }, { status: 400 });
    }
    
    return json(result);
  } catch (error) {
    console.error('handleTestConnection error:', error);
    return json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
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
  const { config, filename, possibleFilenames } = body;
  
  // Try to find the file using possible filename variants
  let filePath: string;
  let content: string;
  let actualFilename = filename;
  
  const filesToTry = possibleFilenames || [filename];
  let lastError: Error | null = null;
  
  for (const tryFilename of filesToTry) {
    try {
      filePath = join(process.cwd(), config.basePath, tryFilename);
      content = readFileSync(filePath, 'utf8');
      actualFilename = tryFilename;
      console.log(`Successfully found file: ${tryFilename}`);
      break;
    } catch (error) {
      lastError = error as Error;
      console.log(`File not found: ${tryFilename}`);
      continue;
    }
  }
  
  if (!content) {
    throw new Error(`Could not find data file. Tried: ${filesToTry.join(', ')}. Last error: ${lastError?.message}`);
  }
  
  // Auto-detect format from file extension, fallback to config format
  const fileExtension = actualFilename.toLowerCase().split('.').pop();
  let detectedFormat = config.format;
  
  if (fileExtension === 'json') {
    detectedFormat = 'json';
  } else if (fileExtension === 'yaml' || fileExtension === 'yml') {
    detectedFormat = 'yaml';
  } else if (fileExtension === 'csv') {
    detectedFormat = 'csv';
  }
  
  console.log(`Auto-detecting format for ${actualFilename}: extension="${fileExtension}", detected="${detectedFormat}", configured="${config.format}"`);
  
  let data;
  try {
    if (detectedFormat === 'json') {
      data = JSON.parse(content);
    } else if (detectedFormat === 'yaml') {
      data = yaml.parse(content);
    } else if (detectedFormat === 'csv') {
      // For CSV, we need to parse it differently - for now, return an error
      throw new Error('CSV field detection not yet implemented. Please use JSON or YAML files.');
    } else {
      throw new Error(`Unsupported file format: ${detectedFormat}`);
    }
  } catch (parseError) {
    const errorMsg = parseError instanceof Error ? parseError.message : 'Failed to parse file';
    throw new Error(`Failed to parse ${detectedFormat.toUpperCase()} file: ${errorMsg}`);
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

// Delete Object Schema Handler
export async function handleDeleteObject(body: any) {
  const { dataSourceName, objectName } = body;
  
  if (!dataSourceName || !objectName) {
    return json({ error: 'Missing dataSourceName or objectName' }, { status: 400 });
  }

  try {
    const deleted = dataConfigManager.deleteObjectDefinition(dataSourceName, objectName);
    
    if (deleted) {
      return json({ 
        success: true, 
        message: `Object schema '${objectName}' deleted successfully` 
      });
    } else {
      return json({ 
        success: false, 
        message: `Object schema '${objectName}' not found` 
      }, { status: 404 });
    }
  } catch (error) {
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete object schema'
    }, { status: 500 });
  }
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
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: dbConfig.server,
      port: parseInt(dbConfig.port) || 3306,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      timeout: 10000 // 10 second timeout
    });

    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = (tables as any[]).map(row => Object.values(row)[0] as string);
    
    return {
      success: true,
      message: `Connected successfully to database: ${dbConfig.database}`,
      schema: tableNames
    };
  } catch (error) {
    return {
      success: false,
      message: `MySQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // Ignore cleanup errors
      }
    }
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

// Get Data Sources Handler
export async function handleGetDataSources() {
  try {
    const dataSources = dataConfigManager.loadDataSources();
    return json(dataSources);
  } catch (error) {
    console.error('Error loading data sources:', error);
    return json({ 
      error: 'Failed to load data sources',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get Objects Handler
export async function handleGetObjects() {
  try {
    const objects = dataConfigManager.loadObjectDefinitions();
    return json(objects);
  } catch (error) {
    console.error('Error loading object definitions:', error);
    return json({ 
      error: 'Failed to load object definitions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}