<script lang="ts"> 
let { id,name,label,value }=$props();
</script>

<div class="fField">
    <label for="">{ label }</label>
    <input type="password" id={id} name={name} placeholder={label} value={value}>
</div>
