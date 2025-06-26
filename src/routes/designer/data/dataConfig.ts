// src/route/designer/data/dataConfig.ts 
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'yaml';
import type { DataSource, ObjectDef } from './conf';

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
  loadObjectDefinitions(): ObjectDef[] {
    if (!existsSync(this.dataDefPath)) {
      return [];
    }

    const objects: ObjectDef[] = [];
    
    // Load objects from datasource-specific directories
    const dataSources = this.loadDataSources();
    for (const dataSource of dataSources) {
      const dsObjects = this.loadObjectsForDataSource(dataSource.name);
      objects.push(...dsObjects);
    }

    return objects;
  }

  /**
   * Load objects for a specific data source
   */
  loadObjectsForDataSource(dataSourceName: string): ObjectDef[] {
    const dsPath = join(this.dataDefPath, dataSourceName);
    
    if (!existsSync(dsPath)) {
      return [];
    }

    const objects: ObjectDef[] = [];
    const files = readdirSync(dsPath);

    for (const file of files) {
      if (file.endsWith('.yaml')) {
        try {
          const content = readFileSync(join(dsPath, file), 'utf8');
          const data = yaml.parse(content) as Omit<ObjectDef, 'name' | 'dataSource'>;
          
          if (data) {
            objects.push({
              name: file.replace('.yaml', ''),
              dataSource: dataSourceName,
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
   * Load a specific object definition by name and data source
   */
  loadObjectDefinition(name: string, dataSourceName: string): ObjectDef | null {
    const objectPath = join(this.dataDefPath, dataSourceName, `${name}.yaml`);
    
    if (!existsSync(objectPath)) {
      return null;
    }

    try {
      const content = readFileSync(objectPath, 'utf8');
      const data = yaml.parse(content) as Omit<ObjectDef, 'name' | 'dataSource'>;
      
      return data ? { name, dataSource: dataSourceName, ...data } : null;
    } catch (error) {
      console.error(`Error loading object definition ${name}:`, error);
      return null;
    }
  }

  /**
   * Save object definition to datasource-specific directory
   */
  saveObjectDefinition(object: ObjectDef): void {
    const dsPath = join(this.dataDefPath, object.dataSource);
    
    // Ensure datasource directory exists
    if (!existsSync(dsPath)) {
      mkdirSync(dsPath, { recursive: true });
    }

    const objectPath = join(dsPath, `${object.name}.yaml`);
    
    // Remove name and dataSource from object since they're in the path
    const { name, dataSource, ...objectData } = object;
    
    const yamlContent = yaml.stringify(objectData);
    writeFileSync(objectPath, yamlContent, 'utf8');
  }

  /**
   * Check if object exists in specific datasource
   */
  objectExists(name: string, dataSourceName: string): boolean {
    const objectPath = join(this.dataDefPath, dataSourceName, `${name}.yaml`);
    return existsSync(objectPath);
  }

  /**
   * Get object definition with change tracking
   */
  getObjectWithChanges(objectName: string, dataSourceName: string, newObject: ObjectDef): {
    object: ObjectDef;
    isNew: boolean;
    changes: {
      newFields: string[];
      removedFields: string[];
      modifiedFields: string[];
    };
  } {
    const existingObject = this.loadObjectDefinition(objectName, dataSourceName);
    const isNew = !existingObject;
    
    let changes = {
      newFields: [] as string[],
      removedFields: [] as string[],
      modifiedFields: [] as string[]
    };

    if (!isNew && existingObject) {
      const existingFieldNames = new Set(existingObject.fields.map(f => f.name));
      const newFieldNames = new Set(newObject.fields.map(f => f.name));
      
      // Find new fields
      changes.newFields = newObject.fields
        .filter(f => !existingFieldNames.has(f.name))
        .map(f => f.name);
      
      // Find removed fields
      changes.removedFields = existingObject.fields
        .filter(f => !newFieldNames.has(f.name))
        .map(f => f.name);
      
      // Find modified fields
      changes.modifiedFields = newObject.fields
        .filter(newField => {
          const existingField = existingObject.fields.find(f => f.name === newField.name);
          return existingField && (
            existingField.type !== newField.type ||
            existingField.required !== newField.required ||
            existingField.mapping !== newField.mapping
          );
        })
        .map(f => f.name);
    }

    return {
      object: newObject,
      isNew,
      changes
    };
  }
}

// Export singleton instance
export const dataConfigManager = new DataConfigManager();
  