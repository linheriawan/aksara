<script lang="ts">
  export let data;
  import SctForm  from '$lib/components/sct/form.svelte';
  import LayoutSwitcher from '$lib/components/LayoutSwitcher.svelte';
</script>

<SctForm>
<div slot="pos"><h1>hello</h1></div>
<LayoutSwitcher slot="act" layout={data.layout}/>

<h1>Welcome to SvelteKit</h1>
</SctForm>
