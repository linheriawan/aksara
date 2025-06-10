<script lang="ts">
import {PnM} from '../../../scripts/pnm_elem.js';
const toggle=(x:string)=>{ PnM(`.${x}`).toggle('show') }
interface ModalProps {
    id: string; // Required prop
    act?: string; // Optional prop
    clicks?: () => void; // Optional prop
    children?: import('svelte').Snippet; 
  }
let { clicks, id = "", act="" ,children}:ModalProps = $props();
</script>
<div class="modal {id}" onclick="{clicks}" role="none">
    <div role="none" class="modal-box relative w-11/12 max-w-5xl bg-white" onclick="{(e) => e.stopPropagation()}">
        {#if act=='top'}
        <span role="none" onclick={()=>toggle(id)} class="btn btn-sm btn-slim btn-circle absolute right-2 top-2">✕</span>
        {/if}
        {#if children}
        {@render children()}
        {/if}
        {#if act!=='top'}
        <div class="modal-action border-t flex justify-end pr-2">
            <span role="none" onclick={()=> toggle(id)} class="btn btn-sm btn-slim">Close</span>
        </div>
        {/if}
    </div>
</div>