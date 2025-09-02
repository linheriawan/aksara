import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'yaml';

const FORMS_DIR = join(process.cwd(), 'src/lib/workspace/forms');

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const filePath = join(FORMS_DIR, `${id}.yaml`);
    
    const content = await readFile(filePath, 'utf-8');
    const formData = yaml.parse(content);
    
    return json(formData);
  } catch (error) {
    console.error(`Error loading form ${params.id}:`, error);
    return json({ error: 'Form not found' }, { status: 404 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    const filePath = join(FORMS_DIR, `${id}.yaml`);
    
    // Load existing form
    let existingForm;
    try {
      const content = await readFile(filePath, 'utf-8');
      existingForm = yaml.parse(content);
    } catch {
      return json({ error: 'Form not found' }, { status: 404 });
    }

    // Merge update data
    const updatedForm = {
      ...existingForm,
      ...updateData,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    const yamlContent = yaml.stringify(updatedForm, { indent: 2 });
    await writeFile(filePath, yamlContent, 'utf-8');

    return json({
      success: true,
      message: 'Form updated successfully',
      form: updatedForm
    });
  } catch (error) {
    console.error(`Error updating form ${params.id}:`, error);
    return json({ error: 'Failed to update form' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const filePath = join(FORMS_DIR, `${id}.yaml`);
    
    await unlink(filePath);
    
    return json({
      success: true,
      message: 'Form deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting form ${params.id}:`, error);
    return json({ error: 'Failed to delete form' }, { status: 500 });
  }
};