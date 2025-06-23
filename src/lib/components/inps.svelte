<script lang="ts">
  import type { SvelteComponent } from "svelte";
  let {
    value = $bindable(), 
    input,
    keyup,
    ...props
  }: {
    value?: string;
    input?: (e: CustomEvent) => void;
    keyup?: (e: Event) => void;
    [key: string]: any;
  } = $props();
  
  value = value === undefined ? "" : value;
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
    } else {
      console.error(name);
      Component = null;
    }
  }
  
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
    // Create a custom event with the new value in detail
    const customEvent = new CustomEvent('input', { detail: value });
    input?.(customEvent);
  }
  
  function handleKeyup(e: Event) {
    keyup?.(e);
  }
  
  $effect(() => { 
    if (props.type) {
      Component = null;
      loader(props.type.toLowerCase());
    }
  });
</script>

{#if Component}
  <Component 
    {...props} 
    bind:value={value} 
    keyup={handleKeyup}
    input={handleInput} 
  />
{/if}