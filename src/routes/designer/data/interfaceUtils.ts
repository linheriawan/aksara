// src/routes/designer/data/interfaceUtils.ts
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { ObjectDef, ObjField } from './conf';

const CUSTOM_UTILS_PATH = join(process.cwd(), 'src/lib/utils/customUtils.ts');

export interface InterfaceStatus {
  exists: boolean;
  interfaceName: string;
  needsUpdate?: boolean;
}

/**
 * Check if an interface exists for a given object schema
 */
export function checkInterfaceExists(objectName: string): InterfaceStatus {
  const interfaceName = generateInterfaceName(objectName);
  
  if (!existsSync(CUSTOM_UTILS_PATH)) {
    return { exists: false, interfaceName };
  }

  try {
    const content = readFileSync(CUSTOM_UTILS_PATH, 'utf8');
    const interfaceRegex = new RegExp(`export\\s+interface\\s+${interfaceName}\\s*{`, 'i');
    const exists = interfaceRegex.test(content);
    
    return { exists, interfaceName };
  } catch (error) {
    console.error('Error reading customUtils.ts:', error);
    return { exists: false, interfaceName };
  }
}

/**
 * Generate TypeScript interface from object schema
 */
export function generateInterface(objectSchema: ObjectDef): string {
  const interfaceName = generateInterfaceName(objectSchema.name);
  const fields = objectSchema.fields.map(field => generateFieldDefinition(field));
  
  return `export interface ${interfaceName} {
${fields.join('\n')}
}`;
}

/**
 * Generate interface name from object name (PascalCase)
 */
function generateInterfaceName(objectName: string): string {
  return objectName
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Generate field definition for TypeScript interface
 */
function generateFieldDefinition(field: ObjField): string {
  const optional = field.required ? '' : '?';
  const tsType = mapToTypeScriptType(field.type);
  return `  ${field.name}${optional}: ${tsType};`;
}

/**
 * Map object field types to TypeScript types
 */
function mapToTypeScriptType(fieldType: string): string {
  switch (fieldType) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'Date | string';
    case 'array':
      return 'any[]';
    case 'object':
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

/**
 * Add or update interface in customUtils.ts
 */
export function addInterfaceToFile(objectSchema: ObjectDef): void {
  const interfaceName = generateInterfaceName(objectSchema.name);
  const interfaceCode = generateInterface(objectSchema);
  
  // Ensure directory exists
  const dir = join(process.cwd(), 'src/lib/utils');
  if (!existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
  }
  
  let content = '';
  if (existsSync(CUSTOM_UTILS_PATH)) {
    content = readFileSync(CUSTOM_UTILS_PATH, 'utf8');
  }
  
  // Check if interface already exists
  const interfaceRegex = new RegExp(
    `export\\s+interface\\s+${interfaceName}\\s*{[^}]*}`,
    'gi'
  );
  
  if (interfaceRegex.test(content)) {
    // Replace existing interface
    content = content.replace(interfaceRegex, interfaceCode);
  } else {
    // Add new interface
    if (content.trim()) {
      content += '\n\n' + interfaceCode;
    } else {
      content = interfaceCode;
    }
  }
  
  writeFileSync(CUSTOM_UTILS_PATH, content, 'utf8');
}

/**
 * Remove interface from customUtils.ts
 */
export function removeInterfaceFromFile(objectName: string): boolean {
  if (!existsSync(CUSTOM_UTILS_PATH)) {
    return false;
  }
  
  const interfaceName = generateInterfaceName(objectName);
  let content = readFileSync(CUSTOM_UTILS_PATH, 'utf8');
  
  const interfaceRegex = new RegExp(
    `export\\s+interface\\s+${interfaceName}\\s*{[^}]*}\\s*`,
    'gi'
  );
  
  const newContent = content.replace(interfaceRegex, '');
  
  if (newContent !== content) {
    writeFileSync(CUSTOM_UTILS_PATH, newContent, 'utf8');
    return true;
  }
  
  return false;
}