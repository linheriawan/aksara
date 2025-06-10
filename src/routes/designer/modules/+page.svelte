<script lang="ts">
  import Text from '$lib/components/inp/text.svelte';
  import SctForm from '$lib/components/sct/form.svelte';
  import initialRoutesData from '$lib/generated/routes.json';
  import type { MenuItem } from '$lib/types/routes';

  let routes: MenuItem[] = $state((JSON.parse(JSON.stringify(initialRoutesData))).routes);
  let selectedParentPath = $state('');
  let availablePaths = $state<string[]>([]);
  let editingIndex = $state<number | undefined>(undefined);
  let newItem = $state<MenuItem>({ name: '', path: '', icon: '' });

  $effect(() => {
    availablePaths = listPaths(routes);
  });

  // Helper function to find a node by path in a given data structure
  function getNodeByPath(data: MenuItem[], path: string): MenuItem | undefined {
    const parts = path.split('/');
    let currentNodes: MenuItem[] | undefined = data;
    let foundNode: MenuItem | undefined;

    for (const part of parts) {
      if (!currentNodes) return undefined; // No children to search in
      foundNode = currentNodes.find((r) => r.name === part);
      if (!foundNode) return undefined; // Part not found
      currentNodes = foundNode.children; // Move to children for next part
    }
    return foundNode;
  }

  // --- MODIFIED FUNCTIONS ---

  function manageRouteContent(data: MenuItem[], parentPath: string, index: number | undefined, item: MenuItem) {
    // Create a deep copy of the routes data to work on
    // This ensures Svelte detects all nested changes when `routes` is finally reassigned
    const newData = JSON.parse(JSON.stringify(data));

    if (parentPath) {
      // If adding/editing a child, find the parent node in the new data
      const parent = getNodeByPath(newData, parentPath);
      if (parent) {
        // Ensure parent.children array exists
        if (!parent.children) {
          parent.children = []; // Initialize if undefined
        }
        if (index === undefined) {
          parent.children.push(item); // Add new child
        } else {
          parent.children[index] = { ...item }; // Update existing child
        }
      } else {
        console.warn(`Parent path "${parentPath}" not found. Cannot add/update child.`);
        return; // Exit if parent not found
      }
    } else {
      // If adding/editing a root level item
      if (index === undefined) {
        newData.push(item); // Add new root item
      } else {
        newData[index] = { ...item }; // Update existing root item
      }
    }

    // Reassign the entire routes state with the modified deep copy
    routes = newData;
  }

  function deleteRoute(data: MenuItem[], path: string, index: number) {
    // Create a deep copy to modify
    const newData = JSON.parse(JSON.stringify(data));

    if (path) {
      // If deleting a child, find the parent
      const parent = getNodeByPath(newData, path);
      if (parent && parent.children && parent.children[index]) {
        parent.children.splice(index, 1); // Remove child
      } else {
        console.warn(`Could not find parent or child to delete at path "${path}", index ${index}.`);
        return;
      }
    } else {
      // If deleting a root level item
      if (newData[index]) {
        newData.splice(index, 1); // Remove root item
      }
    }

    // Reassign the entire routes state with the modified deep copy
    routes = newData;
  }

  // --- END MODIFIED FUNCTIONS ---

  function listPaths(routes: MenuItem[], base = ''): string[] {
    let paths: string[] = [];
    for (const r of routes) {
      const fullPath = base ? `${base}/${r.name}` : r.name;
      paths.push(fullPath);
      if (r.children) paths = paths.concat(listPaths(r.children, fullPath));
    }
    return paths;
  }

  function save() {
    manageRouteContent(routes, selectedParentPath, editingIndex, newItem);
    resetForm();
  }

  

  function remove(path: string, index: number) {
    deleteRoute(routes, path, index);
    if (editingIndex === index && selectedParentPath === path) {
      resetForm();
    }
  }

  function selectItemForEdit(path: string, index: number) {
    const parent = path ? getNodeByPath(routes, path) : undefined;
    const target = parent ? parent.children : routes;
    const item = target?.[index];
    if (item) {
      selectedParentPath = path;
      newItem = { ...item };
      editingIndex = index;
    }
  }

  function resetForm() {
    newItem = { name: '', path: '', icon: '' };
    editingIndex = undefined;
    selectedParentPath = '';
  }
</script>

<SctForm>
  <div slot="pos"><h1>Modules</h1></div>
  <div slot="act">
    <button class="save-button" on:click={save}>Save</button>
  </div>

  <div class="grid-n1 gap-2 pr-2">
    <div>
      {#if routes.length === 0}
        <p>No routes defined yet!</p>
      {:else}
        {#each routes as parentRoute, pIndex}
          <details class="group border p-1 mb-1">
            <summary class="grid md:grid-cols-4 my-1 cursor-pointer items-center list-none"
              on:click={() => selectItemForEdit('', pIndex)} >
              <div>name: {parentRoute.name}</div>
              <div>path: {parentRoute.path}</div>
              <div>icon: {parentRoute.icon}</div>
              <div class="flex justify-end">
                <span class="transform transition-transform duration-300 group-open:rotate-180">▼</span>
              </div>
            </summary>
            {#if parentRoute.children && parentRoute.children.length > 0}
              {#each parentRoute.children as childRoute, cIndex (childRoute.name)}
                <div role="none" class="border grid md:grid-cols-4 my-1 cursor-pointer"
                  on:click={() => selectItemForEdit(parentRoute.name, cIndex)} >
                  <div>name: {childRoute.name}</div>
                  <div>path: {childRoute.path}</div>
                  <div>icon: {childRoute.icon}</div>
                  <button class="text-red-500" on:click|stopPropagation={() => remove(parentRoute.name, cIndex)}>
                    Delete
                  </button>
                </div>
              {/each}
            {:else}
              <p>No children defined for this parent route.</p>
            {/if}
          </details>
        {/each}
      {/if}
    </div>

    <div>
      <h1>{editingIndex === undefined ? 'Add New Route' : 'Edit Route'}</h1>
      <div class="border p-2">
        <select bind:value={selectedParentPath} class="border px-2 py-1 rounded">
          <option value="">(root)</option>
          {#each availablePaths as path}
            <option value={path}>{path}</option>
          {/each}
        </select>

        <Text id="new_name" name="name" label="Name" bind:value={newItem.name} />
        <Text id="new_path" name="path" label="Path" bind:value={newItem.path} />
        <Text id="new_icon" name="icon" label="SVG Icon" bind:value={newItem.icon} />

        <div class="mt-2 flex gap-2">
          <button class="btn-slim btn-hf !bg-green-300 hover:!bg-blue-300 cursor-pointer"
            on:click={save} >
            {editingIndex === undefined ? 'Add' : 'Update'}
          </button>
          <button class="btn-slim btn-hf !bg-gray-300 hover:!bg-gray-400 cursor-pointer"
            on:click={resetForm} > Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</SctForm>