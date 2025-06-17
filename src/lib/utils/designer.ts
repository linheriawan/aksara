// src/lib/utils.ts
export type FormComponentType = 'Input' | 'Select' | 'SctForm';

export interface FormComponent {
  id: string; // Unique ID for each instance on the canvas
  type: FormComponentType;
  props: Record<string, any>; // Dynamic properties like label, name, type, items
  children?: FormComponent[]; // For container components like SctForm
}

export interface FormDefinition {
  components: FormComponent[];
}
// Simple UUID-like ID generator (enough for client-side unique IDs)
export const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
export const generateId = () => `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;


// --- Native Drag and Drop Helpers ---

// Function to make an element draggable
export function makeDraggable(node: HTMLElement, data: any) {
    node.draggable = true;
    node.style.cursor = 'grab';

    function handleDragStart(event: DragEvent) {
        if (event.dataTransfer) {
            // Set drag data. 'text/plain' is a fallback.
            // Use a custom type like 'application/x-form-component' for specific data.
            event.dataTransfer.setData('application/x-form-component', JSON.stringify(data));
            event.dataTransfer.effectAllowed = 'copyMove';
        }
    }

    node.addEventListener('dragstart', handleDragStart);

    return {
        destroy() {
            node.removeEventListener('dragstart', handleDragStart);
        }
    };
}

// Function to make an element a drop target
export function makeDroppable(node: HTMLElement, onDrop: (data: any, target: HTMLElement) => void, allowedTypes: string[] = ['application/x-form-component']) {
    let originalBorder = node.style.border;
    let originalBg = node.style.backgroundColor;

    function handleDragOver(event: DragEvent) {
        event.preventDefault(); // Essential to allow dropping
        if (event.dataTransfer && allowedTypes.some(type => event.dataTransfer?.types.includes(type))) {
            event.dataTransfer.dropEffect = 'copy'; // Or 'move'
            node.style.border = '2px dashed #4CAF50'; // Visual feedback
            node.style.backgroundColor = '#e6ffe6';
        }
    }

    function handleDragLeave(event: DragEvent) {
        node.style.border = originalBorder; // Reset visual feedback
        node.style.backgroundColor = originalBg;
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault(); // Essential
        node.style.border = originalBorder; // Reset visual feedback
        node.style.backgroundColor = originalBg;

        if (event.dataTransfer) {
            const dropDataString = event.dataTransfer.getData('application/x-form-component');
            try {
                const dropData = JSON.parse(dropDataString);
                onDrop(dropData, node); // Call the provided callback with data and the drop target
            } catch (e) {
                console.error("Failed to parse dropped data:", e);
            }
        }
    }

    node.addEventListener('dragover', handleDragOver);
    node.addEventListener('dragleave', handleDragLeave);
    node.addEventListener('drop', handleDrop);

    return {
        destroy() {
            node.removeEventListener('dragover', handleDragOver);
            node.removeEventListener('dragleave', handleDragLeave);
            node.removeEventListener('drop', handleDrop);
        }
    };
}

// Function to enable reordering within a list (more complex)
// This is a simplified version and would need more robust handling for
// inserting at specific positions, visual feedback, etc.
export function makeSortableList(node: HTMLElement, items: any[], onReorder: (newItems: any[]) => void) {
    let draggingNode: HTMLElement | null = null;
    let initialIndex = -1;

    function handleDragStart(event: DragEvent) {
        draggingNode = event.currentTarget as HTMLElement;
        initialIndex = Array.from(node.children).indexOf(draggingNode);
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', initialIndex.toString()); // Just send index for internal reorder
            // For cross-list drag, you'd send item ID or full item data
        }
        setTimeout(() => {
            if (draggingNode) draggingNode.style.opacity = '0.5'; // Hide dragging item
        }, 0);
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        if (draggingNode && event.dataTransfer?.types.includes('text/plain')) {
            const targetNode = event.target as HTMLElement;
            // Find the draggable item that we are hovering over
            const currentHoverItem = targetNode.closest('[draggable="true"]');

            if (currentHoverItem && currentHoverItem !== draggingNode) {
                const rect = currentHoverItem.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;

                const isBefore = event.clientY < midY;

                if (isBefore && currentHoverItem.previousSibling !== draggingNode) {
                    node.insertBefore(draggingNode, currentHoverItem);
                } else if (!isBefore && currentHoverItem.nextSibling !== draggingNode) {
                    node.insertBefore(draggingNode, currentHoverItem.nextSibling);
                }
            }
        }
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        if (draggingNode) draggingNode.style.opacity = '1';

        if (draggingNode && node.contains(draggingNode)) {
            const newOrder = Array.from(node.children).map(child => {
                // Find the original item from the `items` array based on some ID or reference
                // This simplified example assumes a direct mapping or ID can be retrieved
                const originalId = (child as HTMLElement).dataset.id; // Assume data-id is set
                return items.find(item => item.id === originalId);
            }).filter(Boolean); // Filter out any undefined if ID not found

            onReorder(newOrder); // Inform parent about the new order
        }
        draggingNode = null;
    }

    function handleDragEnd(event: DragEvent) {
        if (draggingNode) draggingNode.style.opacity = '1';
        draggingNode = null;
    }

    // Add event listeners to children that are draggable
    function attachListenersToChildren() {
        Array.from(node.children).forEach(child => {
            const element = child as HTMLElement;
            if (element.draggable) {
                element.addEventListener('dragstart', handleDragStart);
                element.addEventListener('dragend', handleDragEnd);
            }
        });
    }

    // Initialize and react to items changes
    attachListenersToChildren(); // Attach initially

    return {
        update(newItems: any[]) {
            // Re-attach listeners if items array changes significantly
            // More robust would be observing DOM mutations, or clearing/re-adding
            // elements on every `items` update if using this simple method.
            // For now, this is a basic re-attachment strategy.
            Array.from(node.children).forEach(child => {
                const element = child as HTMLElement;
                element.removeEventListener('dragstart', handleDragStart);
                element.removeEventListener('dragend', handleDragEnd);
            });
            // Re-attach listeners after Svelte has updated the DOM with new items
            // This might need a `tick()` or a `setTimeout` if Svelte's DOM update
            // hasn't finished. For `{#each}` blocks, Svelte handles removal/addition.
            // The `handleDragOver` and `handleDrop` are on the parent container.
            // The `dragstart`/`dragend` are on the individual draggable children.
        },
        destroy() {
            Array.from(node.children).forEach(child => {
                const element = child as HTMLElement;
                element.removeEventListener('dragstart', handleDragStart);
                element.removeEventListener('dragend', handleDragEnd);
            });
            node.removeEventListener('dragover', handleDragOver);
            node.removeEventListener('drop', handleDrop);
        }
    };
}