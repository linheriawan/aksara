<script lang="ts">
  import Inp  from '$lib/components/inp.svelte';
  import Pass  from '$lib/components/inp/pass.svelte';
  import Btn  from '$lib/components/inp/btn.svelte';
  import Complex  from '$lib/components/inp/complex.svelte';
  import Auto  from '$lib/components/inp/autocomplete.svelte';
  import Datetime  from '$lib/components/inp/datetime.svelte';
  import Select  from '$lib/components/inp/select.svelte';
  import Dynagrid  from '$lib/components/sct/dynagrid.svelte';
  import obja from '$lib/generated/cars.json';
  // let obja=[
  //   {id:"anna",name:"Ana",desc:"tall"},
  //   {id:"rach",name:"Rachel",desc:"cute"},
  //   {id:"sara",name:"Sara",desc:"preety"},
  //   {id:"donna",name:"Donna",desc:"beauty"},
  //   {id:"bella",name:"Bella",desc:"preety"}
  // ]
  function handleRowClick(x){
    console.log(x)
  }
  let lval=obja.map(o=>({value:o.id,label:`${o.make} ${o.model}`}));
  let myval=$state('');
</script>
<Dynagrid
  page={1}
  data={obja}
  totalrows={1000}
  title="User Table"
  rowclick={handleRowClick}
  show={10}
  filter={true}
  conf={true}/>
<div class="grid grid-rows-1 gap-2">
  <div class="border border-sky-300"> 
    <Btn label="id= {myval}" />
  </div>
  <div class="border border-slate-600">
    <Inp type="text" label="text" name="t-form" bind:value={myval} />
  </div>
  <div class="border border-sky-300">
    <Inp type="pass" label="Password" name="p-form" bind:value={myval} />
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