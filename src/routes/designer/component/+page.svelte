<script lang="ts">
  import Inp  from '$lib/components/inp.svelte';
  import Pass  from '$lib/components/inp/pass.svelte';
  import Btn  from '$lib/components/inp/btn.svelte';
  import Complex  from '$lib/components/inp/complex.svelte';
  import Auto  from '$lib/components/inp/autocomplete.svelte';
  import Datetime  from '$lib/components/inp/datetime.svelte';
  import Select  from '$lib/components/inp/select.svelte';
  import Dynagrid  from '$lib/components/sct/dynagrid.svelte';
  import { alerting } from '$lib/stores/notif';

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
    <Auto label="Autocomplete" name="a-form" bind:value={myval} items={(obja.map(o=>({value:o.id,label:o.model})))} />
  </div>
  <div class="border border-blue-300">
    <Complex label="complex" name="c-form" bind:value={myval} items={(obja.map(o=>({value:o.id,label:o.model})))} />
  </div>
  

</div>
{/if}