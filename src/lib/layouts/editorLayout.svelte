<script lang="ts">
import '../../app.css';
import {PnM} from '../../scripts/pnm_elem.js';
import SctHead from '$lib/components/sct/head.svelte';
import SctFoot from '$lib/components/sct/foot.svelte';
import SctDrawer  from '$lib/components/sct/drawer.svelte';
import SctModal from '$lib/components/sct/modal.svelte';
import SctMenus from '$lib/components/sct/menus.svelte';

const toggle=(x:string,y:string)=>{ PnM(`.${x}`).toggle(y) }
let {modules,info,children}=$props();
</script>

<div class="grid-1n1 h-screen">
    <SctHead appinfo={info} headerLogoClick={()=>toggle('drawer','hidden')} appModal={()=>toggle('modules-menu','show')} /> 
    <main class="flex flex-col sm:flex-row justify-center items-stretch bg-sky-200 h-full">
        <SctDrawer items={modules}/>
        <div class="grid-1in1 w-full" style="overflow-x: hidden;">
            {@render children()}
        </div>
    </main>
    <SctFoot>
        <svelte:fragment slot='modal'>
        <SctModal id="modules-menu" act="top" clicks={()=>toggle('modules-menu','show')}>
            <SctMenus items={modules} />
        </SctModal>
        </svelte:fragment>
    </SctFoot>
</div>
