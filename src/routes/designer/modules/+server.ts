import type { RequestHandler } from '@sveltejs/kit';
import fs from 'node:fs';
import path from 'node:path';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  const filePath = path.resolve('src/lib/generated/routing.json');

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to write file' }), { status: 500 });
  }
};