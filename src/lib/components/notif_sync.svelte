<script lang="ts">
  import { fade } from 'svelte/transition';
  import { notificationManager } from '$lib/stores/notif'; // Renamed import
  import type { Notification } from '$lib/stores/notif';

  type SyncStatus = Notification['status'];
  // New props declaration
  let {
    id = "",
    message = "",
    status: SyncStatus = 'load' // Alias `status` to `SyncStatus`
  } = $props();

  let show = $state(true);

  let iconClass = $derived(() => {
    switch (SyncStatus) { // Use the aliased prop name here
      case 'load': return 'fa fa-spinner fa-spin';
      case 'info': return 'fa fa-info-circle';
      case 'error': return 'fa fa-exclamation-circle';
      case 'success': return 'fa fa-check-circle';
      default: return 'fa fa-spinner fa-spin';
    }
  });

  function handleOutTransitionEnd() {
    if (!show) {
      notificationManager.dismiss(id);
    }
  }
</script>

{#if show}
  <div
    class="sync-wrapper"
    style="z-index: 31;"
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 300 }}
    on:transitionend={handleOutTransitionEnd}
  >
    <a class="sync-dismiss" on:click={() => (show = false)}>
      <i class="fa fa-2x fa-times-circle"></i>
    </a>
    <i class="{iconClass} fa-8x mb-4"></i>
    <div class="sync-content">
      {@html message}
    </div>
  </div>
{/if}

<style>
  /* ... (your existing styles) ... */
  .sync-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: white;
    background: rgba(0, 0, 0, 0.7);
    box-sizing: border-box;
  }

  .sync-dismiss {
    position: absolute;
    top: 8px;
    right: 8px;
    cursor: pointer;
    color: white;
  }
  .sync-dismiss:hover {
    color: #ef4444;
    font-size: 0.875em;
  }

  .sync-content {
    display: flex;
    margin-top: 12px;
    padding: 12px;
    width: 100%;
    max-height: 100%;
    overflow-y: auto;
    background-color: unset;
    box-sizing: border-box;
  }
</style>