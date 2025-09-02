<script lang="ts">
import {PnM} from '../../../scripts/pnm_elem.js';
const toggle=(x:string)=>{ PnM(`.${x}`).toggle('show') }
interface ModalProps {
    id: string; // Required prop
    act?: string; // Optional prop (top, bottom)
    clicks?: () => void; // Optional prop
    size?: string; // Optional prop (sm, md, lg, xl, full)
    children?: import('svelte').Snippet; 
    header?: import('svelte').Snippet; // Optional header content
    footer?: import('svelte').Snippet; // Optional footer content
  }
let { clicks, id = "", act="", size="md", children, header, footer}:ModalProps = $props();

// Size classes mapping - initial size only, no max-width constraints
const sizeClasses = {
  sm: 'w-96',
  md: 'w-2xl', 
  lg: 'w-4xl',
  xl: 'w-6xl',
  full: 'w-full'
};

const modalSizeClass = sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md;
</script>
<div class="modal {id}" onclick="{clicks}" role="none">
    <div role="none" class="modal-box relative {modalSizeClass} bg-white flex flex-col max-h-[90vh] min-h-[400px]" onclick="{(e) => e.stopPropagation()}" style="resize: both; overflow: hidden; max-width: 95vw; width: auto;">
        {#if act=='top'}
        <span role="none" onclick={()=>toggle(id)} class="btn btn-sm btn-slim btn-circle absolute right-2 top-2 z-20">✕</span>
        {/if}
        
        <!-- Fixed Header Area -->
        {#if header}
        <div class="flex-shrink-0 bg-white border-b px-6 py-4">
            {@render header()}
        </div>
        {/if}
        
        <!-- Main content area - scrollable -->
        <div class="flex-1 overflow-y-auto">
            {#if children}
            {@render children()}
            {/if}
        </div>
        
        <!-- Footer area -->
        {#if footer}
        <div class="flex-shrink-0 border-t bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            {@render footer()}
        </div>
        {:else if act!=='top'}
        <div class="flex-shrink-0 modal-action border-t flex justify-end pr-2">
            <span role="none" onclick={()=> toggle(id)} class="btn btn-sm btn-slim">Close</span>
        </div>
        {/if}
        
        <!-- Resize handle -->
        <div class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-30 hover:opacity-80 z-30" 
             style="background: repeating-linear-gradient(-45deg, #666 0px, #666 2px, transparent 2px, transparent 4px);">
        </div>
    </div>
</div>