// src/routes/designer/data/save-config/+server.ts (Updated)
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';
import { dataConfigManager } from '../dataConfig';
import type { DataSource, ObjectDef } from '../conf';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { dataSource, object } = await request.json();
    
    if (!dataSource || !object) {
      return json({ error: 'Missing dataSource or object' }, { status: 400 });
    }

    // Ensure data definition directory exists
    const dataDefPath = join(process.cwd(), 'src/lib/datadef');
    if (!existsSync(dataDefPath)) {
      mkdirSync(dataDefPath, { recursive: true });
    }

    // Save or update data source configuration
    await saveDataSourceConfig(dataSource, dataDefPath);
    
    // Save object definition using the updated manager
    dataConfigManager.saveObjectDefinition(object);

    return json({ 
      success: true, 
      message: 'Configuration saved successfully',
      dataSource: dataSource.name,
      object: object.name
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return json({ 
      error: 'Failed to save configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

async function saveDataSourceConfig(dataSource: DataSource, dataDefPath: string) {
  const accessPath = join(dataDefPath, '_access.yaml');
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


