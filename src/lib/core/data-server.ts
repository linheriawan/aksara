// Server-side data utilities (Node.js dependencies allowed)
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface DataSource {
  type: 'mysql' | 'rest' | 'filesystem';
  config: DS_DBConf | DS_APIConf | DS_FSConf;
}

export interface DS_DBConf {
  server: string;
  port: string;
  username: string;
  password: string;
  database: string;
}

export interface DS_APIConf {
  baseUrl: string;
  authentication: 'none' | 'apikey' | 'basic';
  apiKey?: string;
  username?: string;
  password?: string;
}

export interface DS_FSConf {
  basePath: string;
  format: 'json' | 'yaml' | 'csv';
}

export interface ObjectDef {
  name: string;
  fields: ObjField[];
}

export interface ObjField {
  name: string;
  type: string;
  required: boolean;
  mapping: string;
}

export class DataAccessManager {
  async queryMySQL(dataSource: DataSource, query: string, params: any[] = []): Promise<any[]> {
    if (dataSource.type !== 'mysql') {
      throw new Error('Data source is not MySQL');
    }

    const config = dataSource.config as DS_DBConf;
    const connection = await mysql.createConnection({
      host: config.server,
      port: parseInt(config.port) || 3306,
      user: config.username,
      password: config.password,
      database: config.database
    });

    try {
      const [rows] = await connection.execute(query, params);
      return rows as any[];
    } finally {
      await connection.end();
    }
  }

  async queryREST(dataSource: DataSource, endpoint: string, options: RequestInit = {}): Promise<any> {
    if (dataSource.type !== 'rest') {
      throw new Error('Data source is not REST API');
    }

    const config = dataSource.config as DS_APIConf;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (config.authentication === 'apikey' && config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.authentication === 'basic' && config.username && config.password) {
      const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const url = `${config.baseUrl}/${endpoint}`.replace(/\/+/g, '/').replace(':/', '://');
    
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async queryFileSystem(dataSource: DataSource, filename: string): Promise<any> {
    if (dataSource.type !== 'filesystem') {
      throw new Error('Data source is not file system');
    }

    const config = dataSource.config as DS_FSConf;
    const filePath = join(config.basePath, filename);
    
    try {
      const content = readFileSync(filePath, 'utf8');
      
      if (config.format === 'json') {
        return JSON.parse(content);
      }
      
      throw new Error(`Unsupported file format: ${config.format}`);
    } catch (error) {
      throw new Error(`Error reading file ${filename}: ${JSON.stringify(error)}`);
    }
  }

  mapDataToObject(rawData: any, objectDef: ObjectDef): any {
    if (Array.isArray(rawData)) {
      return rawData.map(item => this.mapSingleItemToObject(item, objectDef));
    } else {
      return this.mapSingleItemToObject(rawData, objectDef);
    }
  }

  private mapSingleItemToObject(item: any, objectDef: ObjectDef): any {
    const mapped: any = {};

    for (const field of objectDef.fields) {
      const sourceValue = item[field.mapping];
      
      if (sourceValue !== undefined) {
        mapped[field.name] = this.convertValue(sourceValue, field.type);
      } else if (field.required) {
        throw new Error(`Required field '${field.name}' is missing from source data`);
      }
    }

    return mapped;
  }

  private convertValue(value: any, targetType: string): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (targetType) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'object':
        return typeof value === 'object' ? value : JSON.parse(String(value));
      default:
        return value;
    }
  }
}

export const dataAccessManager = new DataAccessManager();