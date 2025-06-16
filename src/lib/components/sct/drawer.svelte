<script lang="ts">
import IconRenderer from '$lib/components/icons.svelte';
import Text from '$lib/components/inp/text.svelte';
let {items}=$props();
import { page } from '$app/state';
let apppath = page.url.pathname.split('/')[1];
const menus = items.filter( (menu:any) => { 
    if(apppath==""){ return menu; }
    else{ return menu.path.toLowerCase() === apppath.toLowerCase();}
});
let find = $state('');
let smenu = $state(menus);

let appmenus = $derived(
    smenu.filter((group:any) => {
      const lowerCaseQuery = find.toLowerCase();
      const parentMatches = group.name.toLowerCase().includes(lowerCaseQuery);
      const hasChildren = Array.isArray(group.children) && group.children.length > 0;
      let childrenMatch = false;
      if (hasChildren) {
        const filteredChildren = group.children.filter((child:any) =>
          child.name.toLowerCase().includes(lowerCaseQuery)
        );
        childrenMatch = filteredChildren.length > 0;
      }
      return parentMatches || (hasChildren && childrenMatch);
    })
    .map((group:any) => {
        const lowerCaseQuery = find.toLowerCase();
        const hasChildren = Array.isArray(group.children) && group.children.length > 0;
        let finalDisplay = [];
        if (hasChildren) {
            if (group.name.toLowerCase().includes(lowerCaseQuery)) {
                finalDisplay = group.children;
            } else {
                finalDisplay = group.children.filter((child:any) =>
                    child.name.toLowerCase().includes(lowerCaseQuery)
                );
            }
        }
        return { ...group, menus: finalDisplay  };
    })
);
function handleInput(e:Event) { 
    const target = e.target as HTMLInputElement;
    find = target.value; 
}
</script>
<div class="drawer grid grid-row-1 py-2 sm:border-r">

<div class="h-fit px-2">
<Text id="search_menu" name="find" label="find" keyup={handleInput} bind:value={find} />
{#each appmenus as appmenu}
    <a href={appmenu.path} class="flex pl-1 pr-4 items-center" class:dynamic={appmenu.isDynamic}>
        <IconRenderer name={appmenu.icon} style="h-5 w-5" />
        <div class="flex-1 whitespace-nowrap mx-2 pr-2">{appmenu.name}</div> 
    </a>
    {#if appmenu.menus}
      <ul class="m-0 pl-2">
        {#each appmenu.menus as child}
            <li>
                <a href="../{child.path}" class="flex pl-5 pr-2 items-center">
                    <IconRenderer name={child.icon} style="h-5 w-5" />
                    <div class="flex-1 whitespace-nowrap mx-2 pr-2">{child.name}</div> 
                </a>
            </li>
        {/each}
      </ul>
    {/if}
{/each}
</div>
</div>
