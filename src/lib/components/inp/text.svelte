<script lang="ts"> 
let {id,name,label,value= $bindable(''),keyup}:{
    id:string;
    name:string;
    label?:string;
    value:string;
    keyup?:(e:Event)=>void;
}=$props();

</script>
 <div class='fField'> 
    {#if label}
    <label for={id}>{label}</label>
    {/if}
    <input type="text" id={id} name={name} placeholder={name} onkeyup={keyup} bind:value={value}/> 
</div>