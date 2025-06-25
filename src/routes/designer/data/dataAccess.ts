// src/lib/utils/dataAccess.ts
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { DataSource, ObjectDef } from './conf.ts';

export class DataAccessManager {
  /**
   * Execute a query on a MySQL data source
   */
  async queryMySQL(dataSource: DataSource, query: string, params: any[] = []): Promise<any[]> {
    if (dataSource.type !== 'mysql') {
      throw new Error('Data source is not MySQL');
    }

    const connection = await mysql.createConnection({
      host: dataSource.config.server,
      port: parseInt(dataSource.config.port) || 3306,
      user: dataSource.config.username,
      password: dataSource.config.password,
      database: dataSource.config.database
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (dataSource.config.authentication === 'apikey' && dataSource.config.apiKey) {
      headers['Authorization'] = `Bearer ${dataSource.config.apiKey}`;
    } else if (dataSource.config.authentication === 'basic' && dataSource.config.username && dataSource.config.password) {
      const auth = Buffer.from(`${dataSource.config.username}:${dataSource.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const url = `${dataSource.config.baseUrl}/${endpoint}`.replace(/\/+/g, '/').replace(':/', '://');
    
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
    const filePath = join(dataSource.config.basePath, filename);
    
    try {
      const content = readFileSync(filePath, 'utf8');
      
      if (dataSource.config.format === 'json') {
        return JSON.parse(content);
      }
      
      throw new Error(`Unsupported file format: ${dataSource.config.format}`);
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