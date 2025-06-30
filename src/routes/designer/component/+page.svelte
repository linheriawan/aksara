<script lang="ts">
  import Inp  from '$lib/components/inps.svelte';
  import Pass  from '$lib/components/inp/pass.svelte';
  import Btn  from '$lib/components/inp/btn.svelte';
  import Complex  from '$lib/components/inp/complex.svelte';
  import Auto  from '$lib/components/inp/autocomplete.svelte';
  import Datetime  from '$lib/components/inp/datetime.svelte';
  import Select  from '$lib/components/inp/select.svelte';
  import Dynagrid  from '$lib/components/sct/dynagrid.svelte';
  import { alerting } from '$lib/stores/notif';
  import InterfaceSelector from '$lib/components/inp/InterfaceSelector.svelte';
  let selectedInterface = $state('');
  let selectedInterfaceInfo = $state<any>(null);
  let customFilePaths = $state(['src/lib/utils/customUtils.ts']);
  function handleInterfaceChange(value: string, interfaceInfo?: any) {
    selectedInterface = value;
    selectedInterfaceInfo = interfaceInfo;
    console.log('Selected interface:', value, interfaceInfo);
  }
  function addCustomPath() {
    const newPath = prompt('Enter a file path to scan:');
    if (newPath) {
      customFilePaths = [...customFilePaths, newPath];
    }
  }

  function removeCustomPath(index: number) {
    customFilePaths = customFilePaths.filter((_, i) => i !== index);
  }

  import TabNav from '$lib/components/sct/tabnav.svelte';
  const tabs=[
    { id: 'maker', label: 'Maker' },
    { id: 'inpvar', label: 'Variant' },
    { id: 'dyna', label: 'Dyna' }];
  let currentTab = $state('inpvar');

  import obja from '$lib/generated/girls.json';
  // let obja=[
  //   {id:"anna",name:"Ana",desc:"tall"},
  //   {id:"rach",name:"Rachel",desc:"cute"},
  //   {id:"sara",name:"Sara",desc:"preety"},
  //   {id:"donna",name:"Donna",desc:"beauty"},
  //   {id:"bella",name:"Bella",desc:"preety"}
  // ]
  function handleRowClick(x:any){
    console.log(x)
  }
  let lval=obja.map(o=>({value:o.id,label:`${o.name}`}));
  let myval=$state('');
</script>
<TabNav {tabs} current={currentTab} onSelect={(id) => currentTab = id} />
{#if currentTab === 'dyna'}
<Dynagrid
  data={obja}
  title="client Girls"
  rowclick={handleRowClick}
  show={{page:10,filter:true,conf:true}} />
<br/>
<Dynagrid
  data={{apiurl:"http://localhost:5173/api/mock/cars"}}
  title="server Cars"
  rowclick={handleRowClick}
  show={{page:10,filter:true,conf:true}} />
{:else if currentTab === 'inpvar'}
<div class="grid grid-rows-1 gap-2 border-t p-1">
  <div class="border border-sky-300 flex"> 
    <Btn label="id= {myval}" clicks={()=>{ alerting.flash('This is a flash message!', 5000);}} />
    <Btn label="{myval} stack 1" clicks={()=>{alerting.stack('New information!', 'info'); }}/>
    <Btn label="{myval} stack 2" clicks={()=>{alerting.stack('New information available!', 'error', 7000); }}/>
    <Btn label="{myval} start" clicks={()=>{alerting.sync('Syncing data...', 'load'); }}/>
    <Btn label="{myval} progress"  clicks={()=>{alerting.sync('Data synced: 50% complete...', 'load'); }}/>
    <Btn label="{myval} end" clicks={()=>{ alerting.sync('success!!!','success'); }} />
  </div>
  <div class="border border-slate-600">
    <Inp type="text" label="text" name="t-form" bind:value={myval} />
  </div>
  <div class="border border-sky-300">
    <Pass id="" label="Password" name="p-form" bind:value={myval} />
  </div>
  <div class="border border-red-300">
    <Select label="Select" name="s-form" bind:value={myval} items={lval} />
  </div>
  <div class="border border-green-300">
    <Datetime label="Date" name="d-form" value="2025-01-01 10:10:00"/>
  </div>
  <div class="border border-yellow-300">
    <Auto label="Autocomplete" name="a-form" bind:value={myval} items={(obja.map(o=>({value:o.id,label:o.name})))} />
  </div>
  <div class="border border-blue-300">
    <Complex label="complex" name="c-form" bind:value={myval} items={(obja.map(o=>({value:o.id,label:o.name})))} />
  </div>
  
</div>
{:else}
<div class="max-w-4xl mx-auto px-4">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Interface Selector Demo</h1>
    
    <!-- Basic Interface Selector -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Interface Selector</h2>
      <InterfaceSelector 
        bind:value={selectedInterface}
        onchange={handleInterfaceChange}
        placeholder="Choose an interface..."
      />
      
      {#if selectedInterface}
        <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 class="font-medium text-blue-900">Selected Interface: {selectedInterface}</h3>
          {#if selectedInterfaceInfo}
            <div class="mt-2 text-sm text-blue-700">
              <p><strong>File:</strong> {selectedInterfaceInfo.file}</p>
              <p><strong>Fields:</strong> {selectedInterfaceInfo.fields.join(', ') || 'None'}</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
    
    <!-- Grouped Interface Selector -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Grouped by File</h2>
      <InterfaceSelector 
        groupByFile={true}
        showFileInfo={true}
        placeholder="Select from grouped interfaces..."
      />
    </div>
    
    <!-- Custom File Paths -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Custom File Paths</h2>
      
      <!-- File Path Management -->
      <div class="mb-4">
        <h3 class="text-sm font-medium text-gray-700 mb-2">Scanning Files:</h3>
        <div class="space-y-2">
          {#each customFilePaths as filePath, index}
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600 flex-1">{filePath}</span>
              <button 
                onclick={() => removeCustomPath(index)}
                class="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          {/each}
        </div>
        <button 
          onclick={addCustomPath}
          class="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add File Path
        </button>
      </div>
      
      <InterfaceSelector 
        filePaths={customFilePaths}
        showFileInfo={true}
        placeholder="Interfaces from custom paths..."
      />
    </div>
    
    <!-- Compact Version -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Compact Version</h2>
      <InterfaceSelector 
        showFileInfo={false}
        includeEmpty={false}
        class="max-w-md"
        placeholder="Quick select..."
      />
    </div>
    
    <!-- Multiple Selectors -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Multiple Selectors</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Primary Interface</label>
          <InterfaceSelector 
            placeholder="Select primary interface..."
            emptyText="No primary interface"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Secondary Interface</label>
          <InterfaceSelector 
            placeholder="Select secondary interface..."
            emptyText="No secondary interface"
            showFileInfo={false}
          />
        </div>
      </div>
    </div>
    
    <!-- Usage Instructions -->
    <div class="mt-8 bg-gray-100 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Usage Instructions</h2>
      <div class="prose text-sm text-gray-700">
        <p>The InterfaceSelector component automatically scans TypeScript files for exported interfaces. By default, it scans:</p>
        <ul class="list-disc list-inside mt-2 space-y-1">
          <li><code>src/lib/utils/customUtils.ts</code></li>
          <li><code>src/lib/types/*.ts</code></li>
          <li><code>src/lib/interfaces/*.ts</code></li>
          <li><code>src/types/*.ts</code></li>
        </ul>
        <p class="mt-4">You can customize which files to scan using the <code>filePaths</code> prop.</p>
      </div>
    </div>
  </div>
{/if}