<div class="flex justify-between items-center border-b mb-1 px-2">
    <div class="flex">
        <slot name="pos"/>
    </div>

    <div class="flex gap-2 items-center pr-2">
        <slot name="act"/>
    </div>
</div>
<div class="grid grid-row-1 h-full overflow-scroll">
    <div class="min-h-screen !px-0">
        <slot/>
    </div>
</div>  