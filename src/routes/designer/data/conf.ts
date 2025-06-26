// src/routes/designer/data/conf.ts

export interface Field {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  mapping: string; // Source field name/path
}

export interface ObjectDef {
  name: string;
  source: string; // Table name, API endpoint, or file name
  fields: Field[];
  primaryKey: string;
  dataSource: string; // Reference to DataSource name
}

// MySQL Configuration
export interface FS_DBconf {
  server: string;
  port: string;
  username: string;
  password: string;
  database: string;
}

// REST API Configuration  
export interface FS_APIconf {
  baseUrl: string;
  authentication: 'none' | 'apikey' | 'basic';
  apiKey?: string;
  username?: string;
  password?: string;
}

// File System Configuration
export interface FS_DSconf {
  basePath: string;
  format: 'json' | 'csv' | 'xml';
}

export interface DataSource {
  type: 'mysql' | 'rest' | 'filesystem';
  name: string;
  config: FS_DBconf | FS_APIconf | FS_DSconf;
  schema?: string[]; // For MySQL: table names, for others: available sources
}

export interface StepInfo {
  id: number;
  name: string;
  shortName?: string;
  description: string;
}

export const STEPS: StepInfo[] = [
  {
    id: 1,
    name: 'Data Source',
    shortName: 'Source',
    description: 'Configure your data source connection (MySQL, REST API, or File System)'
  },
  {
    id: 2,
    name: 'Select Object',
    shortName: 'Object',
    description: 'Choose an existing object or create a new one to map your data'
  },
  {
    id: 3,
    name: 'Field Mapping',
    shortName: 'Mapping',
    description: 'Define how your data source fields map to object properties'
  },
  {
    id: 4,
    name: 'Review & Save',
    shortName: 'Review',
    description: 'Review your configuration and save the data access settings'
  }
];