// src/lib/utils/interfaceScanner.ts
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface InterfaceInfo {
  name: string;
  file: string;
  relativePath: string;
  source: string; // The actual interface definition
  fields?: string[]; // Extracted field names
}

export interface InterfaceScanResult {
  interfaces: InterfaceInfo[];
  files: string[];
  error?: string;
}

// Default files to scan for interfaces
const DEFAULT_INTERFACE_FILES = [
  'src/lib/utils/customUtils.ts',
  'src/lib/types',
  'src/lib/interfaces', 
  'src/types'
];

/**
 * Scan specified files for TypeScript interfaces
 */
export function scanForInterfaces(filePaths?: string[]): InterfaceScanResult {
  const pathsToScan = filePaths || DEFAULT_INTERFACE_FILES;
  const interfaces: InterfaceInfo[] = [];
  const scannedFiles: string[] = [];
  
  try {
    for (const pattern of pathsToScan) {
      const files = expandPath(pattern);
      
      for (const filePath of files) {
        if (existsSync(filePath)) {
          scannedFiles.push(filePath);
          const fileInterfaces = extractInterfacesFromFile(filePath);
          interfaces.push(...fileInterfaces);
        }
      }
    }
    
    // Sort interfaces alphabetically
    interfaces.sort((a, b) => a.name.localeCompare(b.name));
    
    return {
      interfaces,
      files: scannedFiles
    };
  } catch (error) {
    return {
      interfaces: [],
      files: scannedFiles,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Extract interfaces from a single TypeScript file
 */
function extractInterfacesFromFile(filePath: string): InterfaceInfo[] {
  try {
    const content = readFileSync(filePath, 'utf8');
    const interfaces: InterfaceInfo[] = [];
    
    // Regex to match interface definitions
    const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]*)\}/g;
    
    let match;
    while ((match = interfaceRegex.exec(content)) !== null) {
      const [fullMatch, interfaceName, interfaceBody] = match;
      
      // Extract field names from interface body
      const fields = extractFieldNames(interfaceBody);
      
      interfaces.push({
        name: interfaceName,
        file: filePath,
        relativePath: getRelativePath(filePath),
        source: fullMatch,
        fields
      });
    }
    
    return interfaces;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

/**
 * Extract field names from interface body
 */
function extractFieldNames(interfaceBody: string): string[] {
  const fields: string[] = [];
  
  // Remove comments and split by lines
  const lines = interfaceBody
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
      // Match field definitions: fieldName?: type;
      const fieldMatch = trimmed.match(/^\s*(\w+)\??:\s*/);
      if (fieldMatch) {
        fields.push(fieldMatch[1]);
      }
    }
  }
  
  return fields;
}

/**
 * Expand paths to actual file paths (handles directories and direct files)
 */
function expandPath(pattern: string): string[] {
  try {
    const basePath = process.cwd();
    const fullPath = join(basePath, pattern);
    
    if (!existsSync(fullPath)) {
      return [];
    }
    
    const stat = statSync(fullPath);
    
    if (stat.isFile()) {
      // Direct file path
      return [fullPath];
    } else if (stat.isDirectory()) {
      // Directory - scan for .ts files
      return scanDirectory(fullPath);
    }
    
    return [];
  } catch (error) {
    console.error(`Error expanding pattern ${pattern}:`, error);
    return [];
  }
}

/**
 * Recursively scan directory for TypeScript files
 */
function scanDirectory(dirPath: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);
      
      if (stat.isFile() && extname(entry) === '.ts') {
        files.push(fullPath);
      } else if (stat.isDirectory() && !entry.startsWith('.')) {
        // Recursively scan subdirectories (skip hidden directories)
        files.push(...scanDirectory(fullPath));
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return files;
}

/**
 * Get relative path from project root
 */
function getRelativePath(absolutePath: string): string {
  const projectRoot = process.cwd();
  return absolutePath.replace(projectRoot, '').replace(/^[\/\\]/, '');
}

/**
 * Get interface by name from scan results
 */
export function findInterfaceByName(scanResult: InterfaceScanResult, name: string): InterfaceInfo | undefined {
  return scanResult.interfaces.find(iface => iface.name === name);
}

/**
 * Get interfaces from a specific file
 */
export function getInterfacesFromFile(scanResult: InterfaceScanResult, filePath: string): InterfaceInfo[] {
  return scanResult.interfaces.filter(iface => 
    iface.file === filePath || iface.relativePath === filePath
  );
}

/**
 * Group interfaces by file
 */
export function groupInterfacesByFile(scanResult: InterfaceScanResult): Map<string, InterfaceInfo[]> {
  const grouped = new Map<string, InterfaceInfo[]>();
  
  for (const iface of scanResult.interfaces) {
    const relativePath = iface.relativePath;
    if (!grouped.has(relativePath)) {
      grouped.set(relativePath, []);
    }
    grouped.get(relativePath)!.push(iface);
  }
  
  return grouped;
}