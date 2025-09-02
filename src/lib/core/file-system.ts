// Client-safe file system utilities (no Node.js dependencies)

export interface FileSystemConfig {
  workspaceBasePath?: string;
  runtimeBasePath?: string;
  defaultsBasePath?: string;
}

// Path utilities that work in both client and server
export function joinPath(...parts: string[]): string {
  return parts.filter(p => p).join('/').replace(/\/+/g, '/');
}

export function getWorkspaceRelativePath(relativePath: string = ''): string {
  return joinPath('src/lib/workspace', relativePath);
}

export function getRuntimeRelativePath(relativePath: string = ''): string {
  return joinPath('src/lib/runtime', relativePath);
}

export function getDefaultsRelativePath(relativePath: string = ''): string {
  return joinPath('src/lib/defaults', relativePath);
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isYamlFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext === 'yaml' || ext === 'yml';
}

export function isJsonFile(filename: string): boolean {
  return getFileExtension(filename) === 'json';
}

// Client-safe validation functions
export function validatePath(path: string): boolean {
  // Basic path validation without filesystem access
  return path && path.length > 0 && !path.includes('..') && !path.startsWith('/');
}

export function normalizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
}