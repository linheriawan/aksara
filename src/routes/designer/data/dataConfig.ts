// src/routes/designer/data/dataConfig.ts
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
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
   * Save data source configuration
   */
  saveDataSourceConfig(dataSource: DataSource): void {
    // Ensure data definition directory exists
    if (!existsSync(this.dataDefPath)) {
      mkdirSync(this.dataDefPath, { recursive: true });
    }

    const accessPath = join(this.dataDefPath, '_access.yaml');
    let existingConfig: any = { dataSources: [] };

    // Load existing configuration if it exists
    if (existsSync(accessPath)) {
      try {
        const content = readFileSync(accessPath, 'utf8');
        existingConfig = yaml.parse(content) || { dataSources: [] };
      } catch (error) {
        console.warn('Could not parse existing _access.yaml, creating new one');
      }
    }

    // Update or add the data source
    const existingIndex = existingConfig.dataSources.findIndex(
      (ds: DataSource) => ds.name === dataSource.name
    );

    if (existingIndex >= 0) {
      existingConfig.dataSources[existingIndex] = dataSource;
    } else {
      existingConfig.dataSources.push(dataSource);
    }

    // Write back to file
    const yamlContent = yaml.stringify(existingConfig);
    writeFileSync(accessPath, yamlContent, 'utf8');
  }

  /**
   * Load a specific data source by name
   */
  loadDataSource(name: string): DataSource | null {
    const dataSources = this.loadDataSources();
    return dataSources.find(ds => ds.name === name) || null;
  }

  /**
   * Load all object schema definitions
   */
  loadObjectDefinitions(): ObjectDef[] {
    if (!existsSync(this.dataDefPath)) {
      return [];
    }

    const objectSchemas: ObjectDef[] = [];
    
    // Load object schemas from datasource-specific directories
    const dataSources = this.loadDataSources();
    for (const dataSource of dataSources) {
      const dsObjectSchemas = this.loadObjectsForDataSource(dataSource.name);
      objectSchemas.push(...dsObjectSchemas);
    }

    return objectSchemas;
  }

  /**
   * Load object schemas for a specific data source
   */
  loadObjectsForDataSource(dataSourceName: string): ObjectDef[] {
    const dsPath = join(this.dataDefPath, dataSourceName);
    
    if (!existsSync(dsPath)) {
      return [];
    }

    const objectSchemas: ObjectDef[] = [];
    const files = readdirSync(dsPath);

    for (const file of files) {
      if (file.endsWith('.yaml')) {
        try {
          const content = readFileSync(join(dsPath, file), 'utf8');
          const data = yaml.parse(content) as Omit<ObjectDef, 'name' | 'dataSource'>;
          
          if (data) {
            objectSchemas.push({
              name: file.replace('.yaml', ''),
              dataSource: dataSourceName,
              ...data
            });
          }
        } catch (error) {
          console.error(`Error loading object schema definition ${file}:`, error);
        }
      }
    }

    return objectSchemas;
  }

  /**
   * Load a specific object schema definition by name and data source
   */
  loadObjectDefinition(objectName: string, dataSourceName: string): ObjectDef | null {
    const objectPath = join(this.dataDefPath, dataSourceName, `${objectName}.yaml`);
    
    if (!existsSync(objectPath)) {
      return null;
    }

    try {
      const content = readFileSync(objectPath, 'utf8');
      const data = yaml.parse(content) as Omit<ObjectDef, 'name' | 'dataSource'>;
      
      return data ? { name: objectName, dataSource: dataSourceName, ...data } : null;
    } catch (error) {
      console.error(`Error loading object schema definition ${objectName}:`, error);
      return null;
    }
  }

  /**
   * Save object schema definition to datasource-specific directory as YAML
   */
  saveObjectDefinition(objectSchema: ObjectDef): void {
    const dsPath = join(this.dataDefPath, objectSchema.dataSource);
    
    // Ensure datasource directory exists
    if (!existsSync(dsPath)) {
      mkdirSync(dsPath, { recursive: true });
    }

    const objectPath = join(dsPath, `${objectSchema.name}.yaml`);
    
    // Remove name and dataSource from object since they're in the path
    const { name, dataSource, ...objectData } = objectSchema;
    
    const yamlContent = yaml.stringify(objectData);
    writeFileSync(objectPath, yamlContent, 'utf8');
  }

  /**
   * Check if object schema exists in specific datasource
   */
  objectExists(objectName: string, dataSourceName: string): boolean {
    const objectPath = join(this.dataDefPath, dataSourceName, `${objectName}.yaml`);
    return existsSync(objectPath);
  }

  /**
   * Delete object schema definition
   */
  deleteObjectDefinition(dataSourceName: string, objectName: string): boolean {
    const objectPath = join(this.dataDefPath, dataSourceName, `${objectName}.yaml`);
    
    if (!existsSync(objectPath)) {
      return false;
    }

    try {
      unlinkSync(objectPath);
      return true;
    } catch (error) {
      console.error(`Error deleting object schema ${objectName}:`, error);
      return false;
    }
  }

  /**
   * Get object schema definition with change tracking
   */
  getObjectWithChanges(objectName: string, dataSourceName: string, newObjectSchema: ObjectDef): {
    object: ObjectDef;
    isNew: boolean;
    changes: {
      newFields: string[];
      removedFields: string[];
      modifiedFields: string[];
    };
  } {
    const existingObjectSchema = this.loadObjectDefinition(objectName, dataSourceName);
    const isNew = !existingObjectSchema;
    
    let changes = {
      newFields: [] as string[],
      removedFields: [] as string[],
      modifiedFields: [] as string[]
    };

    if (!isNew && existingObjectSchema) {
      const existingFieldNames = new Set(existingObjectSchema.fields.map(f => f.name));
      const newFieldNames = new Set(newObjectSchema.fields.map(f => f.name));
      
      // Find new fields
      changes.newFields = newObjectSchema.fields
        .filter(f => !existingFieldNames.has(f.name))
        .map(f => f.name);
      
      // Find removed fields
      changes.removedFields = existingObjectSchema.fields
        .filter(f => !newFieldNames.has(f.name))
        .map(f => f.name);
      
      // Find modified fields
      changes.modifiedFields = newObjectSchema.fields
        .filter(newObjField => {
          const existingObjField = existingObjectSchema.fields.find(f => f.name === newObjField.name);
          return existingObjField && (
            existingObjField.type !== newObjField.type ||
            existingObjField.required !== newObjField.required ||
            existingObjField.mapping !== newObjField.mapping
          );
        })
        .map(f => f.name);
    }

    return {
      object: newObjectSchema,
      isNew,
      changes
    };
  }
}

// Export singleton instance
export const dataConfigManager = new DataConfigManager();