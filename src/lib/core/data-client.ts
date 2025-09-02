// Client-side data utilities (no Node.js dependencies)
import type { FormElement } from './schema.js';

export function cloneData<T>(data: T): T {
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

export function getElementByPath(schema: FormElement[], path: number[]): FormElement | null {
  if (!path.length || !schema[path[0]]) return null;
  
  let current = schema[path[0]];
  
  for (let i = 1; i < path.length; i++) {
    if (!current.nesting?.[path[i]]) return null;
    current = current.nesting[path[i]];
  }
  
  return current;
}

export function setElementByPath(schema: FormElement[], path: number[], element: FormElement): FormElement[] {
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
}

export function removeElementByPath(schema: FormElement[], path: number[]): FormElement[] {
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
}

export function insertElementAtPath(
  schema: FormElement[],
  path: number[],
  position: 'before' | 'after' | 'inside',
  element: FormElement
): FormElement[] {
  const newSchema = cloneData(schema);
  
  if (!path.length) {
    if (position === 'before') {
      newSchema.unshift(element);
    } else {
      newSchema.push(element);
    }
    return newSchema;
  }
  
  if (path.length === 1 && position !== 'inside') {
    const index = position === 'before' ? path[0] : path[0] + 1;
    newSchema.splice(index, 0, element);
    return newSchema;
  }
  
  let current = newSchema[path[0]];
  let parent = null;
  
  for (let i = 1; i < path.length; i++) {
    parent = current;
    if (!current.nesting) current.nesting = [];
    current = current.nesting[path[i]];
  }
  
  if (position === 'inside') {
    if (!current.nesting) current.nesting = [];
    current.nesting.push(element);
  } else if (parent && parent.nesting) {
    const index = position === 'before' ? path[path.length - 1] : path[path.length - 1] + 1;
    parent.nesting.splice(index, 0, element);
  }
  
  return newSchema;
}

export function moveElement(
  schema: FormElement[],
  sourcePath: number[],
  targetPath: number[],
  position: 'before' | 'after' | 'inside'
): FormElement[] {
  const element = getElementByPath(schema, sourcePath);
  if (!element) return schema;
  
  const clonedElement = cloneData(element);
  
  let newSchema = removeElementByPath(schema, sourcePath);
  
  const adjustedTargetPath = adjustPathAfterRemoval(targetPath, sourcePath);
  
  newSchema = insertElementAtPath(newSchema, adjustedTargetPath, position, clonedElement);
  
  return newSchema;
}

function adjustPathAfterRemoval(targetPath: number[], removedPath: number[]): number[] {
  if (targetPath.length === 0 || removedPath.length === 0) return targetPath;
  
  const adjusted = [...targetPath];
  
  for (let i = 0; i < Math.min(targetPath.length, removedPath.length); i++) {
    if (i < removedPath.length - 1 && targetPath[i] !== removedPath[i]) {
      break;
    }
    
    if (i === removedPath.length - 1) {
      if (targetPath[i] > removedPath[i]) {
        adjusted[i] = targetPath[i] - 1;
      }
      break;
    }
  }
  
  return adjusted;
}

export function updateElementProperty(
  schema: FormElement[],
  path: number[],
  key: string,
  value: any
): FormElement[] {
  const newSchema = cloneData(schema);
  const element = getElementByPath(newSchema, path);
  
  if (element) {
    element.props[key] = value;
  }
  
  return newSchema;
}

export function addElementProperty(
  schema: FormElement[],
  path: number[],
  key: string,
  value: any = ""
): FormElement[] {
  const newSchema = cloneData(schema);
  const element = getElementByPath(newSchema, path);
  
  if (element && !element.props.hasOwnProperty(key)) {
    element.props[key] = value;
  }
  
  return newSchema;
}

export function removeElementProperty(
  schema: FormElement[],
  path: number[],
  key: string
): FormElement[] {
  const newSchema = cloneData(schema);
  const element = getElementByPath(newSchema, path);
  
  if (element && element.props.hasOwnProperty(key)) {
    delete element.props[key];
  }
  
  return newSchema;
}

export function isPathEqual(path1: number[], path2: number[]): boolean {
  return path1.length === path2.length && path1.every((val, i) => val === path2[i]);
}

export function getPathString(path: number[]): string {
  return path.join(' → ');
}

export function generateId(): string {
  return 'el_' + Math.random().toString(36).substr(2, 9);
}