<script lang="ts">
import '../../../app.css';
import {PnM} from '../../../scripts/pnm_elem.js';
import SctHead from '$lib/components/sct/head.svelte';
import SctFoot from '$lib/components/sct/foot.svelte';
import SctDrawer from '$lib/components/sct/drawer.svelte';
import SctModal from '$lib/components/sct/modal.svelte';
import SctMenus from '$lib/components/sct/menus.svelte';

const toggle=(x:string,y:string)=>{ PnM(`.${x}`).toggle(y) }
let {modules,info,children}=$props();

// Filter out designer modules from end-user view
const appModules = modules.filter((m: any) => 
  !m.path?.startsWith('designer') && m.name.toLowerCase() !== 'designer'
);
</script>

<div class="app-layout h-screen">
  <!-- User App Header -->
  <SctHead appinfo={info} 
           headerLogoClick={()=>toggle('drawer','hidden')} 
           appModal={()=>toggle('modules-menu','show')} />
  
  <!-- App Content -->
  <main class="flex flex-col sm:flex-row justify-center items-stretch bg-gradient-to-br from-sky-100 to-blue-100 h-full">
    <SctDrawer items={appModules}/>
    <div class="flex-1 w-full overflow-hidden">
      <div class="h-full p-4 overflow-auto">
        {@render children()}
      </div>
    </div>
    
    <SctFoot>
      <svelte:fragment slot='modal'>
        <SctModal id="modules-menu" act="top" clicks={()=>toggle('modules-menu','show')}>
          <SctMenus items={appModules} />
        </SctModal>
      </svelte:fragment>
    </SctFoot>
  </main>
</div>

<style>
.app-layout {
  /* End-user app styling */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-layout main {
  /* Modern glass-morphism effect */
  backdrop-filter: blur(10px);
}
</style>