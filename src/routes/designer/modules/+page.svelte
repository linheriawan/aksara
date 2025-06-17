<script lang="ts">
  import IconRenderer from '$lib/components/icons.svelte';
  import Text from '$lib/components/inp/text.svelte';
  import Btn from '$lib/components/inp/btn.svelte';
  import SctForm from '$lib/components/sct/form.svelte';
  import TabNav from '$lib/components/sct/tabnav.svelte';
  import RightPanel from '$lib/components/sct/rightPanel.svelte';

  const tabs=[{ id: 'modules', label: 'Modules' },
      { id: 'settings', label: 'Settings' },
      { id: 'profile', label: 'Profile' }];
  let currentTab = $state('modules');

  import type { MenuItem } from '$lib/types/routes';
  import initialRoutesData from '$lib/generated/routes.json';
  import { listPaths, getNodeByPath} from '$lib/utils/route.ts'; 

  let routes: MenuItem[] = $state((JSON.parse(JSON.stringify(initialRoutesData))).routes);
  
  let selectedParentPath = $state('');
  let availablePaths = $state<string[]>([]);
  let editingIndex = $state<number | undefined>(undefined);
  let newItem = $state<MenuItem>({ name: '', path: '', icon: '' });

  $effect(() => {
    availablePaths = listPaths(routes);
  });
  

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

  function remove(path: string, index: number) {
    const newData = JSON.parse(JSON.stringify(routes));
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
      if (newData[index]) { newData.splice(index, 1);  }
    }
    routes = newData;
    if (editingIndex === index && selectedParentPath === path) {
      resetForm();
    }
  }
  function save() {
    // Create a deep copy of the routes data to work on
    // This ensures Svelte detects all nested changes when `routes` is finally reassigned
    const newData = JSON.parse(JSON.stringify(routes));

    if (selectedParentPath) {
      // If adding/editing a child, find the parent node in the new data
      const parent = getNodeByPath(newData, selectedParentPath);
      if (parent) {
        // Ensure parent.children array exists
        if (!parent.children) { parent.children = []; // Initialize if undefined
        }
        if (editingIndex === undefined) { parent.children.push(newItem); // Add new child
        } else {
          parent.children[editingIndex] = { ...newItem }; // Update existing child
        }
      } else {
        console.warn(`Parent path "${selectedParentPath}" not found. Cannot add/update child.`);
        return; // Exit if parent not found
      }
    } else {
      if (editingIndex === undefined) {
        newData.push(newItem); // Add new root item
      } else {
        newData[editingIndex] = { ...newItem }; // Update existing root item
      }
    }
    routes = newData;
    resetForm();
  }
  async function persist() {
    const res = await fetch('/designer/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({"routes":routes})
    });
    const result = await res.json();
    console.log(result);
  }
</script>

<SctForm>
  <svelte:fragment slot="pos">
    <TabNav {tabs} current={currentTab} onSelect={(id) => currentTab = id} />
  </svelte:fragment>
  <div slot="act">
    <button class="btn-small border rounded-md px-2 hover:bg-blue-300" on:click={persist}>Save</button>
  </div>

  <div class="h-full grid-1aa gap-2 overflow-x-hidden">
    <div>
    {#if currentTab === 'modules'}
      {#if routes.length === 0}
        <p>No routes defined yet!</p>
      {:else}
        {#each routes as parentRoute, pIndex}
          <details class="group border p-1 mb-1">
            <summary class="grid md:grid-cols-4 my-1 cursor-pointer items-center list-none"
              on:click={() => selectItemForEdit('', pIndex)} >
              <div>name: {parentRoute.name}</div>
              <div>path: {parentRoute.path}</div>
              <div>icon: <IconRenderer name={parentRoute.icon}/></div>
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
                  <div>icon: <IconRenderer name={childRoute.icon}/></div>
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
    {:else if currentTab === 'settings'}
      <div>Settings Content</div>
    {:else if currentTab === 'profile'}
      <h2 class="text-xl font-semibold mb-2">Profile</h2>
      <p>This is your profile tab.</p>
    {/if}
    </div>
    
    <RightPanel>
      <div class="border m-1">
        <div class="bg-blue-300">
          <h1>{editingIndex === undefined ? 'Add New Route' : 'Edit Route'}</h1>
        </div>
        <div class="p-2">
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
          <Btn style="!bg-green-300 hover:!bg-blue-300" clicks={save} label={editingIndex === undefined ? 'Add' : 'Update'}/>
          <Btn style="!bg-gray-300 hover:!bg-gray-400" clicks={resetForm} label="Reset" />
        </div>
        </div>
      </div>
    </RightPanel>
  </div>
  
</SctForm>