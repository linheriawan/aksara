<script lang="ts"> 
let {id,name,label,value= $bindable(''),keyup}:{
    id?:string;
    name:string;
    label?:string;
    value:string;
    keyup?:(e:Event)=>void;
}=$props();
</script>
<div class="fField">
<label for="" class="rounded-md px-2 m-1">{ label } </label>
<div class="grid grid-cols-6">
    <input type="hidden" name="{name}"  bind:value={value} />
    <input type="text" class="year border !w-12" placeholder="2025"/>
    <input type="text" class="month border !w-8" placeholder=""/>
    <input type="text" class="day border !w-8"  placeholder=""/>
    <input type="text" class="hour border !w-8" placeholder=""/>
    <input type="text" class="min border !w-8" placeholder=""/>
    <input type="text" class="sec border !w-8" placeholder=""/>
</div>
</div>