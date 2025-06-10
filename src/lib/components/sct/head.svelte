<script lang="ts">
import {LS} from "../../../scripts/script.js";
import { PnM } from "../../../scripts/pnm_elem.js";
import IcoHamb from '$lib/components/ico/hamb.svelte';
import IcoLogo from '$lib/components/ico/logo.svelte';
import InpDropdown from '$lib/components/inp/dropdown.svelte';

function logout(){
    LS.unset("approle");
    LS.unset("token");
    // router.push("/");
}
let { headerLogoClick,appModal, appinfo } = $props();
let acts={cssClass:"z-10", name:appinfo.user,
    items:[
        {txt:"app",action:appModal},
        {txt:"Preference",href:"/"},
        {txt:"Logout",action:logout}]
}
</script>

<header class="flex px-2 items-center bg-slate-200">
    <div class="flex flex-1 items-center">
        <button onclick="{headerLogoClick}" class="mr-3 w-8" >
            <IcoHamb style="w-6" />
        </button>
        <a href="/"><h1> {appinfo.name} </h1> </a>
    </div>
    <div class="flex">
        <button onclick="{()=>PnM(`.modules-menu`).toggle('show')}" class="hover:text-blue-600 cursor-pointer" title="show modules">
            <IcoLogo></IcoLogo>
        </button>
        <InpDropdown {...acts} /> 
    </div>
    
</header>
