// Local types specific to form designer UI
export interface DraggedItem {
  isNew: boolean;
  path?: number[];
  type: string;
  inputType?: string;
  element?: any; // Use any since FormElement is now in core
}

export interface DropZone {
  path: number[];
  position: 'before' | 'after' | 'inside';
}

// Re-export from core for convenience (all other functions moved to core)
export { 
  type FormElement, 
  type Schema,
  generateId,
  cloneData,
  getElementByPath,
  setElementByPath,
  removeElementByPath,
  insertElementAtPath,
  moveElement,
  updateElementProperty,
  addElementProperty,
  removeElementProperty,
  isPathEqual,
  getPathString
} from '$lib/core/data';

export { 
  generateSvelteCode,
  schemaToYaml,
  yamlToSchema,
  schemaToJson,
  jsonToSchema,
  validateSchema,
  SchemaManager
} from '$lib/core/schema';

export {
  getComponent,
  isNestableComponent as isNestable
} from '$lib/core/components';