<script lang="ts">
let  acts  = $props();
</script>

<div class="dropdown dropdown-hover dropdown-end">
    <label for="" class="btn btn-hf whitespace-nowrap rounded-md px-2 m-1">{ acts.name } <i class="fas fa-caret-down mx-1"></i></label>
    <ul class="{acts.cssClass} w-full min-w-fit dropdown-content menu shadow rounded-none bg-white text-primary-content">
    {#each acts.items as item}
    <li> <a class="rounded-none" onclick="{item.action}" href="{item.href}">{item.txt}</a> </li>
    {/each}
    </ul>
</div>
