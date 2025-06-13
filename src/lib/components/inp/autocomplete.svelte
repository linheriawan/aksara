<script lang="ts">
let { id, name, label, items, value = $bindable('') }:{
    id: string;
    name: string;
    label?: string;
    items: [{ value: string, label: string }];
    value: string;
} = $props();

let filteredItems = $state([...items]);
let selectedIndex = $state(-1);
let isOpen = $state(false);
let inputElement: HTMLInputElement;
let displayValue = $state(''); // What shows in the input (label)
let actualValue = $state(''); // The actual value for the hidden input

// Initialize display value
$effect(() => {
    if (value) {
        const matchedItem = items.find(item => item.value === value);
        if (matchedItem) {
            displayValue = matchedItem.label;
            actualValue = matchedItem.value;
        } else {
            displayValue = value;
            actualValue = '';
        }
    } else {
        displayValue = '';
        actualValue = '';
    }
});

// Check if current display value is valid
let isValid = $derived(() => {
    if (!displayValue) return true;
    return items.some(item => 
        item.label.toLowerCase() === displayValue.toLowerCase()
    );
});

function filterItems() {
    if (displayValue) {
        filteredItems = items.filter(item =>
            item.label.toLowerCase().includes(displayValue.toLowerCase())
        );
        isOpen = filteredItems.length > 0;
        selectedIndex = -1;
    } else {
        filteredItems = [...items];
        isOpen = false;
        selectedIndex = -1;
    }
    actualValue = ''; // Clear actual value when typing
}

function keydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen && filteredItems.length > 0) {
            isOpen = true;
            selectedIndex = 0;
        } else if (selectedIndex < filteredItems.length - 1) {
            selectedIndex++;
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedIndex > 0) {
            selectedIndex--;
        } else if (selectedIndex === 0) {
            selectedIndex = -1;
            inputElement.focus();
        }
    } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
            selectItem(filteredItems[selectedIndex]);
        }
    } else if (e.key === 'Escape') {
        isOpen = false;
        selectedIndex = -1;
    }
}

function selectItem(item: { value: string, label: string }) {
    displayValue = item.label;
    actualValue = item.value;
    value = item.value; // Update the bindable value
    isOpen = false;
    selectedIndex = -1;
    inputElement.focus();
}

function handleInput() {
    filterItems();
}

function handleFocus() {
    if (displayValue && filteredItems.length > 0) {
        isOpen = true;
    }
}

function handleBlur() {
    // Delay closing to allow clicking on items
    setTimeout(() => {
        isOpen = false;
        selectedIndex = -1;
    }, 150);
}
</script>

<div class="fField relative {!isValid() ? 'border rounded-md border-red-500' : ''}">
    <label for={id}>{label}</label>
    <input type="hidden" name={name} value={actualValue} />
    <input bind:this={inputElement}
        class="border rounded-md"
        type="text" 
        id={id} 
        bind:value={displayValue}
        onkeydown={keydown}
        oninput={handleInput}
        onfocus={handleFocus}
        onblur={handleBlur}
        autocomplete="off" />
    {#if isOpen && filteredItems.length > 0}
        <ul class="absolute top-7 dropdown-content menu w-full min-w-fit shadow bg-white text-primary-content z-10 max-h-48 overflow-y-auto border rounded-md">
            {#each filteredItems as item, index}
                <li 
                    data-val={item.value}
                    class="cursor-pointer hover:bg-gray-100 px-3 py-2 {selectedIndex === index ? 'bg-blue-100' : ''}"
                    onclick={() => selectItem(item)}
                    onmouseenter={() => selectedIndex = index}
                >
                    {item.label}
                </li>
            {/each}
        </ul>
    {/if}

</div>