// src/routes/designer/data/+server.ts
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
// import mysql from 'mysql2/promise';

const DATADEF_DIR = 'src/lib/datadef';

export const GET: RequestHandler = async ({ url }) => {
  const filePath = path.join(DATADEF_DIR, '_access.yaml');
  try {
    const file = await fs.readFile(filePath, 'utf8');
    const data = yaml.parse(file);
    return new Response(JSON.stringify(data));
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify([]));
  }
};

export const POST: RequestHandler = async ({ request, url }) => {
  const body = await request.json();
  
  const {mode, selectedSource, accessConfig, objectName, fields } = body;
  if(mode==="structure"){
    if ( selectedSource === 'mysql') {
        try {
        // const conn = await mysql.createConnection({
        //   host: accessConfig.host,
        //   user: accessConfig.user,
        //   password: accessConfig.password
        // });

        // const [rows] = await conn.query("SHOW DATABASES");
        // await conn.end();
        // return new Response(JSON.stringify(
        //   rows.map((row: any) => ({ name: Object.values(row)[0], type: 'database' }))
        // ));
        } catch (err) {
        return new Response(JSON.stringify({ error: 'MySQL connection failed' }), { status: 500 });
        }
    }

    if ( selectedSource === 'rest') {
        try {
        const res = await fetch(accessConfig.baseUrl);
        const json = await res.json();
        const fields = Object.keys(json[0] || {}).map(key => ({ name: key, type: typeof json[0][key] }));
        return new Response(JSON.stringify(fields));
        } catch (err) {
        return new Response(JSON.stringify({ error: 'API fetch failed' }), { status: 500 });
        }
    }

    if ( selectedSource === 'filesystem') {
        try {
        // const files = await fs.readdir(accessConfig.path);
        const file = await fs.readFile('src/lib/'+accessConfig.path, 'utf8');
        return new Response( JSON.stringify( file ) );
        } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Filesystem read failed' }), { status: 500 });
        }
    }
  }

  if (mode==="save") {
    const savePath = path.join(DATADEF_DIR, `${objectName}.yaml`);

    try {
      const yamlData = yaml.dump({ name: objectName, fields });
      await fs.writeFile(savePath, yamlData, 'utf8');
      return new Response(JSON.stringify({ message: 'Saved successfully' }));
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Save failed' }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Invalid endpoint' }), { status: 404 });
};
