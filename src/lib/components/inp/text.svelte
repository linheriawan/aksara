<script lang="ts"> 
let {id,name,label,placeholder,value= $bindable(''),keyup,input}:{
    id:string;
    name:string;
    label?:string;
    placeholder?:string;
    value:string;
    keyup?:(e:Event)=>void;
    input?:(e:Event)=>void;
}=$props();
</script>
 <div class='fField'> 
    {#if label}
    <label for={id}>{label}</label>
    {/if}
    <input type="text" id={id} name={name} placeholder={placeholder!==undefined ? placeholder:label} onkeyup={keyup} oninput={input} bind:value={value}/> 
</div>