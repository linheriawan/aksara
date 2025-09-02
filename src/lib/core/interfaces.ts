// Client-safe interface utilities (no Node.js dependencies)

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

export function generateInterfaceName(objectName: string): string {
  return objectName
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function generateFieldDefinition(field: ObjField): string {
  const optional = field.required ? '' : '?';
  const tsType = mapToTypeScriptType(field.type);
  return `  ${field.name}${optional}: ${tsType};`;
}

export function mapToTypeScriptType(fieldType: string): string {
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

export function generateInterface(objectSchema: ObjectDef): string {
  const interfaceName = generateInterfaceName(objectSchema.name);
  const fields = objectSchema.fields.map(field => generateFieldDefinition(field));
  
  return `export interface ${interfaceName} {
${fields.join('\n')}
}`;
}

export function generateTypeScriptDeclarations(objects: ObjectDef[]): string {
  return objects.map(obj => generateInterface(obj)).join('\n\n');
}

export function mapTypeScriptTypeToFieldType(tsType: string): string {
  if (tsType.includes('string')) return 'string';
  if (tsType.includes('number')) return 'number';
  if (tsType.includes('boolean')) return 'boolean';
  if (tsType.includes('Date')) return 'date';
  if (tsType.includes('[]')) return 'array';
  if (tsType.includes('Record') || tsType === 'object') return 'object';
  return 'any';
}

// For server-side functions, import separately
export type { InterfaceStatus as ServerInterfaceStatus } from './interfaces-server.js';