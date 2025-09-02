import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'yaml';

const FORMS_DIR = join(process.cwd(), 'src/lib/workspace/forms');

export const GET: RequestHandler = async () => {
  try {
    // Ensure forms directory exists
    try {
      await stat(FORMS_DIR);
    } catch {
      // Directory doesn't exist, return empty list
      return json([]);
    }

    const files = await readdir(FORMS_DIR);
    const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    
    const forms = await Promise.all(
      yamlFiles.map(async (file) => {
        try {
          const filePath = join(FORMS_DIR, file);
          const content = await readFile(filePath, 'utf-8');
          const formData = yaml.parse(content);
          const stats = await stat(filePath);
          
          return {
            id: file.replace(/\.(yaml|yml)$/, ''),
            name: formData.name || file.replace(/\.(yaml|yml)$/, ''),
            description: formData.description || '',
            fields: formData.fields || formData.schema || [],
            createdAt: stats.birthtime?.toISOString() || stats.mtime?.toISOString(),
            updatedAt: stats.mtime?.toISOString(),
            filePath: file
          };
        } catch (error) {
          console.error(`Error loading form ${file}:`, error);
          return null;
        }
      })
    );

    // Filter out failed loads and sort by updated time
    const validForms = forms
      .filter(form => form !== null)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return json(validForms);
  } catch (error) {
    console.error('Error loading forms:', error);
    return json({ error: 'Failed to load forms' }, { status: 500 });
  }
};