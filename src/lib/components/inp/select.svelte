<script lang="ts"> 
let {id,name,label,value= $bindable(''),items,change}:{
    id?:string;
    name:string;
    label?:string;
    value:string;
    items:{value:string,label:string,isselected?:boolean}[];
    change?:(e:Event)=>void;
}=$props();
</script>
<div class="fField">
<label for="{name}">{ label } </label>
<div>
    <select name={name} bind:value={value} onchange={change} class="border px-2 py-1 rounded">
        {#each items as i}
        <option value={i.value} selected="{i.isselected !== null ? "selected":""}" >{i.label}</option>
        {/each}
    </select>
</div>
</div>