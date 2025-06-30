// route.ts - Enhanced interface with configuration support

export type PageType = 'listing' | 'dashboard' | 'form' | 'component' | 'link';

export interface PageConfig {
  type: PageType;
  title?: string;
  description?: string;
  
  // Reference to existing .svelte file
  componentPath?: string;
  
  // Reference to ObjectDef for data-driven pages
  objectRef?: string;
  
  // Simple configuration for different page types
  config?: {
    // For listing pages
    columns?: string[];
    filters?: string[];
    pageSize?: number;
    
    // For form pages
    sections?: string[];
    layout?: 'single' | 'tabbed' | 'modal';
    
    // For link pages
    targetType?: 'route' | 'component' | 'external';
    target?: string;
    openInNewTab?: boolean;
    
    // For dashboard pages
    widgets?: string[];
    
    // Any additional props to pass to the component
    props?: Record<string, any>;
    
    // Allow any additional config properties
    [key: string]: any;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  order: number;
  visible: boolean;
  
  // Simple page configuration
  pageConfig: PageConfig;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  
  children?: MenuItem[];
}

export interface RouteConfig {
  version: string;
  lastModified: string;
  routes: MenuItem[];
}

// Core utility functions
export function listPaths(routes: MenuItem[], base = ''): string[] {
  let paths: string[] = [];
  
  const sortedRoutes = [...routes].sort((a, b) => a.order - b.order);
  
  for (const r of sortedRoutes) {
    if (!r.visible) continue;
    
    const fullPath = base ? `${base}/${r.name}` : r.name;
    paths.push(fullPath);
    
    if (r.children && r.children.length > 0) {
      paths = paths.concat(listPaths(r.children, fullPath));
    }
  }
  return paths;
}

export function getNodeByPath(data: MenuItem[], path: string): MenuItem | undefined {
  const parts = path.split('/');
  let currentNodes: MenuItem[] | undefined = data;
  let foundNode: MenuItem | undefined;
  
  for (const part of parts) {
    if (!currentNodes) return undefined;
    foundNode = currentNodes.find((r) => r.name === part);
    if (!foundNode) return undefined;
    currentNodes = foundNode.children;
  }
  return foundNode;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function createDefaultMenuItem(name: string, path: string): MenuItem {
  return {
    id: generateId(),
    name,
    path,
    icon: 'default',
    order: 0,
    visible: true,
    pageConfig: {
      type: 'component',
      title: name,
      description: '',
      componentPath: `$lib/components/pages/${name}.svelte`,
      config: {
        props: {}
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Utility functions for drag and drop
export function reorderItems(items: MenuItem[], startIndex: number, endIndex: number): MenuItem[] {
  const result = Array.from(items);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  
  return result.map((item, index) => ({
    ...item,
    order: index,
    updatedAt: new Date().toISOString()
  }));
}

export function moveItemToParent(
  routes: MenuItem[], 
  itemId: string, 
  newParentPath: string | null,
  newIndex: number
): MenuItem[] {
  const result = JSON.parse(JSON.stringify(routes));
  
  let itemToMove: MenuItem | null = null;
  function removeItem(items: MenuItem[]): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) {
        itemToMove = items.splice(i, 1)[0];
        return true;
      }
      if (items[i].children && removeItem(items[i].children!)) {
        return true;
      }
    }
    return false;
  }
  
  removeItem(result);
  
  if (!itemToMove) return routes;
  
  if (newParentPath) {
    const newParent = getNodeByPath(result, newParentPath);
    if (newParent) {
      if (!newParent.children) newParent.children = [];
      newParent.children.splice(newIndex, 0, {
        ...itemToMove,
        updatedAt: new Date().toISOString()
      });
      
      newParent.children = newParent.children.map((child, index) => ({
        ...child,
        order: index
      }));
    }
  } else {
    result.splice(newIndex, 0, {
      ...itemToMove,
      updatedAt: new Date().toISOString()
    });
    
    result.forEach((item, index) => {
      item.order = index;
    });
  }
  
  return result;
}

// Business logic functions moved from page component
export class RouteManager {
  static initializePageConfig(item: MenuItem, type: PageType): void {
    if (!item.pageConfig.config) {
      item.pageConfig.config = {};
    }
    
    // Ensure props exist
    if (!item.pageConfig.config.props) {
      item.pageConfig.config.props = {};
    }
    
    item.pageConfig.type = type;
    item.pageConfig.title = item.name;
    
    if (!item.pageConfig.componentPath) {
      item.pageConfig.componentPath = `$lib/components/pages/${item.name || 'Page'}.svelte`;
    }
    
    switch (type) {
      case 'listing':
        if (!item.pageConfig.config.pageSize) item.pageConfig.config.pageSize = 20;
        if (!item.pageConfig.config.columns) item.pageConfig.config.columns = [];
        if (!item.pageConfig.config.filters) item.pageConfig.config.filters = [];
        break;
      case 'form':
        if (!item.pageConfig.config.layout) item.pageConfig.config.layout = 'single';
        if (!item.pageConfig.config.sections) item.pageConfig.config.sections = [];
        break;
      case 'link':
        if (!item.pageConfig.config.targetType) item.pageConfig.config.targetType = 'route';
        if (item.pageConfig.config.openInNewTab === undefined) item.pageConfig.config.openInNewTab = false;
        if (!item.pageConfig.config.target) item.pageConfig.config.target = '';
        break;
      case 'dashboard':
        if (!item.pageConfig.config.widgets) item.pageConfig.config.widgets = [];
        break;
    }
  }

  static updateConfigFromStrings(
    item: MenuItem, 
    strings: {
      columnsString: string;
      filtersString: string;
      sectionsString: string;
      widgetsString: string;
      propsJsonString: string;
    }
  ): void {
    if (!item.pageConfig.config) {
      item.pageConfig.config = {};
    }
    
    // Ensure props exist
    if (!item.pageConfig.config.props) {
      item.pageConfig.config.props = {};
    }
    
    // Update arrays from comma-separated strings
    if (strings.columnsString.trim()) {
      item.pageConfig.config.columns = strings.columnsString.split(',').map(s => s.trim()).filter(s => s);
    } else {
      item.pageConfig.config.columns = [];
    }
    
    if (strings.filtersString.trim()) {
      item.pageConfig.config.filters = strings.filtersString.split(',').map(s => s.trim()).filter(s => s);
    } else {
      item.pageConfig.config.filters = [];
    }
    
    if (strings.sectionsString.trim()) {
      item.pageConfig.config.sections = strings.sectionsString.split(',').map(s => s.trim()).filter(s => s);
    } else {
      item.pageConfig.config.sections = [];
    }
    
    if (strings.widgetsString.trim()) {
      item.pageConfig.config.widgets = strings.widgetsString.split(',').map(s => s.trim()).filter(s => s);
    } else {
      item.pageConfig.config.widgets = [];
    }
    
    // Update props from JSON string
    if (strings.propsJsonString && strings.propsJsonString !== '{}') {
      try {
        item.pageConfig.config.props = JSON.parse(strings.propsJsonString);
      } catch {
        console.warn('Invalid JSON in props field');
      }
    } else {
      item.pageConfig.config.props = {};
    }
  }

  static getStringsFromItem(item: MenuItem): {
    columnsString: string;
    filtersString: string;
    sectionsString: string;
    widgetsString: string;
    propsJsonString: string;
  } {
    return {
      columnsString: Array.isArray(item.pageConfig.config?.columns) 
        ? item.pageConfig.config.columns.join(', ') 
        : '',
      filtersString: Array.isArray(item.pageConfig.config?.filters) 
        ? item.pageConfig.config.filters.join(', ') 
        : '',
      sectionsString: Array.isArray(item.pageConfig.config?.sections) 
        ? item.pageConfig.config.sections.join(', ') 
        : '',
      widgetsString: Array.isArray(item.pageConfig.config?.widgets) 
        ? item.pageConfig.config.widgets.join(', ') 
        : '',
      propsJsonString: item.pageConfig.config?.props 
        ? JSON.stringify(item.pageConfig.config.props, null, 2) 
        : '{}'
    };
  }

  static removeItem(routeConfig: RouteConfig, path: string, index: number): RouteConfig {
    const newData = JSON.parse(JSON.stringify(routeConfig));
    if (path) {
      const parent = getNodeByPath(newData.routes, path);
      if (parent && parent.children && parent.children[index]) {
        parent.children.splice(index, 1);
        parent.children = parent.children.map((child, idx) => ({
          ...child,
          order: idx,
          updatedAt: new Date().toISOString()
        }));
      }
    } else {
      if (newData.routes[index]) {
        newData.routes.splice(index, 1);
        newData.routes = newData.routes.map((route, idx) => ({
          ...route,
          order: idx,
          updatedAt: new Date().toISOString()
        }));
      }
    }
    newData.lastModified = new Date().toISOString();
    return newData;
  }

  static saveItem(
    routeConfig: RouteConfig, 
    item: MenuItem, 
    parentPath: string, 
    editingIndex?: number
  ): RouteConfig {
    const newData = JSON.parse(JSON.stringify(routeConfig));
    const updatedItem = { ...item, updatedAt: new Date().toISOString() };

    if (parentPath) {
      const parent = getNodeByPath(newData.routes, parentPath);
      if (parent) {
        if (!parent.children) parent.children = [];
        if (editingIndex === undefined) {
          updatedItem.order = parent.children.length;
          parent.children.push(updatedItem);
        } else {
          parent.children[editingIndex] = updatedItem;
        }
      }
    } else {
      if (editingIndex === undefined) {
        updatedItem.order = newData.routes.length;
        newData.routes.push(updatedItem);
      } else {
        newData.routes[editingIndex] = updatedItem;
      }
    }
    
    newData.lastModified = new Date().toISOString();
    return newData;
  }

  // Statistics functions
  static countVisibleRoutes(routes: MenuItem[]): number {
    function countVisible(routeList: MenuItem[]): number {
      return routeList.reduce((count, route) => {
        let visible = route.visible ? 1 : 0;
        if (route.children) {
          visible += countVisible(route.children);
        }
        return count + visible;
      }, 0);
    }
    return countVisible(routes);
  }

  static countByType(routes: MenuItem[], type: string): number {
    function countType(routeList: MenuItem[]): number {
      return routeList.reduce((count, route) => {
        let typeCount = route.pageConfig.type === type ? 1 : 0;
        if (route.children) {
          typeCount += countType(route.children);
        }
        return count + typeCount;
      }, 0);
    }
    return countType(routes);
  }

  static getObjectRefUsage(routes: MenuItem[]): { object: string; count: number }[] {
    const usage: Record<string, number> = {};
    
    function collectRefs(routeList: MenuItem[]) {
      routeList.forEach(route => {
        const ref = route.pageConfig.objectRef || 'No object';
        usage[ref] = (usage[ref] || 0) + 1;
        if (route.children) {
          collectRefs(route.children);
        }
      });
    }
    
    collectRefs(routes);
    
    return Object.entries(usage)
      .map(([object, count]) => ({ object, count }))
      .sort((a, b) => b.count - a.count);
  }
}

import * as yaml from 'yaml';
// Configuration manager for loading/saving
export class RouteConfigManager {
  static async load(): Promise<RouteConfig> {
    try {
      const response = await fetch('/designer/modules');
      if (response.ok) {
        const yamlText = await response.text();
        return yaml.parse(yamlText) as RouteConfig;
      } else {
        console.warn('Could not load route config, using default');
        return this.getDefaultConfig();
      }
    } catch (error) {
      console.warn('Could not load route config, using default:', error);
      return this.getDefaultConfig();
    }
  }

  static async persist(routeConfig: RouteConfig): Promise<void> {
    try {
      const yamlString = yaml.stringify(routeConfig, { indent: 2 });
      const res = await fetch('/designer/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-yaml' },
        body: yamlString
      });
      const result = await res.json();
      console.log('Saved successfully:', result);
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    }
  }

  private static getDefaultConfig(): RouteConfig {
    return {
      version: "1.0",
      lastModified: new Date().toISOString(),
      routes: []
    };
  }
}