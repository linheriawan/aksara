<script lang="ts"> 
let {id,name,label,value= $bindable(''),keyup,input}:{
    id:string;
    name:string;
    label?:string;
    value:string;
    keyup?:(e:Event)=>void;
    input?:(e:Event)=>void;
}=$props();
</script>
 <div class='fField'> 
    {#if label}
    <label for={id}>{label}</label>
    {/if}
    <input type="text" id={id} name={name} placeholder={label} onkeyup={keyup} oninput={input} bind:value={value}/> 
</div>