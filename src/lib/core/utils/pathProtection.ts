// Path protection utility for separating core, defaults, and user-generated content

export interface AssetMetadata {
  readonly: boolean;
  system: boolean;
  category: 'core' | 'default' | 'generated' | 'user';
  version?: string;
  path: string;
}

// Define protected paths that should be readonly
export const READONLY_PATHS = [
  '/src/lib/core',
  '/src/lib/defaults'
] as const;

export const EDITABLE_PATHS = [
  '/src/lib/datadef',      // User configurations (your current work)
  '/src/lib/generated',    // Auto-generated content
  '/src/lib/workspace'     // Future user workspace
] as const;

/**
 * Check if a path is readonly (core or default system files)
 */
export function isPathReadonly(path: string): boolean {
  return READONLY_PATHS.some(readonly => path.startsWith(readonly));
}

/**
 * Check if a path is user-editable
 */
export function isPathEditable(path: string): boolean {
  return EDITABLE_PATHS.some(editable => path.startsWith(editable));
}

/**
 * Get category from path
 */
export function getPathCategory(path: string): AssetMetadata['category'] {
  if (path.startsWith('/src/lib/core')) return 'core';
  if (path.startsWith('/src/lib/defaults')) return 'default';
  if (path.startsWith('/src/lib/generated')) return 'generated';
  return 'user';
}

/**
 * Parse asset metadata from YAML/config
 */
export function parseAssetMetadata(config: any, path: string): AssetMetadata {
  return {
    readonly: config.readonly ?? isPathReadonly(path),
    system: config.system ?? isPathReadonly(path),
    category: config.category ?? getPathCategory(path),
    version: config.metadata?.version ?? config.version,
    path
  };
}

/**
 * Validate if an operation is allowed on an asset
 */
export function canPerformOperation(
  metadata: AssetMetadata, 
  operation: 'read' | 'write' | 'delete' | 'copy'
): boolean {
  switch (operation) {
    case 'read':
    case 'copy':
      return true; // All assets can be read/copied
    
    case 'write':
    case 'delete':
      return !metadata.readonly && !metadata.system;
    
    default:
      return false;
  }
}

/**
 * Get user-friendly labels for asset types
 */
export function getAssetTypeLabel(metadata: AssetMetadata): string {
  if (metadata.system) return '🔒 System';
  if (metadata.category === 'default') return '📄 Template';
  if (metadata.category === 'generated') return '⚙️ Generated';
  return '👤 Custom';
}