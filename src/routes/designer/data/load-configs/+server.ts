// src/routes/api/wizard/load-configs/+server.ts
import { json } from '@sveltejs/kit';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';
import type{DataSource,ObjectDef,Field} from "../conf"

export async function GET() {
  try {
    const dataDef = join(process.cwd(), 'src/lib/datadef');
    const configs = [] as DataSource[];
    const objects = [] as ObjectDef[];
    
    // Load access configurations
    const accessPath = join(dataDef, '_access.yaml');
    if (existsSync(accessPath)) {
      const accessContent = readFileSync(accessPath, 'utf8');
      const accessData = yaml.parse(accessContent) as any;
      if (accessData && Array.isArray(accessData.dataSources)) {
        configs.push(...accessData.dataSources);
      }
    }
    
    // Load object definitions
    if (existsSync(dataDef)) {
      const files = readdirSync(dataDef);
      for (const file of files) {
        if (file.endsWith('.yaml') && !file.startsWith('_')) {
          try {
            const content = readFileSync(join(dataDef, file), 'utf8');
            const data = yaml.parse(content) as any;
            if (data) {
              objects.push({
                name: file.replace('.yaml', ''),
                ...data
              });
            }
          } catch (error) {
            console.error(`Error loading ${file}:`, error);
          }
        }
      }
    }
    // console.log({ configs, objects })
    return json({ configs,objects });
  } catch (error) {
    console.error('Error loading configurations:', error);
    return json({ "configs": [], "objects": [] });
  }
}