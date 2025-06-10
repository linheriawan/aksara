<script lang="ts">
import '../../app.css';
import {PnM} from '../../scripts/pnm_elem.js';
import SctHead from '$lib/components/sct/head.svelte';
import SctFoot from '$lib/components/sct/foot.svelte';
import SctDrawer  from '$lib/components/sct/drawer.svelte';
import SctModal from '$lib/components/sct/modal.svelte';
import SctMenus from '$lib/components/sct/menus.svelte';
import ModalEula from '$lib/components/modal/eula.svelte';
import ModalPrivpol from '$lib/components/modal/privpol.svelte';

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
        <a href="/" onclick={() => toggle('my-eula','show')} class="cursor-pointer"> Terms </a> &#8729; 
        <a href="/" onclick={() => toggle('my-prp','show')} class="cursor-pointer"> Policy </a>
        
        <svelte:fragment slot='modal'>
        <SctModal id="my-eula" >
            <ModalEula/>
        </SctModal>
        <SctModal id="my-prp" act="top">
            <ModalPrivpol/>
        </SctModal>
        <SctModal id="modules-menu" act="top" clicks={()=>toggle('modules-menu','show')}>
            <SctMenus items={modules} />
        </SctModal>
        </svelte:fragment>
    </SctFoot>
</div>