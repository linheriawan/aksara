import { json } from '@sveltejs/kit';
import type { Handle, RequestEvent } from '@sveltejs/kit';
import { isPathReadonly, canPerformOperation, parseAssetMetadata } from '$lib/core/utils/pathProtection';

/**
 * SvelteKit middleware to protect readonly paths
 */
export const handle: Handle = async ({ event, resolve }) => {
  // Check if this is a designer API call that might modify protected content
  if (event.url.pathname.startsWith('/designer/') && 
      (event.request.method === 'POST' || event.request.method === 'PUT' || event.request.method === 'DELETE')) {
    
    const protection = await checkPathProtection(event);
    if (protection.blocked) {
      return json(
        { 
          error: 'Access denied', 
          message: protection.message,
          readonly: true 
        }, 
        { status: 403 }
      );
    }
  }

  // Add protection info to locals for access in routes
  event.locals.pathProtection = {
    isReadonly: (path: string) => isPathReadonly(path),
    canModify: (assetData: any, path: string) => {
      const metadata = parseAssetMetadata(assetData, path);
      return canPerformOperation(metadata, 'write');
    }
  };

  const response = await resolve(event);
  return response;
};

async function checkPathProtection(event: RequestEvent) {
  const url = event.url.pathname;
  
  // Check for data source modifications
  if (url.includes('/designer/data/') || url.includes('/designer/modules/')) {
    try {
      const body = await event.request.text();
      const data = JSON.parse(body);
      
      // Check if the data being modified is readonly
      if (data.readonly === true || data.system === true) {
        return {
          blocked: true,
          message: 'Cannot modify readonly system assets. Copy to create your own version.'
        };
      }
      
      // Check path-based protection
      const targetPath = data.path || data.componentPath || '';
      if (targetPath && isPathReadonly(targetPath)) {
        return {
          blocked: true,
          message: 'Cannot modify files in protected system directories.'
        };
      }
      
    } catch (e) {
      // If we can't parse the request, let it continue
      console.warn('Failed to parse request for protection check:', e);
    }
  }
  
  return { blocked: false, message: '' };
}

// Extend the App.Locals interface
declare global {
  namespace App {
    interface Locals {
      pathProtection: {
        isReadonly: (path: string) => boolean;
        canModify: (assetData: any, path: string) => boolean;
      };
    }
  }
}