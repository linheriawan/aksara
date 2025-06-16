<script lang="ts">
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { notificationManager } from '$lib/stores/notif';

  let { id = "", message = "", duration = 3000 } = $props();

  // Use a local state to control the visibility and trigger transitions
  let show = $state(true);

  // Auto-dismiss effect
  $effect(() => {
    if (duration > 0) {
      const timeout = setTimeout(() => {
        show = false; // Trigger out transition
      }, duration);

      return () => clearTimeout(timeout); // Cleanup on component destroy or duration change
    }
  });

  // When the "out" transition completes, remove from the global store
  function handleOutTransitionEnd() {
    notificationManager.dismiss(id);
  }
</script>

{#if show}
  <div
    class="flash-wrapper"
    style="z-index: 31;"
    in:fly={{ x: 300, duration: 500, easing: quintOut }}
    out:fly={{ x: 300, duration: 500, easing: quintOut }}
    on:transitionend={handleOutTransitionEnd}
    on:click={() => (show = false)} >
    <div class="flash-content">
      <span><b>{message}</b></span>
    </div>
  </div>
{/if}

<style>
  /* Use scoped CSS for your classes, similar to your original `_Interact.classes` */
  .flash-wrapper { /* */
    position: fixed;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.2); /* bg-black/20 */
    padding: 0 0 4px 4px; /* p-0 pl-1 py-1 (Adjusted to px) */
    bottom: 1%;
    right: 0;
    border-top-left-radius: 15px;
    box-sizing: border-box; /* Ensure padding doesn't affect width calculations */
  }

  .flash-content { /* */
    text-align: center;
    padding: 4px 4px 4px 8px; /* p-1 pl-2 pr-5 (Adjusted to px) */
    border: 1px solid #ccc; /* border */
    background: white; /* bg-white */
    border-top-left-radius: 10px;
    box-sizing: border-box;
  }
</style>