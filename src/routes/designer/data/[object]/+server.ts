// src/routes/designer/data/[object]/+server.ts
import { json } from '@sveltejs/kit';
import { dataConfigManager } from '../dataConfig.ts';
import { dataAccessManager } from '../dataAccess.ts';

export async function GET({ params, url }) {
  try {
    const objectName = params.object;
    const config = dataConfigManager.getObjectWithDataSource(objectName);
    
    if (!config) {
      return json({ error: 'Object not found' }, { status: 404 });
    }

    const { object, dataSource } = config;
    let rawData;

    // Fetch data based on data source type
    switch (dataSource.type) {
      case 'mysql':
        const query = `SELECT * FROM ${object.source}`;
        rawData = await dataAccessManager.queryMySQL(dataSource, query);
        break;
        
      case 'rest':
        rawData = await dataAccessManager.queryREST(dataSource, object.source);
        break;
        
      case 'filesystem':
        rawData = await dataAccessManager.queryFileSystem(dataSource, object.source);
        break;
        
      default:
        return json({ error: 'Unsupported data source type' }, { status: 400 });
    }

    // Map raw data to object definition 
    const mappedData = dataAccessManager.mapDataToObject(rawData, object);

    return json({
      object: objectName,
      dataSource: dataSource.name,
      data: mappedData
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return json({ error: error }, { status: 500 });
  }
}

export async function POST({ params, request }) {
  try {
    const objectName = params.object;
    const config = dataConfigManager.getObjectWithDataSource(objectName);
    
    if (!config) {
      return json({ error: 'Object not found' }, { status: 404 });
    }

    const { object, dataSource } = config;
    const newData = await request.json();

    // Validate required fields
    const errors = [];
    for (const field of object.fields) {
      if (field.required && (newData[field.name] === undefined || newData[field.name] === null)) {
        errors.push(`Field '${field.name}' is required`);
      }
    }

    if (errors.length > 0) {
      return json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // Convert object data to source format
    const sourceData: any = {};
    for (const field of object.fields) {
      if (newData[field.name] !== undefined) {
        sourceData[field.mapping] = newData[field.name];
      }
    }

    // Insert data based on data source type
    switch (dataSource.type) {
      case 'mysql':
        const fields = Object.keys(sourceData);
        const values = Object.values(sourceData);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO ${object.source} (${fields.join(', ')}) VALUES (${placeholders})`;
        
        await dataAccessManager.queryMySQL(dataSource, query, values);
        break;
        
      case 'rest':
        await dataAccessManager.queryREST(dataSource, object.name);

        break;
    }

  }catch(e){ console.error('Err:',e); }
}