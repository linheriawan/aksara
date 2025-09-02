<script lang="ts">
  import { goto } from '$app/navigation';
  import Btn from '$lib/components/inp/btn.svelte';
  import Text from '$lib/components/inp/text.svelte';
  import SctForm from '$lib/components/sct/form.svelte';
  import Dynagrid from '$lib/components/sct/dynagrid.svelte';

  // State
  let forms = $state([]);
  let loading = $state(true);
  let showCreateForm = $state(false);
  let newFormName = $state('');
  
  // Dynagrid configuration
  const gridConfig = {
    columns: [
      { 
        key: 'name', 
        label: 'Form Name', 
        sortable: true,
        render: (value: string, row: any) => `<strong>${value}</strong>`
      },
      { 
        key: 'description', 
        label: 'Description', 
        sortable: false,
        render: (value: string) => value || '<em class="text-gray-500">No description</em>'
      },
      { 
        key: 'fieldCount', 
        label: 'Fields', 
        sortable: true,
        render: (value: number) => `${value || 0} fields`
      },
      { 
        key: 'updatedAt', 
        label: 'Last Updated', 
        sortable: true,
        render: (value: string) => new Date(value).toLocaleDateString()
      },
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        render: (value: any, row: any) => ''  // Will be handled by onRender
      }
    ],
    pageSize: 10,
    searchable: true,
    searchFields: ['name', 'description'],
    sortBy: 'updatedAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  };

  // Load forms on mount
  $effect(() => {
    loadForms();
  });

  async function loadForms() {
    try {
      loading = true;
      const response = await fetch('/api/forms/list');
      if (response.ok) {
        const rawForms = await response.json();
        // Transform data for Dynagrid
        forms = rawForms.map((form: any) => ({
          ...form,
          fieldCount: form.fields?.length || form.schema?.length || 0,
          actions: form.id // Pass ID for actions
        }));
      } else {
        console.error('Failed to load forms');
        forms = [];
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      forms = [];
    } finally {
      loading = false;
    }
  }

  // Dynagrid handlers
  function handleRowClick(row: any) {
    console.log("open Edit")
    editForm(row.id);
  }

  function handleCellRender(column: string, value: any, row: any) {
    if (column === 'actions') {
      return `
        <div class="flex space-x-2">
          <button onclick="editForm('${row.id}')" class="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
          <button onclick="previewForm('${row.id}')" class="text-green-600 hover:text-green-700 text-sm font-medium">Preview</button>
          <button onclick="deleteForm('${row.id}', '${row.name}')" class="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
        </div>
      `;
    }
    return null; // Use default rendering
  }

  // Make functions global so they can be called from rendered HTML
  (globalThis as any).editForm = editForm;
  (globalThis as any).previewForm = (formId: string) => goto(`/designer/form/${formId}/preview`);
  (globalThis as any).deleteForm = deleteForm;

  async function createForm() {
    if (!newFormName.trim()) return;
    
    try {
      const response = await fetch('/api/forms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newFormName.trim(),
          description: `${newFormName.trim()} form`
        })
      });
      
      if (response.ok) {
        const newForm = await response.json();
        showCreateForm = false;
        newFormName = '';
        goto(`/designer/form/${newForm.id}`);
      } else {
        console.error('Failed to create form');
      }
    } catch (error) {
      console.error('Error creating form:', error);
    }
  }

  function editForm(formId: string) {
    goto(`/designer/form/${formId}`);
  }

  async function deleteForm(formId: string, formName: string) {
    if (!confirm(`Are you sure you want to delete the form "${formName}"?`)) return;
    
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadForms(); // Refresh the list
      } else {
        console.error('Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  }
</script>

<SctForm>
  <svelte:fragment slot="pos">
    <div class="flex items-center justify-between w-full">
      <h1 class="text-lg font-semibold">Form Designer</h1>
    </div>
  </svelte:fragment>

  <div class="h-full flex flex-col">
    {#if loading}
      <div class="flex items-center justify-center flex-1">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p class="text-gray-600">Loading forms...</p>
        </div>
      </div>
    {:else if forms.length === 0}
      <div class="flex items-center justify-center flex-1">
        <div class="text-center">
          <div class="text-4xl mb-4">📝</div>
          <h2 class="text-xl font-semibold mb-2">No Forms Yet</h2>
          <p class="text-gray-600 mb-4">Create your first form to get started with the form designer.</p>
          <Btn 
            style="!bg-blue-600 hover:!bg-blue-700 !text-white" 
            clicks={() => showCreateForm = true}
            label="Create Your First Form" />
        </div>
      </div>
    {:else}
      <div class="flex-1 overflow-hidden">
        <Dynagrid 
          data={forms}
          cstBtns={[{label:"Add",click:() => showCreateForm = true}]}
          rowclick={handleRowClick} />
      </div>
    {/if}
  </div>
</SctForm>

<!-- Create Form Modal -->
{#if showCreateForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 class="text-lg font-semibold mb-4">Create New Form</h2>
      
      <div class="space-y-4">
        <Text 
          id="formName"
          name="formName"
          label="Form Name"
          value={newFormName}
          placeholder="e.g., User Registration, Contact Form"
          input={(e) => newFormName = e.target.value} />
      </div>
      
      <div class="flex justify-end space-x-2 mt-6">
        <Btn 
          style="!bg-gray-200 hover:!bg-gray-300 !text-gray-700" 
          clicks={() => { showCreateForm = false; newFormName = ''; }}
          label="Cancel" />
        <Btn 
          style="!bg-blue-600 hover:!bg-blue-700 !text-white" 
          clicks={createForm}
          disabled={!newFormName.trim()}
          label="Create Form" />
      </div>
    </div>
  </div>
{/if}