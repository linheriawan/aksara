<script lang="ts">
  import DesignerLayout from '$lib/layouts/admin/designer.svelte'; 
  let {data,children}=$props();
</script>
{@render children()}
