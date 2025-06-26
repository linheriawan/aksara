// src/routes/designer/data/table-fields/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import mysql from 'mysql2/promise';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { config, table } = await request.json();
    
    const connection = await mysql.createConnection({
      host: config.server,
      port: parseInt(config.port) || 3306,
      user: config.username,
      password: config.password,
      database: config.database
    });

    try {
      const [rows] = await connection.execute(`DESCRIBE ${table}`);
      const fields = (rows as any[]).map(row => ({
        name: row.Field,
        type: mapMySQLType(row.Type),
        required: row.Null === 'NO',
        mapping: row.Field
      }));

      return json({ success: true, fields });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching table fields:', error);
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to fetch table fields'
    }, { status: 500 });
  }
};

function mapMySQLType(mysqlType: string): string {
  const type = mysqlType.toLowerCase();
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
    return 'number';
  } else if (type.includes('bool') || type.includes('bit')) {
    return 'boolean';
  } else if (type.includes('date') || type.includes('time')) {
    return 'date';
  } else if (type.includes('json')) {
    return 'object';
  } else {
    return 'string';
  }
}