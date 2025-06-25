// src/lib/utils/dataConfig.ts
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'yaml';

export interface DataSource {
  name: string;
  type: 'mysql' | 'rest' | 'filesystem';
  config: any;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  mapping: string;
}

export interface ObjectDefinition {
  name: string;
  source: string;
  primaryKey: string;
  dataSource: string;
  fields: ObjectField[];
  createdAt: string;
  updatedAt: string;
}

export interface AccessConfig {
  dataSources: DataSource[];
}

export class DataConfigManager {
  private dataDefPath: string;

  constructor(basePath: string = 'src/lib/datadef') {
    this.dataDefPath = join(process.cwd(), basePath);
  }

  /**
   * Load all data source configurations
   */
  loadDataSources(): DataSource[] {
    const accessPath = join(this.dataDefPath, '_access.yaml');
    
    if (!existsSync(accessPath)) {
      return [];
    }

    try {
      const content = readFileSync(accessPath, 'utf8');
      const data = yaml.parse(content) as AccessConfig;
      return data?.dataSources || [];
    } catch (error) {
      console.error('Error loading data sources:', error);
      return [];
    }
  }

  /**
   * Load a specific data source by name
   */
  loadDataSource(name: string): DataSource | null {
    const dataSources = this.loadDataSources();
    return dataSources.find(ds => ds.name === name) || null;
  }

  /**
   * Load all object definitions
   */
  loadObjectDefinitions(): ObjectDefinition[] {
    if (!existsSync(this.dataDefPath)) {
      return [];
    }

    const objects: ObjectDefinition[] = [];
    const files = readdirSync(this.dataDefPath);

    for (const file of files) {
      if (file.endsWith('.yaml') && !file.startsWith('_')) {
        try {
          const content = readFileSync(join(this.dataDefPath, file), 'utf8');
          const data = yaml.parse(content) as Omit<ObjectDefinition, 'name'>;
          
          if (data) {
            objects.push({
              name: file.replace('.yaml', ''),
              ...data
            });
          }
        } catch (error) {
          console.error(`Error loading object definition ${file}:`, error);
        }
      }
    }

    return objects;
  }

  /**
   * Load a specific object definition by name
   */
  loadObjectDefinition(name: string): ObjectDefinition | null {
    const objectPath = join(this.dataDefPath, `${name}.yaml`);
    
    if (!existsSync(objectPath)) {
      return null;
    }

    try {
      const content = readFileSync(objectPath, 'utf8');
      const data = yaml.parse(content) as Omit<ObjectDefinition, 'name'>;
      
      return data ? { name, ...data } : null;
    } catch (error) {
      console.error(`Error loading object definition ${name}:`, error);
      return null;
    }
  }

  /**
   * Get object definition with its data source configuration
   */
  getObjectWithDataSource(objectName: string): {
    object: ObjectDefinition;
    dataSource: DataSource;
  } | null {
    const object = this.loadObjectDefinition(objectName);
    if (!object) return null;

    const dataSource = this.loadDataSource(object.dataSource);
    if (!dataSource) return null;

    return { object, dataSource };
  }

  /**
   * Validate object definition
   */
  validateObjectDefinition(object: Partial<ObjectDefinition>): string[] {
    const errors: string[] = [];

    if (!object.name) {
      errors.push('Object name is required');
    }

    if (!object.source) {
      errors.push('Source is required');
    }

    if (!object.dataSource) {
      errors.push('Data source is required');
    }

    if (!object.fields || object.fields.length === 0) {
      errors.push('At least one field is required');
    }

    if (object.fields) {
      object.fields.forEach((field, index) => {
        if (!field.name) {
          errors.push(`Field ${index + 1}: name is required`);
        }
        if (!field.type) {
          errors.push(`Field ${index + 1}: type is required`);
        }
        if (!field.mapping) {
          errors.push(`Field ${index + 1}: mapping is required`);
        }
      });
    }

    return errors;
  }

  /**
   * Check if object name already exists
   */
  objectExists(name: string): boolean {
    const objectPath = join(this.dataDefPath, `${name}.yaml`);
    return existsSync(objectPath);
  }

  /**
   * Get available object names
   */
  getAvailableObjects(): string[] {
    return this.loadObjectDefinitions().map(obj => obj.name);
  }

  /**
   * Get objects by data source
   */
  getObjectsByDataSource(dataSourceName: string): ObjectDefinition[] {
    return this.loadObjectDefinitions().filter(obj => obj.dataSource === dataSourceName);
  }
}

// Export singleton instance
export const dataConfigManager = new DataConfigManager();
