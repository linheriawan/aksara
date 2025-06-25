<!-- src/routes/designer/data/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { invalidate } from '$app/navigation';

  let dataSources = ['mysql', 'rest', 'filesystem'];
  let selectedSource = 'mysql';
  let accessList: any[] = [];
  let selectedAccess = '';
  let accessConfig: any = {};
  let objectName = '';
  let objectFields: any = [];
  let message = '';

  onMount(async () => {
    const res = await fetch('/designer/data');
    accessList = await res.json();
  });

  async function loadStructure() {
    const res = await fetch('/designer/data', {
      method: 'POST',
      body: JSON.stringify({ "mode":"structure", selectedSource, accessConfig }),
      headers: { 'Content-Type': 'application/json' }
    });
    objectFields = await res.json();
  }

  async function saveObject() {
    const res = await fetch('/designer/data', {
      method: 'POST',
      body: JSON.stringify({ "mode":"save", objectName, fields: objectFields }),
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await res.json();
    message = result.message || 'Saved';
  }
</script>

<div class="wizard p-6 max-w-3xl mx-auto space-y-6 bg-white rounded shadow">
  <h2 class="text-2xl font-semibold">Data Access Wizard</h2>

  <div class="step">
    <label class="block font-medium">Choose Data Source:</label>
    <select class="mt-1 p-2 border rounded w-full" bind:value={selectedSource}>
      {#each dataSources as source}
        <option value={source}>{source}</option>
      {/each}
    </select>
  </div>

  <div class="step">
    {#if selectedSource === 'mysql'}
      <div class="grid gap-2">
        <label>MySQL Host:<input type="text" class="input" bind:value={accessConfig.host} /></label>
        <label>User:<input type="text" class="input" bind:value={accessConfig.user} /></label>
        <label>Password:<input type="password" class="input" bind:value={accessConfig.password} /></label>
      </div>
    {:else if selectedSource === 'rest'}
      <div>
        <label>API Base URL:<input type="text" class="input" bind:value={accessConfig.baseUrl} /></label>
      </div>
    {:else if selectedSource === 'filesystem'}
      <div>
        <label>JSON Directory:<input type="text" class="input" bind:value={accessConfig.path} /></label>
      </div>
    {/if}
    <button class="btn mt-3" on:click={loadStructure}>Load Structure</button>
  </div>

  {#if objectFields.length}
    <div class="step">
      <label class="block font-medium">Object Name:</label>
      <input type="text" class="input w-full" bind:value={objectName} />

      <ul class="mt-4 space-y-1">
        {#each objectFields as field}
          <li class="text-sm text-gray-700">{field.name} ({field.type})</li>
        {/each}
      </ul>

      <button class="btn mt-4" on:click={saveObject}>Save Object</button>
    </div>
  {/if}

  {#if message}
    <div class="alert mt-4">{message}</div>
  {/if}
</div>

<style>
  .input { padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem; }
  .btn { padding: 0.5rem 1rem; background: #2d6cdf; color: white; border-radius: 0.25rem; }
  .alert { background: #e6ffed; padding: 1rem; border: 1px solid #b4f5c0; border-radius: 0.25rem; }
</style>
