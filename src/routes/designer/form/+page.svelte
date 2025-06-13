<script lang="ts">
  import Text  from '$lib/components/inp/text.svelte';
  import Pass  from '$lib/components/inp/pass.svelte';
  import Btn  from '$lib/components/inp/btn.svelte';
  import Complex  from '$lib/components/inp/complex.svelte';
  import Auto  from '$lib/components/inp/autocomplete.svelte';
  import Datetime  from '$lib/components/inp/datetime.svelte';
  import Select  from '$lib/components/inp/select.svelte';
  import Dynagrid  from '$lib/components/sct/dynagrid.svelte';
  let myval=$state('');
  let obja=[
    {id:"anna",name:"Ana",desc:"tall"},
    {id:"rach",name:"Rachel",desc:"cute"},
    {id:"sara",name:"Sara",desc:"preety"},
    {id:"donna",name:"Donna",desc:"beauty"},
    {id:"bella",name:"Bella",desc:"preety"}
  ]
  function handleRowClick(x){
    console.log(x)
  }
</script>
<Dynagrid
  page={1}
  data={obja}
  totalrows={1000}
  title="User Table"
  rowclick={handleRowClick}
  show={20}
  filter={true}
  conf={true}/>
<div class="grid grid-rows-1 gap-2">
  <div class="border border-sky-300"> 
    <Btn label="real {myval}" />
  </div>
  <div class="border border-slate-600">
    <Text label="text" name="t-form" bind:value={myval} />
  </div>
  <div class="border border-sky-300">
    <Pass label="Password" name="p-form" bind:value={myval} />
  </div>
  <div class="border border-red-300">
    <Select label="Select" name="s-form" bind:value={myval} items={(obja.map(o=>({value:o.id,label:o.name})))} />
  </div>
  <div class="border border-green-300">
    <Datetime label="Date" name="d-form" value="2025-01-01 10:10:00"/>
  </div>
  <div class="border border-yellow-300">
    <Auto label="Autocomplete" name="a-form" bind:value={myval} items={(obja.map(o=>({value:o.id,label:o.name})))} />
  </div>
  <div class="border border-blue-300">
    <Complex label="complex" name="c-form" value="complex"/>
  </div>
  

</div>