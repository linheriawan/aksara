<script lang="ts"> 
let {id,name,label,value= $bindable(''),items,change,input}:{
    id?:string;
    name:string;
    label?:string;
    value:string;
    items:{value:string,label:string,isselected?:boolean}[];
    change?:(e:Event)=>void;
    input?:(e:Event)=>void;
}=$props();

function handleChange(e: Event) {
    change?.(e);
}

function handleInput(e: Event) {
    input?.(e);
}
</script>
<div class="fField">
<label for="{name}">{ label } </label>
<div>
    <select name={name} bind:value={value} onchange={handleChange} oninput={handleInput} class="border px-2 py-1 rounded">
        {#each items as i}
        <option value={i.value}>{i.label}</option>
        {/each}
    </select>
</div>
</div>