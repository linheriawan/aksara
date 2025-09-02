<script lang="ts">
  import Notify from '$lib/components/notif.svelte';
  import { wrt } from '$lib/stores/notif'; 
  import type { Notification } from '$lib/stores/notif'; 
  let anot:Notification[] = $state([]);
  $effect(() => {
    return wrt.subscribe(val => anot = val);
  });

  // Admin layouts
  import DesignerLayout from '$lib/layouts/admin/designer.svelte';
  
  // End-user app layouts  
  import ClassicLayout from '$lib/layouts/app/classic.svelte';
  import FloatingLayout from '$lib/layouts/app/floating.svelte';
  import ModernLayout from '$lib/layouts/app/modern.svelte';

  let {data,children}=$props();
  let CurrentLayout = $state<typeof ClassicLayout | null>(null);

  $effect(() => {
    if (data.isAdmin) {
      // Admin layouts
      CurrentLayout = DesignerLayout;
    } else {
      // End-user app layouts
      if (data.layout === 'floating') {
        CurrentLayout = FloatingLayout;
      } else if (data.layout === 'classic') {
        CurrentLayout = ClassicLayout;
      } else if (data.layout === 'modern') {
        CurrentLayout = ModernLayout;
      } else {
        CurrentLayout = ModernLayout; // Default app layout
      }
    }
  });
</script>
{#if CurrentLayout}
  <CurrentLayout {...data.app}>
    {@render children()}
  </CurrentLayout>
{:else}
  {@render children()}
{/if}

<Notify data={anot} />