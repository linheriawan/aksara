<script>
let {label, value}=$props();
</script>
<div class="grid complex_inp px-1 py-2 items-center">
    <span class="mr-1">{label}</span>
    <p class="w-full h-7 px-2">{value}</p>
    <input class="w-full h-7 px-2 input-bordered" type="text" placeholder={label}  bind:value={value}>
    <button class="btn btn-clean border rounded-sm ml-1">Find</button>
</div>

<style>
.complex_inp{ grid-template-columns: 1fr 5fr 1fr; }
.complex_inp >span{grid-column:1}
.complex_inp >p, .complex_inp >input{grid-row:1;grid-column:2}
.complex_inp >button{grid-column:3}
</style>