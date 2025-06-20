<script lang="ts">
  import type { SvelteComponent } from "svelte";
  let {value = $bindable(), ...props}=$props();
  value=value===undefined?"":value;
  let Component = $state<any | null>(null); 
  const sections = import.meta.glob('$lib/components/inp/*.svelte') as Record<
    string,
    () => Promise<{ default: typeof SvelteComponent }>
  >;
  async function loader(name: string) {
    const entry = Object.entries(sections).find(([path]) =>
      path.endsWith(`${name}.svelte`)
    );
    if (entry) {
      const module = await entry[1]();
      Component = module.default;
    } else{
      console.error(name)
      Component = null;
    }
  }
  $effect(() => { 
    if (props.type) {
        Component = null;
        loader(props.type);
    }
});
</script>
{#if Component}
  <Component {...props} bind:value={value} />
{/if}
