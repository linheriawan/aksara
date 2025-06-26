// src/route/designer/data/dataAccess.ts

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { DataSource, ObjectDef, FS_DBconf, FS_APIconf, FS_DSconf } from './conf';

export class DataAccessManager {
  /**
   * Execute a query on a MySQL data source
   */
  async queryMySQL(dataSource: DataSource, query: string, params: any[] = []): Promise<any[]> {
    if (dataSource.type !== 'mysql') {
      throw new Error('Data source is not MySQL');
    }

    const config = dataSource.config as FS_DBconf;
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

  /**
   * Fetch data from REST API
   */
  async queryREST(dataSource: DataSource, endpoint: string, options: RequestInit = {}): Promise<any> {
    if (dataSource.type !== 'rest') {
      throw new Error('Data source is not REST API');
    }

    const config = dataSource.config as FS_APIconf;
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

  /**
   * Read data from file system
   */
  async queryFileSystem(dataSource: DataSource, filename: string): Promise<any> {
    if (dataSource.type !== 'filesystem') {
      throw new Error('Data source is not file system');
    }

    const config = dataSource.config as FS_DSconf;
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

  /**
   * Map raw data to object definition
   */
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

// Export singleton instance
export const dataAccessManager = new DataAccessManager();