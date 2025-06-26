// src/routes/designer/data/analyze-changes/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dataConfigManager } from '../dataConfig';
import type { ObjectDef } from '../conf';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { objectName, dataSourceName, newObject } = await request.json();
    
    if (!objectName || !dataSourceName || !newObject) {
      return json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = dataConfigManager.getObjectWithChanges(
      objectName, 
      dataSourceName, 
      newObject as ObjectDef
    );

    return json({
      isNew: result.isNew,
      changes: result.changes
    });
  } catch (error) {
    console.error('Error analyzing changes:', error);
    return json({ 
      error: 'Failed to analyze changes',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};