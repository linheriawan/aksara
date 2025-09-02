import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'yaml';

const FORMS_DIR = join(process.cwd(), 'src/lib/workspace/forms');

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { name, description } = await request.json();
    
    if (!name || typeof name !== 'string') {
      return json({ error: 'Name is required' }, { status: 400 });
    }

    // Ensure forms directory exists
    await mkdir(FORMS_DIR, { recursive: true });

    // Create form ID from name (sanitized)
    const formId = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Create default form structure
    const formData = {
      id: formId,
      name: name.trim(),
      description: description?.trim() || '',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schema: [] // Empty schema to start with
    };

    const yamlContent = yaml.stringify(formData, { indent: 2 });
    const filePath = join(FORMS_DIR, `${formId}.yaml`);
    
    await writeFile(filePath, yamlContent, 'utf-8');

    return json({
      success: true,
      id: formId,
      name: formData.name,
      description: formData.description,
      message: 'Form created successfully'
    });
  } catch (error) {
    console.error('Error creating form:', error);
    return json({ error: 'Failed to create form' }, { status: 500 });
  }
};