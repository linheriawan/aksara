<script lang="ts"> 
let {style,label= $bindable(''),clicks}:{
    style?:string;
    label?:string;
    clicks?:(e:Event)=>void;
}=$props();
</script>
<button class="btn-slim btn-hf cursor-pointer {style}" on:click={clicks} >
    {label}
</button>