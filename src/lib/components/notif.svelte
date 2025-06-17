<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { alerting } from '$lib/stores/notif';
  import type { Notification } from '$lib/stores/notif';

  let { data }: { data: Notification[] } = $props();
  const datagroup = $derived(groupBy(data, 'type'));
  const flash = $derived(datagroup["flash"] || []);
  const stack = $derived(datagroup["stack"] || []);
  const sync = $derived(datagroup["sync"] || []);

  function groupBy<T extends Record<string, any>>(arr: T[], key: keyof T): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    arr.forEach((item:T) => {
      const groupValue = item[key]; 
      const keyAsString = String(groupValue); 
      if (!result[keyAsString]) result[keyAsString] = []; 
      result[keyAsString].push(item); 
    });
    return result;
  }
  let iconClass:Record<string, string> = {
      'default': 'fa fa-check-circle',
      'load': 'fa fa-spinner fa-spin text-green-500',
      'info': 'fa fa-info-circle ico-pulsate text-blue-500',
      'error': 'fa fa-exclamation-circle ico-boing text-red-500',
      'success': 'fa fa-check-circle text-green-500'
  };
  function dismis(id:string) {
    alerting.dismiss(id);
  }
  let syncWrap = $state(true);
  $effect(() => {
    if (flash.length==0 && stack.length==0 && sync.length > 0) syncWrap = true;
  });
</script>

{#if flash.length>0}
  <div class="fixed right-0 cursor-pointer bg-black/70 p-0 pl-1 py-1 bottom-[1%] rounded-tl-[15px] box-border" style="z-index: 31;"
    in:fly={{ x: 300, duration: 500, easing: quintOut }}
    out:fly={{ x: 300, duration: 500, easing: quintOut }}>
    <div role="none" class="p-1 pl-2 pr-5 text-center border bg-white rounded-tl-lg box-border"
      onclick={()=>{dismis(flash[flash.length-1].id)}}>
      <span><b>{flash[flash.length-1].message}</b></span>
    </div>
  </div>
{/if}
{#if stack.length>0}
  <div 
    class="fixed p-2 top-[2.75em] right-[0.4em] left-auto border border-gray-300 rounded box-border max-w-[300px] bg-black/70 text-white"
    style="z-index: 31;"
    in:fly={{ x: 300, duration: 500, easing: quintOut }}
    out:fly={{ x: 300, duration: 500, easing: quintOut }}>
    
    {#each stack as s (s.id)}
    <div class="flex justify-between gap-1 mb-2">
      <div class="flex items-center gap-2 mr-3">
        <i class={iconClass[s.status ?? 'default']}></i>
        {s.message}
      </div>
      <div role="none" class="cursor-pointer text-white hover:text-red-500 text-sm" 
        onclick={()=>{dismis(s.id)}}>
        <i class="fa fa-times-circle"></i>
      </div>
    </div>
    {/each}
    
  </div>
{/if}
{#if sync.length>0 && syncWrap}
  <div
    class="fixed inset-0 flex flex-col items-center justify-center text-center text-white bg-black/70 box-border p-8 rounded-lg"
    style="z-index: 31;"
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 300 }} >
    <div role="none" class="absolute top-2 right-2 cursor-pointer text-white hover:text-red-500 text-sm" 
      onclick={()=>{syncWrap=!syncWrap}}>
      <i class="fa fa-2x fa-times-circle"></i>
    </div>
    <i class="{iconClass[sync[sync.length-1].status ?? 'default']} fa-8x mb-4"></i>
    <div class="mt-3 p-3 w-full max-h-full overflow-y-auto bg-transparent box-border">
      {#each sync as s}
        {@html s.message}  
      {/each}
    </div>
  </div>
{/if}