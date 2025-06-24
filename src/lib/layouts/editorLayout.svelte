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

<div class="editor-layout h-screen">
    <SctHead appinfo={info} headerLogoClick={()=>toggle('drawer','hidden')} appModal={()=>toggle('modules-menu','show')} /> 
    <SctDrawer items={modules}/>
    <main class="bg-sky-200 h-full w-full overflow-auto">
        {@render children()}
    </main>
    <SctFoot>
        <svelte:fragment slot='modal'>
        <SctModal id="modules-menu" act="top" clicks={()=>toggle('modules-menu','show')}>
            <SctMenus items={modules} />
        </SctModal>
        </svelte:fragment>
    </SctFoot>
</div>
