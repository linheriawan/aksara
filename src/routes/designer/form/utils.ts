import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export type FormElement = {
  _id?: string;
  type: string;
  props: Record<string, any>;
  nesting?: FormElement[];
};
export interface Schema extends Array<FormElement> {}
export interface DraggedItem {
  isNew: boolean;
  path?: number[];
  type: string;
  inputType?: string;
  element?: FormElement;
};
export interface DropZone {
  path: number[];
  position: 'before' | 'after' | 'inside';
};

import type { Component } from 'svelte';
import Inp from '$lib/components/inps.svelte';
import SctForm from '$lib/components/sct/form.svelte';

export const NESTABLE_TYPES = new Set(['div', 'SctForm']);
export const COMPONENT_MAP: Record<string, Component> = {
  'SctForm': SctForm,
  'Inp': Inp
};
export const getComponent = (type: string): Component | false => {
  return COMPONENT_MAP[type] || false;
};

// Safe cloning utility
export const cloneData = <T>(data: T): T => {
  try {
    return structuredClone(data);
  } catch (e) {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (jsonError) {
      console.error('Failed to clone data:', jsonError);
      return data; // Return original as fallback
    }
  }
};

// Path utilities
export const getElementByPath = (schema: FormElement[], path: number[]): FormElement | null => {
  if (!path.length || !schema[path[0]]) return null;
  
  let current = schema[path[0]];
  
  for (let i = 1; i < path.length; i++) {
    if (!current.nesting?.[path[i]]) return null;
    current = current.nesting[path[i]];
  }
  
  return current;
};

export const setElementByPath = (schema: FormElement[], path: number[], element: FormElement): FormElement[] => {
  if (!path.length) return schema;
  
  const newSchema = cloneData(schema);
  
  if (path.length === 1) {
    newSchema[path[0]] = element;
    return newSchema;
  }
  
  let current = newSchema[path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    if (!current.nesting) current.nesting = [];
    current = current.nesting[path[i]];
  }
  
  if (!current.nesting) current.nesting = [];
  current.nesting[path[path.length - 1]] = element;
  
  return newSchema;
};

export const removeElementByPath = (schema: FormElement[], path: number[]): FormElement[] => {
  if (!path.length) return schema;
  
  const newSchema = cloneData(schema);
  
  if (path.length === 1) {
    newSchema.splice(path[0], 1);
    return newSchema;
  }
  
  let current = newSchema[path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    if (!current.nesting) return newSchema;
    current = current.nesting[path[i]];
  }
  
  if (current.nesting) {
    current.nesting.splice(path[path.length - 1], 1);
  }
  
  return newSchema;
};

export const insertElementAtPath = (
  schema: FormElement[],
  path: number[],
  position: 'before' | 'after' | 'inside',
  element: FormElement
): FormElement[] => {
  const newSchema = cloneData(schema);
  
  // Insert at root level
  if (!path.length) {
    if (position === 'before') {
      newSchema.unshift(element);
    } else {
      newSchema.push(element);
    }
    return newSchema;
  }
  
  // Insert at top level (direct children of root)
  if (path.length === 1 && position !== 'inside') {
    const index = position === 'before' ? path[0] : path[0] + 1;
    newSchema.splice(index, 0, element);
    return newSchema;
  }
  
  // Navigate to target element
  let current = newSchema[path[0]];
  let parent = null;
  
  for (let i = 1; i < path.length; i++) {
    parent = current;
    if (!current.nesting) current.nesting = [];
    current = current.nesting[path[i]];
  }
  
  // Insert based on position
  if (position === 'inside') {
    if (!current.nesting) current.nesting = [];
    current.nesting.push(element);
  } else if (parent && parent.nesting) {
    const index = position === 'before' ? path[path.length - 1] : path[path.length - 1] + 1;
    parent.nesting.splice(index, 0, element);
  }
  
  return newSchema;
};

// Fixed move operation that handles path adjustments
export const moveElement = (
  schema: FormElement[],
  sourcePath: number[],
  targetPath: number[],
  position: 'before' | 'after' | 'inside'
): FormElement[] => {
  // Get the element to move
  const element = getElementByPath(schema, sourcePath);
  if (!element) return schema;
  
  // Clone the element to avoid reference issues
  const clonedElement = cloneData(element);
  
  // Remove the element first
  let newSchema = removeElementByPath(schema, sourcePath);
  
  // Adjust target path if necessary (when removing an element before the target)
  const adjustedTargetPath = adjustPathAfterRemoval(targetPath, sourcePath);
  
  // Insert at the new location
  newSchema = insertElementAtPath(newSchema, adjustedTargetPath, position, clonedElement);
  
  return newSchema;
};

// Helper to adjust paths after removal
const adjustPathAfterRemoval = (targetPath: number[], removedPath: number[]): number[] => {
  // If paths don't share a common ancestor, no adjustment needed
  if (targetPath.length === 0 || removedPath.length === 0) return targetPath;
  
  const adjusted = [...targetPath];
  
  // Check if they share the same parent at each level
  for (let i = 0; i < Math.min(targetPath.length, removedPath.length); i++) {
    if (i < removedPath.length - 1 && targetPath[i] !== removedPath[i]) {
      break; // Different branches, no adjustment needed
    }
    
    if (i === removedPath.length - 1) {
      // Same parent, check if target index needs adjustment
      if (targetPath[i] > removedPath[i]) {
        adjusted[i] = targetPath[i] - 1;
      }
      break;
    }
  }
  
  return adjusted;
};

// Schema manipulation utilities
export const updateElementProperty = (
  schema: FormElement[],
  path: number[],
  key: string,
  value: any
): FormElement[] => {
  const newSchema = cloneData(schema);
  const element = getElementByPath(newSchema, path);
  
  if (element) {
    element.props[key] = value;
  }
  
  return newSchema;
};

export const addElementProperty = (
  schema: FormElement[],
  path: number[],
  key: string,
  value: any = ""
): FormElement[] => {
  const newSchema = cloneData(schema);
  const element = getElementByPath(newSchema, path);
  
  if (element && !element.props.hasOwnProperty(key)) {
    element.props[key] = value;
  }
  
  return newSchema;
};

export const removeElementProperty = (
  schema: FormElement[],
  path: number[],
  key: string
): FormElement[] => {
  const newSchema = cloneData(schema);
  const element = getElementByPath(newSchema, path);
  
  if (element && element.props.hasOwnProperty(key)) {
    delete element.props[key];
  }
  
  return newSchema;
};

// Code generation utilities
export const generateSvelteCode = (schema: FormElement[]): string => {
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
};

// YAML utilities
export const schemaToYaml = (schema: FormElement[]): string => {
  const cleanSchema = schema.map(element => {
    const clean = { ...element };
    // Remove internal IDs from YAML output
    if (clean._id) delete clean._id;
    return clean;
  });
  
  return stringifyYaml(cleanSchema, {
    indent: 2,
    lineWidth: 120,
    minContentWidth: 0
  });
};

export const yamlToSchema = (yamlString: string): FormElement[] => {
  try {
    const parsed = parseYaml(yamlString);
    if (!Array.isArray(parsed)) {
      throw new Error('YAML must represent an array of form elements');
    }
    
    // Add IDs to elements that don't have them
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
};

// JSON utilities
export const schemaToJson = (schema: FormElement[]): string => {
  return JSON.stringify(schema, null, 2);
};

export const jsonToSchema = (jsonString: string): FormElement[] => {
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
};

// Validation utilities
export const validateSchema = (schema: FormElement[]): { isValid: boolean; errors: string[] } => {
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
};

// Path utilities
export const isPathEqual = (path1: number[], path2: number[]): boolean => {
  return path1.length === path2.length && path1.every((val, i) => val === path2[i]);
};

export const getPathString = (path: number[]): string => {
  return path.join(' → ');
};

export const generateId = (): string => {
  return 'el_' + Math.random().toString(36).substr(2, 9);
};

// Schema update wrapper for better state management
export class SchemaManager {
  private schema: FormElement[];
  private listeners: Set<(schema: FormElement[]) => void> = new Set();
  
  constructor(initialSchema: FormElement[] = []) {
    this.schema = cloneData(initialSchema);
  }
  
  subscribe(listener: (schema: FormElement[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify(): void {
    this.listeners.forEach(listener => listener(cloneData(this.schema)));
  }
  
  getSchema(): FormElement[] {
    return cloneData(this.schema);
  }
  
  setSchema(schema: FormElement[]): void {
    this.schema = cloneData(schema);
    this.notify();
  }
  
  updateElement(path: number[], updates: Partial<FormElement>): void {
    const element = getElementByPath(this.schema, path);
    if (element) {
      Object.assign(element, updates);
      this.notify();
    }
  }
  
  updateProperty(path: number[], key: string, value: any): void {
    this.schema = updateElementProperty(this.schema, path, key, value);
    this.notify();
  }
  
  addProperty(path: number[], key: string, value: any = ""): void {
    this.schema = addElementProperty(this.schema, path, key, value);
    this.notify();
  }
  
  removeProperty(path: number[], key: string): void {
    this.schema = removeElementProperty(this.schema, path, key);
    this.notify();
  }
  
  moveElement(sourcePath: number[], targetPath: number[], position: 'before' | 'after' | 'inside'): void {
    this.schema = moveElement(this.schema, sourcePath, targetPath, position);
    this.notify();
  }
  
  insertElement(path: number[], position: 'before' | 'after' | 'inside', element: FormElement): void {
    this.schema = insertElementAtPath(this.schema, path, position, element);
    this.notify();
  }
  
  removeElement(path: number[]): void {
    this.schema = removeElementByPath(this.schema, path);
    this.notify();
  }
}