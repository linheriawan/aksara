// Server-only interface generation (uses Node.js fs)
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ObjField {
  name: string;
  type: string;
  required: boolean;
  mapping: string;
}

export interface ObjectDef {
  name: string;
  fields: ObjField[];
}

export interface InterfaceStatus {
  exists: boolean;
  interfaceName: string;
  needsUpdate?: boolean;
}

const CUSTOM_UTILS_PATH = join(process.cwd(), 'src/lib/utils/customUtils.ts');

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

export function generateInterface(objectSchema: ObjectDef): string {
  const interfaceName = generateInterfaceName(objectSchema.name);
  const fields = objectSchema.fields.map(field => generateFieldDefinition(field));
  
  return `export interface ${interfaceName} {
${fields.join('\n')}
}`;
}

function generateInterfaceName(objectName: string): string {
  return objectName
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function generateFieldDefinition(field: ObjField): string {
  const optional = field.required ? '' : '?';
  const tsType = mapToTypeScriptType(field.type);
  return `  ${field.name}${optional}: ${tsType};`;
}

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

export function addInterfaceToFile(objectSchema: ObjectDef): void {
  const interfaceName = generateInterfaceName(objectSchema.name);
  const interfaceCode = generateInterface(objectSchema);
  
  const dir = join(process.cwd(), 'src/lib/utils');
  if (!existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
  }
  
  let content = '';
  if (existsSync(CUSTOM_UTILS_PATH)) {
    content = readFileSync(CUSTOM_UTILS_PATH, 'utf8');
  }
  
  const interfaceRegex = new RegExp(
    `export\\s+interface\\s+${interfaceName}\\s*{[^}]*}`,
    'gi'
  );
  
  if (interfaceRegex.test(content)) {
    content = content.replace(interfaceRegex, interfaceCode);
  } else {
    if (content.trim()) {
      content += '\n\n' + interfaceCode;
    } else {
      content = interfaceCode;
    }
  }
  
  writeFileSync(CUSTOM_UTILS_PATH, content, 'utf8');
}

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

export function generateTypeScriptDeclarations(objects: ObjectDef[]): string {
  return objects.map(obj => generateInterface(obj)).join('\n\n');
}

export function parseInterfaceFromFile(filePath: string, interfaceName: string): ObjectDef | null {
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(filePath, 'utf8');
    const interfaceRegex = new RegExp(
      `export\\s+interface\\s+${interfaceName}\\s*{([^}]*)}`,
      'i'
    );
    
    const match = content.match(interfaceRegex);
    if (!match) {
      return null;
    }
    
    const fieldsText = match[1];
    const fields: ObjField[] = [];
    
    const fieldRegex = /(\w+)(\?)?\s*:\s*([^;]+);/g;
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(fieldsText)) !== null) {
      const [, name, optional, type] = fieldMatch;
      fields.push({
        name,
        type: mapTypeScriptTypeToFieldType(type.trim()),
        required: !optional,
        mapping: name
      });
    }
    
    return {
      name: interfaceName.toLowerCase(),
      fields
    };
  } catch (error) {
    console.error(`Error parsing interface from ${filePath}:`, error);
    return null;
  }
}

function mapTypeScriptTypeToFieldType(tsType: string): string {
  if (tsType.includes('string')) return 'string';
  if (tsType.includes('number')) return 'number';
  if (tsType.includes('boolean')) return 'boolean';
  if (tsType.includes('Date')) return 'date';
  if (tsType.includes('[]')) return 'array';
  if (tsType.includes('Record') || tsType === 'object') return 'object';
  return 'any';
}