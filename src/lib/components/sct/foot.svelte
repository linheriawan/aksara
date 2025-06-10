<script lang="ts">
</script>
<footer class="w-full items-center px-4 py-1 bg-slate-300">
    <div class="w-full flex justify-center">
        <span>composian &theta; 2025</span>
        {#if $$slots.default} &#8729; {/if}
        <slot></slot>
    </div>
</footer>
<slot name="modal"></slot>
