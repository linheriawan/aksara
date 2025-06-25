// src/routes/api/wizard/test-connection/+server.ts
import { json } from '@sveltejs/kit';
import mysql from 'mysql2/promise';

export async function POST({ request }) {
  try {
    const { type, config } = await request.json();
    
    switch (type) {
      case 'mysql':
        return await testMySQLConnection(config);
      case 'rest':
        return await testRestConnection(config);
      case 'filesystem':
        return json({ success: true, message: 'File system access configured' });
      default:
        return json({ success: false, message: 'Unknown connection type' });
    }
  } catch (error) {
    return json({ success: false, message: error });
  }
}

async function testMySQLConnection(config: any) {
  try {
    const connection = await mysql.createConnection({
      host: config.server,
      port: parseInt(config.port) || 3306,
      user: config.username,
      password: config.password,
      database: config.database
    });
    
    // Test connection
    await connection.ping();
    
    // Get table schema
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = (tables as any[]).map(row => Object.values(row)[0]);
    
    await connection.end();
    
    return json({
      success: true,
      message: 'MySQL connection successful',
      schema: tableNames
    });
  } catch (error) {
    return json({
      success: false,
      message: `MySQL connection failed: ${JSON.stringify(error)}`
    });
  }
}

async function testRestConnection(config: any) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (config.authentication === 'apikey' && config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.authentication === 'basic' && config.username && config.password) {
      const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }
    
    const response = await fetch(config.baseUrl, {
      method: 'GET',
      headers
    });
    
    if (response.ok) {
      return json({
        success: true,
        message: 'REST API connection successful'
      });
    } else {
      return json({
        success: false,
        message: `REST API connection failed: ${response.status} ${response.statusText}`
      });
    }
  } catch (error) {
    return json({
      success: false,
      message: `REST API connection failed: ${JSON.stringify(error)}`
    });
  }
}