// Advanced route types for no-code platform
import * as yaml from 'yaml';

// Basic route types
export type RouteCategory = 'web' | 'api' | 'system';
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Advanced page types for web applications
export type WebPageType = 
  | 'data-list'        // List/table view of data with filters, pagination
  | 'data-view'        // Single record view (read-only)
  | 'data-form'        // Create/edit form for data
  | 'dashboard'        // Dashboard with widgets and charts
  | 'custom'           // Custom Svelte component
  | 'redirect';        // Redirect to another page

// API endpoint types
export type APIEndpointType =
  | 'crud'             // Full CRUD operations for a data source
  | 'custom'           // Custom API logic
  | 'proxy'            // Proxy to external API
  | 'webhook';         // Webhook receiver

// Data operations for CRUD
export type CRUDOperation = 'create' | 'read' | 'update' | 'delete' | 'list';

// Enhanced page configuration
export interface AdvancedPageConfig {
  category: RouteCategory;
  
  // Web page configuration
  web?: {
    type: WebPageType;
    dataSource?: string;          // Reference to data source
    objectSchema?: string;        // Reference to object schema
    
    // Data List configuration
    dataList?: {
      columns: string[];          // Columns to display
      searchFields: string[];     // Fields that can be searched
      sortFields: string[];       // Fields that can be sorted
      filters: FilterConfig[];    // Advanced filter configurations
      pagination: {
        pageSize: number;
        showSizeSelector: boolean;
      };
      actions: ActionConfig[];    // Row actions (edit, delete, custom)
      bulkActions: ActionConfig[]; // Bulk actions
    };
    
    // Data Form configuration
    dataForm?: {
      mode: 'create' | 'edit' | 'view';
      sections: FormSection[];    // Form sections/tabs
      validation: ValidationRule[];
      layout: 'single' | 'tabbed' | 'modal' | 'drawer';
      submitAction: 'save' | 'saveAndClose' | 'saveAndNew';
    };
    
    // Data View configuration (single record)
    dataView?: {
      fields: ViewField[];        // Fields to display
      layout: 'card' | 'table' | 'custom';
      actions: ActionConfig[];    // Available actions
    };
    
    // Dashboard configuration
    dashboard?: {
      widgets: DashboardWidget[];
      layout: 'grid' | 'flex' | 'custom';
      refreshInterval?: number;   // Auto-refresh in seconds
    };
    
    // Custom component
    custom?: {
      componentPath: string;
      props: Record<string, any>;
    };
    
    // Redirect configuration
    redirect?: {
      target: string;
      permanent: boolean;
      conditions?: RedirectCondition[];
    };
  };
  
  // API endpoint configuration
  api?: {
    type: APIEndpointType;
    
    // CRUD API configuration
    crud?: {
      dataSource: string;
      objectSchema: string;
      operations: CRUDOperation[];  // Which operations to expose
      endpoints: {
        [key in CRUDOperation]?: {
          method: HTTPMethod;
          path: string;
          middleware?: string[];    // Custom middleware
          validation?: ValidationRule[];
          permissions?: string[];   // Required permissions
        };
      };
    };
    
    // Custom API configuration
    custom?: {
      method: HTTPMethod;
      handler: string;              // Path to handler file
      middleware?: string[];
      validation?: ValidationRule[];
      permissions?: string[];
      description?: string;
    };
    
    // Proxy configuration
    proxy?: {
      targetUrl: string;
      method: HTTPMethod[];         // Allowed methods
      headers?: Record<string, string>;
      authentication?: {
        type: 'none' | 'bearer' | 'basic' | 'apikey';
        config: Record<string, any>;
      };
    };
    
    // Webhook configuration
    webhook?: {
      secret?: string;
      validation?: 'signature' | 'token' | 'none';
      handler: string;
      contentType: 'json' | 'form' | 'raw';
    };
  };
}

// Supporting interfaces
export interface FilterConfig {
  field: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  operator: 'equals' | 'contains' | 'startsWith' | 'gt' | 'lt' | 'between';
  options?: string[];               // For select filters
  defaultValue?: any;
}

export interface ActionConfig {
  id: string;
  label: string;
  icon?: string;
  type: 'link' | 'modal' | 'api' | 'download';
  target?: string;
  confirmation?: string;
  permissions?: string[];
}

export interface FormSection {
  id: string;
  title: string;
  fields: string[];
  layout: 'single' | 'two-column' | 'three-column';
  collapsible?: boolean;
}

export interface ViewField {
  field: string;
  label?: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'link' | 'image';
  format?: string;                  // Display format
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'stat' | 'table' | 'custom';
  dataSource?: string;
  query?: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
}

export interface ValidationRule {
  field: string;
  rules: Array<{
    type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value?: any;
    message: string;
  }>;
}

export interface RedirectCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains';
  value: any;
}

// New Route Configuration System
export interface CustomPageConfig {
  id: string;
  name: string;
  path: string; // e.g., "receipt", "report"
  component: string;
  title: string;
  formDesign?: string; // Optional form design for pages that need forms
  permissions?: string[];
}

export interface CustomEndpointConfig {
  id: string;
  name: string;
  method: HTTPMethod;
  path: string; // e.g., "activate", "bulk-import", "export/[format]"
  handler: string;
  description?: string;
  permissions?: string[];
}

export interface RouteConfiguration {
  id: string;
  name: string;
  basePath: string;
  dataSource: string;
  objectSchema: string;
  description?: string;
  
  web?: {
    enableList: boolean;
    enableCreate: boolean;
    enableView: boolean;
    enableEdit: boolean;
    unifiedViewEdit: boolean; // true = same page with mode toggle
    customPages: CustomPageConfig[];
    formDesign?: string; // Reference to Form Designer
    listColumns?: string[];
    formFields?: string[];
  };
  
  api?: {
    standardEndpoints: {
      fetchAll: boolean; // POST /api/route with filtering
      getOne: boolean;   // GET /api/route/[id]
      upsert: boolean;   // PUT /api/route/[id] (insert or update)
      create: boolean;   // POST /api/route (separate create)
      update: boolean;   // PATCH /api/route/[id] (separate update)
    };
    customEndpoints: CustomEndpointConfig[];
  };
  
  createdAt: string;
  updatedAt: string;
}

// Enhanced MenuItem with advanced configuration
export interface AdvancedMenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  order: number;
  visible: boolean;
  category: RouteCategory;
  
  // Advanced page configuration
  pageConfig: AdvancedPageConfig;
  
  // Metadata
  description?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  
  // Hierarchical structure
  children?: AdvancedMenuItem[];
  
  // System properties
  readonly?: boolean;
  system?: boolean;
}

export interface AdvancedRouteConfig {
  version: string;
  lastModified: string;
  routes: AdvancedMenuItem[];
  
  // Global configuration
  settings?: {
    defaultPageSize?: number;
    defaultTheme?: string;
    globalMiddleware?: string[];
    globalPermissions?: string[];
  };
}

// Route generation utilities
// Route Configuration Manager
export class RouteConfigurationManager {
  
  static generateRoutesFromConfig(config: RouteConfiguration): AdvancedMenuItem[] {
    const routes: AdvancedMenuItem[] = [];
    
    if (config.web) {
      if (config.web.enableList) {
        routes.push(this.createListRoute(config));
      }
      if (config.web.enableCreate) {
        routes.push(this.createCreateRoute(config));
      }
      if (config.web.enableView || config.web.enableEdit) {
        routes.push(this.createViewEditRoute(config));
      }
      // Add custom pages
      config.web.customPages.forEach(customPage => {
        routes.push(this.createCustomPageRoute(config, customPage));
      });
    }
    
    if (config.api) {
      routes.push(this.createAPIRoute(config));
      // Custom endpoints are handled within the main API route
    }
    
    return routes;
  }
  
  private static createListRoute(config: RouteConfiguration): AdvancedMenuItem {
    return {
      id: `${config.id}_list`,
      name: `${config.name} List`,
      path: config.basePath,
      icon: 'table',
      order: 0,
      visible: true,
      category: 'web',
      pageConfig: {
        category: 'web',
        web: {
          type: 'data-list',
          dataSource: config.dataSource,
          objectSchema: config.objectSchema,
          dataList: {
            columns: config.web?.listColumns || [],
            searchFields: config.web?.listColumns?.slice(0, 3) || [],
            sortFields: config.web?.listColumns || [],
            filters: [],
            pagination: { pageSize: 20, showSizeSelector: true },
            actions: [
              ...(config.web?.enableView ? [{ id: 'view', label: 'View', icon: 'eye', type: 'link' as const, target: `${config.basePath}/[id]` }] : []),
              ...(config.web?.enableEdit ? [{ id: 'edit', label: 'Edit', icon: 'edit', type: 'link' as const, target: `${config.basePath}/[id]` }] : []),
              { id: 'delete', label: 'Delete', icon: 'trash', type: 'api' as const, confirmation: 'Are you sure?' }
            ],
            bulkActions: [
              { id: 'delete', label: 'Delete Selected', icon: 'trash', type: 'api' as const, confirmation: 'Delete selected items?' }
            ]
          }
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  private static createCreateRoute(config: RouteConfiguration): AdvancedMenuItem {
    return {
      id: `${config.id}_create`,
      name: `Create ${config.name}`,
      path: `${config.basePath}/`,
      icon: 'plus',
      order: 1,
      visible: false, // Usually accessed from list page
      category: 'web',
      pageConfig: {
        category: 'web',
        web: {
          type: 'data-form',
          dataSource: config.dataSource,
          objectSchema: config.objectSchema,
          dataForm: {
            mode: 'create',
            sections: [{
              id: 'main',
              title: 'Information',
              fields: config.web?.formFields || [],
              layout: 'two-column'
            }],
            validation: [],
            layout: 'single',
            submitAction: 'saveAndClose'
          }
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  private static createViewEditRoute(config: RouteConfiguration): AdvancedMenuItem {
    const mode = config.web?.unifiedViewEdit ? 'edit' : 'view'; // Default mode
    
    return {
      id: `${config.id}_view_edit`,
      name: `${config.name} Details`,
      path: `${config.basePath}/[id]`,
      icon: 'eye',
      order: 2,
      visible: false, // Usually accessed from list page
      category: 'web',
      pageConfig: {
        category: 'web',
        web: {
          type: 'data-form',
          dataSource: config.dataSource,
          objectSchema: config.objectSchema,
          dataForm: {
            mode,
            sections: [{
              id: 'main',
              title: 'Information',
              fields: config.web?.formFields || [],
              layout: 'two-column'
            }],
            validation: [],
            layout: 'single',
            submitAction: 'saveAndClose'
          },
          custom: {
            componentPath: '$lib/components/UnifiedViewEdit.svelte',
            props: {
              enableView: config.web?.enableView || false,
              enableEdit: config.web?.enableEdit || false,
              unifiedMode: config.web?.unifiedViewEdit || false,
              formDesign: config.web?.formDesign
            }
          }
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  private static createCustomPageRoute(config: RouteConfiguration, customPage: CustomPageConfig): AdvancedMenuItem {
    return {
      id: `${config.id}_${customPage.id}`,
      name: `${config.name} ${customPage.name}`,
      path: `${config.basePath}/[id]/${customPage.path}`,
      icon: 'document',
      order: 10,
      visible: false,
      category: 'web',
      pageConfig: {
        category: 'web',
        web: {
          type: 'custom',
          custom: {
            componentPath: customPage.component,
            props: {
              title: customPage.title,
              permissions: customPage.permissions || []
            }
          }
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  private static createAPIRoute(config: RouteConfiguration): AdvancedMenuItem {
    const enabledOps = Object.entries(config.api?.standardEndpoints || {})
      .filter(([_, enabled]) => enabled)
      .map(([op, _]) => op as CRUDOperation);
    
    return {
      id: `${config.id}_api`,
      name: `${config.name} API`,
      path: `api/${config.basePath}`,
      icon: 'api',
      order: 0,
      visible: false,
      category: 'api',
      pageConfig: {
        category: 'api',
        api: {
          type: 'crud',
          crud: {
            dataSource: config.dataSource,
            objectSchema: config.objectSchema,
            operations: enabledOps,
            endpoints: {
              ...(config.api?.standardEndpoints.fetchAll ? { 
                list: { method: 'POST', path: `api/${config.basePath}`, permissions: ['read'] } 
              } : {}),
              ...(config.api?.standardEndpoints.create ? { 
                create: { method: 'POST', path: `api/${config.basePath}`, permissions: ['create'] } 
              } : {}),
              ...(config.api?.standardEndpoints.getOne ? { 
                read: { method: 'GET', path: `api/${config.basePath}/[id]`, permissions: ['read'] } 
              } : {}),
              ...(config.api?.standardEndpoints.update ? { 
                update: { method: 'PATCH', path: `api/${config.basePath}/[id]`, permissions: ['update'] } 
              } : {}),
              ...(config.api?.standardEndpoints.upsert ? { 
                upsert: { method: 'PUT', path: `api/${config.basePath}/[id]`, permissions: ['create', 'update'] } 
              } : {}),
            }
          },
          custom: {
            endpoints: config.api?.customEndpoints || []
          }
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

export class AdvancedRouteManager {
  
  static createDataListPage(config: {
    name: string;
    path: string;
    dataSource: string;
    objectSchema: string;
    columns: string[];
  }): AdvancedMenuItem {
    return {
      id: this.generateId(),
      name: config.name,
      path: config.path,
      icon: 'table',
      order: 0,
      visible: true,
      category: 'web',
      pageConfig: {
        category: 'web',
        web: {
          type: 'data-list',
          dataSource: config.dataSource,
          objectSchema: config.objectSchema,
          dataList: {
            columns: config.columns,
            searchFields: config.columns.slice(0, 3), // First 3 columns searchable
            sortFields: config.columns,
            filters: [],
            pagination: {
              pageSize: 20,
              showSizeSelector: true
            },
            actions: [
              { id: 'view', label: 'View', icon: 'eye', type: 'link', target: `${config.path}/[id]` },
              { id: 'edit', label: 'Edit', icon: 'edit', type: 'link', target: `${config.path}/[id]/edit` },
              { id: 'delete', label: 'Delete', icon: 'trash', type: 'api', confirmation: 'Are you sure?' }
            ],
            bulkActions: [
              { id: 'delete', label: 'Delete Selected', icon: 'trash', type: 'api', confirmation: 'Delete selected items?' }
            ]
          }
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  static createDataFormPage(config: {
    name: string;
    path: string;
    dataSource: string;
    objectSchema: string;
    mode: 'create' | 'edit' | 'view';
    fields: string[];
  }): AdvancedMenuItem {
    return {
      id: this.generateId(),
      name: config.name,
      path: config.path,
      icon: 'form',
      order: 0,
      visible: true,
      category: 'web',
      pageConfig: {
        category: 'web',
        web: {
          type: 'data-form',
          dataSource: config.dataSource,
          objectSchema: config.objectSchema,
          dataForm: {
            mode: config.mode,
            sections: [{
              id: 'main',
              title: 'Main Information',
              fields: config.fields,
              layout: 'two-column'
            }],
            validation: [],
            layout: 'single',
            submitAction: 'saveAndClose'
          }
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  static createCRUDAPI(config: {
    name: string;
    path: string;
    dataSource: string;
    objectSchema: string;
    operations?: CRUDOperation[];
  }): AdvancedMenuItem {
    const operations = config.operations || ['create', 'read', 'update', 'delete', 'list'];
    
    return {
      id: this.generateId(),
      name: config.name,
      path: config.path,
      icon: 'api',
      order: 0,
      visible: true,
      category: 'api',
      pageConfig: {
        category: 'api',
        api: {
          type: 'crud',
          crud: {
            dataSource: config.dataSource,
            objectSchema: config.objectSchema,
            operations,
            endpoints: {
              list: { method: 'GET', path: config.path, permissions: ['read'] },
              create: { method: 'POST', path: config.path, permissions: ['create'] },
              read: { method: 'GET', path: `${config.path}/[id]`, permissions: ['read'] },
              update: { method: 'PUT', path: `${config.path}/[id]`, permissions: ['update'] },
              delete: { method: 'DELETE', path: `${config.path}/[id]`, permissions: ['delete'] }
            }
          }
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}