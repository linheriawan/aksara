// src/routes/designer/data/conf.ts

export interface ObjField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  mapping: string; // Source field name/path
}

export interface ObjectDef {
  name: string;
  source: string; // Table name, API endpoint, or file name
  fields: ObjField[];
  primaryKey: string;
  dataSource: string; // Reference to DataSource name
}

// MySQL Configuration
export interface DS_DBConf {
  server: string;
  port: string;
  username: string;
  password: string;
  database: string;
}

// REST API Configuration  
export interface DS_APIConf {
  baseUrl: string;
  authentication: 'none' | 'apikey' | 'basic';
  apiKey?: string;
  username?: string;
  password?: string;
}

// File System Configuration
export interface DS_FSConf {
  basePath: string;
  format: 'json' | 'csv' | 'xml';
}

export interface DataSource {
  type: 'mysql' | 'rest' | 'filesystem';
  name: string;
  config: DS_DBConf | DS_APIConf | DS_FSConf;
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
    description: 'Configure your data source connection - the location where your data is stored (MySQL database, REST API, or File System)'
  },
  {
    id: 2,
    name: 'Select Object',
    shortName: 'Object',
    description: 'Choose an existing object schema or create a new one. Objects define the structure of data entities within your data source'
  },
  {
    id: 3,
    name: 'Field Mapping',
    shortName: 'Mapping',
    description: 'Define how data source fields map to object properties and specify field types and requirements'
  },
  {
    id: 4,
    name: 'Review & Save',
    shortName: 'Review',
    description: 'Review your object schema configuration and save it as a YAML definition file'
  }
];