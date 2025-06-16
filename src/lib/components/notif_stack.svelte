<script lang="ts">
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { notificationManager } from '$lib/stores/notif'; // Renamed import
  import type { Notification } from '$lib/stores/notif'; // Import Notification interface for type safety

  // Define the valid status types directly
  type StackStatus = Notification['status']; // More robust way to get literal types

  // New props declaration
  let {
    id = "",
    message = "",
    status: StackStatus = 'info', // Alias `status` to `StackStatus` to avoid naming conflict with the type alias
    duration = 3500
  } = $props();

  let show = $state(true);

  let iconClass = $derived(() => {
    switch (StackStatus) { // Use the aliased prop name here
      case 'load': return 'fa fa-spinner fa-spin text-green-500';
      case 'info': return 'fa fa-info-circle ico-pulsate text-blue-500';
      case 'error': return 'fa fa-exclamation-circle ico-boing text-red-500';
      case 'success': return 'fa fa-check-circle text-green-500';
      default: return 'fa fa-check-circle';
    }
  });

  $effect(() => {
    if (duration > 0) {
      const timeout = setTimeout(() => {
        show = false;
      }, duration);

      return () => clearTimeout(timeout);
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
    class="stack-wrapper"
    style="z-index: 31;"
    in:fly={{ x: 300, duration: 500, easing: quintOut }}
    out:fly={{ x: 300, duration: 500, easing: quintOut }}
    on:transitionend={handleOutTransitionEnd}
  >
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <i class={iconClass}></i>
        {message}
      </div>
    </div>
    <a class="stack-dismiss" on:click={() => (show = false)}>
      <i class="fa fa-times-circle"></i>
    </a>
  </div>
{/if}

<style>
  /* ... (your existing styles) ... */
  .stack-wrapper {
    position: fixed;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px;
    top: 2.75em;
    right: 0.4em;
    left: auto;
    border: 1px solid #CCC;
    border-radius: 4px;
    box-sizing: border-box;
    max-width: 300px;
  }

  .stack-dismiss {
    cursor: pointer;
    color: white;
  }
  .stack-dismiss:hover {
    color: #ef4444;
    font-size: 0.875em;
  }
</style>