import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
  const { id } = params;
  
  try {
    const response = await fetch(`/api/forms/${id}`);
    
    if (response.ok) {
      const formData = await response.json();
      return {
        formId: id,
        formData
      };
    } else {
      // Form not found
      return {
        formId: id,
        formData: null,
        error: 'Form not found'
      };
    }
  } catch (error) {
    console.error('Error loading form:', error);
    return {
      formId: id,
      formData: null,
      error: 'Failed to load form'
    };
  }
};