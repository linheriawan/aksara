<script lang="ts">
  import type { SvelteComponent } from "svelte";
  interface iIcon{
    name:string;
    style?:string;
  }
  let {name,style}:iIcon=$props();

  let Component = $state<any | null>(null); 

  const iconModules = import.meta.glob('$lib/components/ico/*.svelte') as Record<
    string,
    () => Promise<{ default: typeof SvelteComponent }>
  >;

  async function loadIcon(name: string) {
    const entry = Object.entries(iconModules).find(([path]) =>
      path.endsWith(`/${name}.svelte`)
    );
    const def = Object.entries(iconModules).find(([path]) =>
      path.endsWith(`/logo.svelte`)
    );

    if (entry) {
      const module = await entry[1]();
      Component = module.default;
    } else if (def){
      // console.warn(`Icon "${name}" not found`);
      const module = await def[1]();
      Component = module.default;
    } else{
      // console.warn(`Icon "${name}" not found`);
      Component = null;
    }
  }

   $effect(() => { 
    if (name) {
      Component = null;
      loadIcon(name);
    }
  });
</script>

{#if Component}
  <Component style={style}/>
{/if}

