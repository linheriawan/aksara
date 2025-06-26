// src/routes/designer/data/load-configs/+server.ts (Updated)
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dataConfigManager } from '../dataConfig';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const dataSourceName = url.searchParams.get('dataSource');
    
    const configs = dataConfigManager.loadDataSources();
    
    // Load objects - filter by data source if specified
    let objects;
    if (dataSourceName) {
      objects = dataConfigManager.loadObjectsForDataSource(dataSourceName);
    } else {
      objects = dataConfigManager.loadObjectDefinitions();
    }
    
    return json({
      configs,
      objects
    });
  } catch (error) {
    console.error('Error loading configurations:', error);
    return json({ 
      error: 'Failed to load configurations',
      configs: [],
      objects: []
    }, { status: 500 });
  }
};