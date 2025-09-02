import type { Component } from 'svelte';

export interface ComponentDef {
  type: string;
  name: string;
  component: Component;
  category?: string;
  icon?: string;
  description?: string;
  props?: Record<string, any>;
  nestable?: boolean;
}

const componentRegistry: Map<string, ComponentDef> = new Map();

export const NESTABLE_TYPES = new Set(['div', 'SctForm']);

export function registerComponent(def: ComponentDef): void {
  componentRegistry.set(def.type, def);
  
  if (def.nestable) {
    NESTABLE_TYPES.add(def.type);
  }
}

export function getComponent(type: string): Component | false {
  const def = componentRegistry.get(type);
  return def ? def.component : false;
}

export function getComponentDefinition(type: string): ComponentDef | undefined {
  return componentRegistry.get(type);
}

export function getAvailableComponents(): ComponentDef[] {
  return Array.from(componentRegistry.values());
}

export function getComponentsByCategory(category: string): ComponentDef[] {
  return Array.from(componentRegistry.values())
    .filter(def => def.category === category);
}

export function isNestableComponent(type: string): boolean {
  return NESTABLE_TYPES.has(type);
}

export function unregisterComponent(type: string): boolean {
  const existed = componentRegistry.has(type);
  componentRegistry.delete(type);
  NESTABLE_TYPES.delete(type);
  return existed;
}

export function clearComponentRegistry(): void {
  componentRegistry.clear();
  NESTABLE_TYPES.clear();
}

// Initialize core components synchronously since we know they exist
let coreComponentsLoaded = false;

export function loadCoreComponents(): void {
  if (coreComponentsLoaded) return;

  try {
    // Import components synchronously since they're local
    import('$lib/components/inps.svelte').then(Inp => {
      registerComponent({
        type: 'Inp',
        name: 'Input',
        component: Inp.default,
        category: 'form',
        icon: 'input',
        description: 'Generic input component',
        nestable: false
      });
    });
    
    import('$lib/components/sct/form.svelte').then(SctForm => {
      registerComponent({
        type: 'SctForm',
        name: 'Form Section',
        component: SctForm.default,
        category: 'layout',
        icon: 'form',
        description: 'Form container component',
        nestable: true
      });
    });

    coreComponentsLoaded = true;
  } catch (error) {
    console.error('Failed to load core components:', error);
  }
}

// Auto-load on import
loadCoreComponents();

export async function renderComponent(type: string, props: any): Promise<string> {
  const componentDef = getComponentDefinition(type);
  if (!componentDef) {
    throw new Error(`Component type "${type}" not found in registry`);
  }
  
  try {
    return `<${type} ${Object.entries(props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')} />`;
  } catch (error) {
    throw new Error(`Failed to render component "${type}": ${error}`);
  }
}