// src/routes/api/wizard/save-config/+server.ts
import { json } from '@sveltejs/kit';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const { dataSource, objects } = await request.json();
    
    const dataDef = join(process.cwd(), 'src/lib/datadef');
    
    // Ensure directory exists
    if (!existsSync(dataDef)) {
      mkdirSync(dataDef, { recursive: true });
    }
    
    // Save or update access configuration
    const accessPath = join(dataDef, '_access.yaml');
    let accessData: any = { dataSources: [] };
    
    if (existsSync(accessPath)) {
      const content = readFileSync(accessPath, 'utf8');
      accessData = yaml.parse(content) || { dataSources: [] };
    }
    
    // Update or add the data source
    const existingIndex = accessData.dataSources.findIndex(
      (ds: any) => ds.name === dataSource.name
    );
    
    if (existingIndex >= 0) {
      accessData.dataSources[existingIndex] = dataSource;
    } else {
      accessData.dataSources.push(dataSource);
    }
    
    writeFileSync(accessPath, yaml.stringify(accessData));
    
    // Save object definitions
    for (const obj of objects) {
      const objectPath = join(dataDef, `${obj.name}.yaml`);
      const objectData = {
        source: obj.source,
        primaryKey: obj.primaryKey,
        fields: obj.fields,
        dataSource: dataSource.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      writeFileSync(objectPath, yaml.stringify(objectData));
    }
    
    return json({ success: true, message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return json({ success: false, message: error });
  }
}