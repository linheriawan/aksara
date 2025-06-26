<div class="flex justify-between items-center border-b mb-1 px-2">
    <div class="flex">
        <slot name="pos"/>
    </div>

    <div class="flex gap-2 items-center pr-2">
        <slot name="act"/>
    </div>
</div>
<div class="h-full w-full max-h-full max-w-full overflow-scroll">
    
    <slot/>
</div>  