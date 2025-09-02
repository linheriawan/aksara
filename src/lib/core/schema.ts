import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export type FormElement = {
  _id?: string;
  type: string;
  props: Record<string, any>;
  nesting?: FormElement[];
};

export interface Schema extends Array<FormElement> {}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateSchema(schema: FormElement[]): ValidationResult {
  const errors: string[] = [];
  
  const validateElement = (element: FormElement, path: string = '') => {
    if (!element.type) {
      errors.push(`Element at ${path} missing type`);
    }
    
    if (!element._id) {
      errors.push(`Element at ${path} missing _id`);
    }
    
    if (!element.props || typeof element.props !== 'object') {
      errors.push(`Element at ${path} missing or invalid props`);
    }
    
    if (element.nesting) {
      if (!Array.isArray(element.nesting)) {
        errors.push(`Element at ${path} has invalid nesting (must be array)`);
      } else {
        element.nesting.forEach((child, index) => {
          validateElement(child, `${path}[${index}]`);
        });
      }
    }
  };
  
  schema.forEach((element, index) => {
    validateElement(element, `[${index}]`);
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function schemaToYaml(schema: FormElement[]): string {
  const cleanSchema = schema.map(element => {
    const clean = { ...element };
    if (clean._id) delete clean._id;
    return clean;
  });
  
  return stringifyYaml(cleanSchema, {
    indent: 2,
    lineWidth: 120,
    minContentWidth: 0
  });
}

export function yamlToSchema(yamlString: string): FormElement[] {
  try {
    const parsed = parseYaml(yamlString);
    if (!Array.isArray(parsed)) {
      throw new Error('YAML must represent an array of form elements');
    }
    
    const addIds = (elements: FormElement[]): FormElement[] => {
      return elements.map(element => {
        const el = { ...element };
        if (!el._id) {
          el._id = 'el_' + Math.random().toString(36).substr(2, 9);
        }
        if (el.nesting) {
          el.nesting = addIds(el.nesting);
        }
        return el;
      });
    };
    
    return addIds(parsed);
  } catch (error) {
    console.error('Failed to parse YAML:', error);
    return [];
  }
}

export function schemaToJson(schema: FormElement[]): string {
  return JSON.stringify(schema, null, 2);
}

export function jsonToSchema(jsonString: string): FormElement[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error('JSON must represent an array of form elements');
    }
    return parsed;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return [];
  }
}

export function generateSvelteCode(schema: FormElement[]): string {
  const generateElement = (element: FormElement, indent: string = ''): string => {
    const { type, props, nesting } = element;
    const propsStr = Object.entries(props)
      .filter(([key, value]) => key !== '_id' && value !== undefined && value !== '')
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? key : `${key}={false}`;
        } else {
          return `${key}={${JSON.stringify(value)}}`;
        }
      })
      .join(' ');
    
    const openTag = propsStr ? `<${type} ${propsStr}>` : `<${type}>`;
    const closeTag = `</${type}>`;
    
    if (nesting && nesting.length > 0) {
      const children = nesting
        .map(child => generateElement(child, indent + '  '))
        .join('\n');
      return `${indent}${openTag}\n${children}\n${indent}${closeTag}`;
    } else {
      return `${indent}${openTag}${closeTag}`;
    }
  };
  
  return schema.map(element => generateElement(element)).join('\n');
}

export function generateId(): string {
  return 'el_' + Math.random().toString(36).substr(2, 9);
}

export class SchemaManager {
  private schema: FormElement[];
  private listeners: Set<(schema: FormElement[]) => void> = new Set();
  
  constructor(initialSchema: FormElement[] = []) {
    this.schema = this.cloneData(initialSchema);
  }
  
  private cloneData<T>(data: T): T {
    try {
      return structuredClone(data);
    } catch (e) {
      try {
        return JSON.parse(JSON.stringify(data));
      } catch (jsonError) {
        console.error('Failed to clone data:', jsonError);
        return data;
      }
    }
  }
  
  subscribe(listener: (schema: FormElement[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify(): void {
    this.listeners.forEach(listener => listener(this.cloneData(this.schema)));
  }
  
  getSchema(): FormElement[] {
    return this.cloneData(this.schema);
  }
  
  setSchema(schema: FormElement[]): void {
    this.schema = this.cloneData(schema);
    this.notify();
  }
  
  updateElement(path: number[], updates: Partial<FormElement>): void {
    const element = this.getElementByPath(this.schema, path);
    if (element) {
      Object.assign(element, updates);
      this.notify();
    }
  }
  
  private getElementByPath(schema: FormElement[], path: number[]): FormElement | null {
    if (!path.length || !schema[path[0]]) return null;
    
    let current = schema[path[0]];
    
    for (let i = 1; i < path.length; i++) {
      if (!current.nesting?.[path[i]]) return null;
      current = current.nesting[path[i]];
    }
    
    return current;
  }
}