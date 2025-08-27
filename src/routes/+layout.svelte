<script lang="ts">
  import Notify from '$lib/components/notif.svelte';
  import { wrt } from '$lib/stores/notif'; 
  import type { Notification } from '$lib/stores/notif'; 
  let anot:Notification[] = $state([]);
  $effect(() => {
    return wrt.subscribe(val => anot = val);
  });

  // Admin layouts
  import DesignerLayout from '$lib/layouts/admin/designerLayout.svelte';
  import EditorLayout from '$lib/layouts/admin/editorLayout.svelte';
  
  // End-user app layouts  
  import BasicLayout from '$lib/layouts/app/basicLayout.svelte';
  import FloatingLayout from '$lib/layouts/app/floatLayout.svelte';
  import ModernLayout from '$lib/layouts/app/modernLayout.svelte';

  let {data,children}=$props();
  let CurrentLayout = $state<typeof BasicLayout | null>(null);

  $effect(() => {
    if (data.isAdmin) {
      // Admin layouts
      if (data.layout === 'designer') {
        CurrentLayout = DesignerLayout;
      } else if (data.layout === 'editor') {
        CurrentLayout = EditorLayout;
      } else {
        CurrentLayout = DesignerLayout; // Default admin layout
      }
    } else {
      // End-user app layouts
      if (data.layout === 'floating') {
        CurrentLayout = FloatingLayout;
      } else if (data.layout === 'classic') {
        CurrentLayout = BasicLayout;
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