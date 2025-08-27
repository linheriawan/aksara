// Enhanced data access with template support
import type { DataSource, ObjectDef } from './conf';
import * as yaml from 'yaml';

/**
 * Load all data sources including defaults and user configs
 */
export async function loadAllDataSources(): Promise<DataSource[]> {
  const sources: DataSource[] = [];
  
  try {
    // Load default templates
    const defaultSources = await loadDefaultDataSources();
    sources.push(...defaultSources);
    
    // Load user configurations 
    const userSources = await loadUserDataSources();
    sources.push(...userSources);
    
  } catch (error) {
    console.error('Error loading data sources:', error);
  }
  
  return sources;
}

/**
 * Load default data source templates
 */
async function loadDefaultDataSources(): Promise<DataSource[]> {
  const sources: DataSource[] = [];
  
  try {
    // These would be loaded from /src/lib/defaults/datadef/ in production
    // For now, create template configs
    sources.push({
      type: 'mysql',
      name: 'template_mysql',
      config: {
        server: 'localhost',
        port: '3306',
        username: '',
        password: '',
        database: ''
      },
      readonly: true,
      system: true,
      category: 'default',
      description: 'Default MySQL connection template'
    });
    
    sources.push({
      type: 'rest',
      name: 'template_rest_api',
      config: {
        baseUrl: 'https://api.example.com',
        authentication: 'none',
        apiKey: ''
      },
      readonly: true,
      system: true,
      category: 'default',
      description: 'Default REST API connection template'
    });
    
  } catch (error) {
    console.warn('Failed to load default templates:', error);
  }
  
  return sources;
}

/**
 * Load user-created data sources from datadef directory
 */
async function loadUserDataSources(): Promise<DataSource[]> {
  // This will load from your existing datadef directory
  // Implementation would scan datadef/ directory and parse YAML files
  return [];
}

/**
 * Check if a data source can be modified
 */
export function canModifyDataSource(dataSource: DataSource): boolean {
  return !dataSource.readonly && !dataSource.system;
}

/**
 * Get user-friendly display name for data source type
 */
export function getDataSourceTypeLabel(dataSource: DataSource): string {
  if (dataSource.system) return '🔒 System Template';
  if (dataSource.category === 'default') return '📄 Default Template';
  if (dataSource.category === 'generated') return '⚙️ Generated';
  return '👤 Custom';
}