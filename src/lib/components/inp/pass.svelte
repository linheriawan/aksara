<script lang="ts"> 
let { id,name,label,value= $bindable('') }=$props();
</script>

<div class="fField">
    <label for="">{ label }</label>
    <input type="password" id={id} name={name} placeholder={label} bind:value={value}>
</div>
