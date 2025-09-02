// src/routes/designer/data/dataConfig.ts
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, unlinkSync, renameSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'yaml';
import type { DataSource, ObjectDef } from './conf';

export interface AccessConfig {
  dataSources: DataSource[];
}

export class DataConfigManager {
  private dataDefPath: string;

  constructor(basePath: string = 'src/lib/workspace/datadef') {
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
   * Delete data source configuration and all related object schemas
   */
  deleteDataSource(dataSourceName: string): boolean {
    try {
      const accessPath = join(this.dataDefPath, '_access.yaml');
      
      // Remove from _access.yaml
      if (existsSync(accessPath)) {
        const content = readFileSync(accessPath, 'utf8');
        const existingConfig = yaml.parse(content) || { dataSources: [] };
        
        existingConfig.dataSources = existingConfig.dataSources.filter(
          (ds: DataSource) => ds.name !== dataSourceName
        );
        
        const yamlContent = yaml.stringify(existingConfig);
        writeFileSync(accessPath, yamlContent, 'utf8');
      }
      
      // Remove data source directory with all object schemas
      const dsPath = join(this.dataDefPath, dataSourceName);
      if (existsSync(dsPath)) {
        const files = readdirSync(dsPath);
        files.forEach(file => {
          unlinkSync(join(dsPath, file));
        });
        // Note: We don't remove the directory itself to avoid fs.rmdir() complexity
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting data source ${dataSourceName}:`, error);
      return false;
    }
  }

  /**
   * Save data source configuration
   */
  saveDataSourceConfig(dataSource: DataSource, originalName?: string): void {
    console.log('saveDataSourceConfig called with:', { 
      dataSource: dataSource.name, 
      originalName,
      isRename: originalName && originalName !== dataSource.name
    });
    
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
    // If originalName is provided and different from current name, handle rename
    if (originalName && originalName !== dataSource.name) {
      console.log(`Renaming data source from "${originalName}" to "${dataSource.name}"`);
      
      // Remove old data source entry from config
      const beforeCount = existingConfig.dataSources.length;
      existingConfig.dataSources = existingConfig.dataSources.filter(
        (ds: DataSource) => ds.name !== originalName
      );
      const afterCount = existingConfig.dataSources.length;
      console.log(`Removed ${beforeCount - afterCount} data sources from config`);
      
      // Move object schema directory if it exists
      const oldDsPath = join(this.dataDefPath, originalName);
      const newDsPath = join(this.dataDefPath, dataSource.name);
      
      if (existsSync(oldDsPath)) {
        console.log(`Moving object schemas from "${oldDsPath}" to "${newDsPath}"`);
        try {
          // First, rename the directory (like mv command)
          if (!existsSync(newDsPath)) {
            renameSync(oldDsPath, newDsPath);
            console.log(`Successfully renamed directory from "${originalName}" to "${dataSource.name}"`);
          } else {
            console.log(`New directory exists, will copy and update files...`);
            // If new directory exists, we need to process files individually
            const files = readdirSync(oldDsPath);
            for (const file of files) {
              if (file.endsWith('.yaml')) {
                const oldFilePath = join(oldDsPath, file);
                const newFilePath = join(newDsPath, file);
                
                try {
                  // Read and update YAML content
                  const content = readFileSync(oldFilePath, 'utf8');
                  const data = yaml.parse(content);
                  
                  // Update dataSource field if it exists
                  if (data && data.dataSource === originalName) {
                    data.dataSource = dataSource.name;
                    console.log(`Updated dataSource field in ${file} from "${originalName}" to "${dataSource.name}"`);
                  }
                  
                  // Write updated content to new location
                  const updatedContent = yaml.stringify(data);
                  writeFileSync(newFilePath, updatedContent, 'utf8');
                  console.log(`Moved and updated ${file}`);
                } catch (fileError) {
                  console.error(`Error processing ${file}:`, fileError);
                  // Fallback to simple copy if YAML parsing fails
                  copyFileSync(oldFilePath, newFilePath);
                  console.log(`Fallback: simply copied ${file}`);
                }
              } else {
                // Non-YAML files, just copy
                copyFileSync(join(oldDsPath, file), join(newDsPath, file));
                console.log(`Copied non-YAML file: ${file}`);
              }
            }
            // Remove old directory
            rmSync(oldDsPath, { recursive: true, force: true });
            console.log(`Removed old directory: ${oldDsPath}`);
          }

          // Now update YAML contents in the new location (whether renamed or copied)
          const files = readdirSync(newDsPath);
          for (const file of files) {
            if (file.endsWith('.yaml')) {
              const filePath = join(newDsPath, file);
              
              try {
                const content = readFileSync(filePath, 'utf8');
                const data = yaml.parse(content);
                
                // Update dataSource field if it still has the old name
                if (data && data.dataSource === originalName) {
                  data.dataSource = dataSource.name;
                  const updatedContent = yaml.stringify(data);
                  writeFileSync(filePath, updatedContent, 'utf8');
                  console.log(`Updated dataSource field in ${file} from "${originalName}" to "${dataSource.name}"`);
                }
              } catch (fileError) {
                console.warn(`Could not update dataSource field in ${file}:`, fileError);
              }
            }
          }
          
          console.log(`Successfully moved and updated all object schemas`);
        } catch (error) {
          console.error(`Error moving object schemas:`, error);
          // Continue with the data source rename even if schema move fails
        }
      } else {
        console.log(`No object schema directory found at "${oldDsPath}"`);
      }
    }

    const existingIndex = existingConfig.dataSources.findIndex(
      (ds: DataSource) => ds.name === dataSource.name
    );

    if (existingIndex >= 0) {
      console.log(`Updating existing data source at index ${existingIndex}`);
      existingConfig.dataSources[existingIndex] = dataSource;
    } else {
      console.log(`Adding new data source "${dataSource.name}"`);
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