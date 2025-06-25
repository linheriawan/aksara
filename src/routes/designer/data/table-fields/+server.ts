// src/routes/api/wizard/table-fields/+server.ts
import { json } from '@sveltejs/kit';
import mysql from 'mysql2/promise';

export async function POST({ request }) {
  try {
    const { config, table } = await request.json();
    
    const connection = await mysql.createConnection({
      host: config.server,
      port: parseInt(config.port) || 3306,
      user: config.username,
      password: config.password,
      database: config.database
    });
    
    const [columns] = await connection.execute(
      'SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [config.database, table]
    );
    
    const fields = (columns as any[]).map(col => ({
      name: col.COLUMN_NAME,
      type: mapMySQLType(col.DATA_TYPE),
      required: col.IS_NULLABLE === 'NO'
    }));
    
    await connection.end();
    
    return json({ success: true, fields });
  } catch (error) {
    return json({ success: false, message: error });
  }
}

function mapMySQLType(mysqlType: string): string {
  const typeMap: Record<string, string> = {
    'varchar': 'string',
    'char': 'string',
    'text': 'string',
    'longtext': 'string',
    'int': 'number',
    'bigint': 'number',
    'decimal': 'number',
    'float': 'number',
    'double': 'number',
    'boolean': 'boolean',
    'tinyint': 'boolean',
    'date': 'date',
    'datetime': 'date',
    'timestamp': 'date',
    'json': 'object'
  };
  
  return typeMap[mysqlType.toLowerCase()] || 'string';
}