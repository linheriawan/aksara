// src/routes/designer/data/[endpoint]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  handleAvailableSources,
  handleLoadConfigs,
  handleSaveConfig,
  handleTestConnection,
  handleTableFields,
  handleApiFields,
  handleFileFields,
  handleAnalyzeChanges
} from '../dataHandlers';

export const GET: RequestHandler = async ({ params, url }) => {
  const { endpoint } = params;
  
  try {
    switch (endpoint) {
      case 'load-configs':
        return await handleLoadConfigs(url);
      default:
        return json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Error in GET ${endpoint}:`, error);
    return json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ params, request }) => {
  const { endpoint } = params;
  
  try {
    const body = await request.json();
    
    switch (endpoint) {
      case 'available-sources':
        return await handleAvailableSources(body);
      case 'save-config':
        return await handleSaveConfig(body);
      case 'test-connection':
        return await handleTestConnection(body);
      case 'table-fields':
        return await handleTableFields(body);
      case 'api-fields':
        return await handleApiFields(body);
      case 'file-fields':
        return await handleFileFields(body);
      case 'analyze-changes':
        return await handleAnalyzeChanges(body);
      default:
        return json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Error in POST ${endpoint}:`, error);
    return json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};