<script lang="ts">
  import { notificationsStore } from '$lib/stores/notif'; // Import the store
  import type { Notification } from '$lib/stores/notif'; // Import the type for TypeScript safety
  import FlashNotification from '$lib/components/notif_flash.svelte';
  import StackedNotification from '$lib/components/notif_stack.svelte';
  import SyncNotification from '$lib/components/notif_sync.svelte';
  let activeNotifications:Notification[] = $state([]);
  $effect(() => {
    const unsub = notificationsStore.subscribe(val => activeNotifications = val);
    return unsub;
  });

  import BasicLayout from '$lib/layouts/basicLayout.svelte';
  import FloatingLayout from '$lib/layouts/floatLayout.svelte';
  import EditorLayout from '$lib/layouts/editorLayout.svelte';

  let {data,children}=$props();
  let CurrentLayout = $state<typeof BasicLayout | null>(null);

  $effect(() => {
    if (data.layout === 'floating') {
      CurrentLayout = FloatingLayout;
    } else if (data.layout === 'editor') {
      CurrentLayout = EditorLayout;
    } else if (data.layout === 'classic') {
      CurrentLayout = BasicLayout;
    } else {
      CurrentLayout = null;
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


{#each activeNotifications as notif (notif.id)}
  {#if notif.type === 'flash'}
    <FlashNotification id={notif.id} message={notif.message} duration={notif.duration} />
  {:else if notif.type === 'stack'}
    <StackedNotification id={notif.id} message={notif.message} status={notif.status} duration={notif.duration} />
  {:else if notif.type === 'sync'}
    <SyncNotification id={notif.id} message={notif.message} status={notif.status} />
  {/if}
{/each}