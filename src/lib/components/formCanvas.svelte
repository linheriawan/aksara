<script lang="ts">
  import { generateId, makeDroppable } from '$lib/utils'; // Only makeDroppable for external drops
  // No makeSortableList directly used here, instead handle reordering manually
  import type { FormComponent, FormDefinition } from './types';
  import Select from '../components/Select.svelte';
  import Inp from '../components/Inp.svelte';
  import SctForm from '../components/SctForm.svelte';

  // Make formDefinition exportable and reactive so parent can bind to it (for code generation)
  let formDefinition: FormDefinition = $state({ components: [] });
  export { formDefinition }; // Exported for binding in parent

  let selectedComponentId: string | null = $state(null);

  // Callback for when a component is dropped onto the canvas
  function handleDropOnCanvas(droppedData: any) {
      const newComponent: FormComponent = {
          id: generateId(), // Use your custom ID generator
          ...droppedData // { type, props, children (if SctForm) }
      };
      formDefinition.components = [...formDefinition.components, newComponent];
      selectedComponentId = newComponent.id; // Select the newly added component
  }

  // Handle reordering within the canvas using native drag and drop
  let draggingComponentId: string | null = null;
  let dragOverTargetId: string | null = null;

  function handleDragStart(event: DragEvent, componentId: string) {
      draggingComponentId = componentId;
      if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', componentId); // Data is just the ID for internal reorder
      }
      setTimeout(() => { // Hide the original element while dragging
          if (event.target instanceof HTMLElement) event.target.style.opacity = '0.5';
      }, 0);
  }

  function handleDragOver(event: DragEvent, targetComponentId: string) {
      event.preventDefault(); // Allow drop
      if (draggingComponentId && draggingComponentId !== targetComponentId) {
          dragOverTargetId = targetComponentId; // Set current hover target for visual feedback
      }
  }

  function handleDragLeave(event: DragEvent, targetComponentId: string) {
      if (dragOverTargetId === targetComponentId) {
          dragOverTargetId = null;
      }
  }

  function handleDrop(event: DragEvent, dropTargetComponentId: string) {
      event.preventDefault(); // Allow drop
      if (event.target instanceof HTMLElement) event.target.style.opacity = '1'; // Reset opacity

      dragOverTargetId = null;

      if (draggingComponentId) {
          const draggedIndex = formDefinition.components.findIndex(c => c.id === draggingComponentId);
          const dropIndex = formDefinition.components.findIndex(c => c.id === dropTargetComponentId);

          if (draggedIndex !== -1 && dropIndex !== -1) {
              const [draggedItem] = formDefinition.components.splice(draggedIndex, 1); // Remove dragged item
              formDefinition.components.splice(dropIndex, 0, draggedItem); // Insert at new position
              formDefinition.components = [...formDefinition.components]; // Trigger reactivity
          }
      }
      draggingComponentId = null; // Reset dragging state
  }

  function handleDragEnd(event: DragEvent) {
      if (event.target instanceof HTMLElement) event.target.style.opacity = '1'; // Reset opacity on drag end
      draggingComponentId = null;
      dragOverTargetId = null;
  }

  function selectComponent(componentId: string) {
    selectedComponentId = componentId;
    // Emit event for properties panel (or use a store)
    // dispatch('selectComponent', formDefinition.components.find(c => c.id === componentId));
  }


  // Recursive function to render a component (used for both code gen and canvas display)
  // This version handles the actual Svelte component rendering on the canvas
  function renderLiveComponent(component: FormComponent, isChild = false) {
    const commonProps = {
      label: component.props.label,
      name: component.props.name,
      value: component.props.value, // Placeholder for bind:value
      on:click:stopPropagation={() => selectComponent(component.id)}
    };

    if (component.type === 'Input') {
      return `<Inp ${isChild ? 'class="ml-4"' : ''} label="${commonProps.label}" name="${commonProps.name}" type="${component.props.type}" />`;
    } else if (component.type === 'Select') {
      const items = JSON.stringify(component.props.items); // Ensure items are stringified correctly
      return `<Select ${isChild ? 'class="ml-4"' : ''} label="${commonProps.label}" name="${commonProps.name}" items={${items}} />`;
    } else if (component.type === 'SctForm') {
      const childrenHtml = component.children
        ? component.children.map(c => renderLiveComponent(c, true)).join('\n')
        : '';
      return `<SctForm ${isChild ? 'class="ml-4"' : ''}><svelte:fragment slot="pos">${childrenHtml}</svelte:fragment></SctForm>`;
    }
    return ``;
  }

  // Derived Svelte code for preview
  export const svelteCode = $derived(() => {
    let code = `<script lang="ts">\n`;
    code += `  // Declare reactive variables for bound values\n`;

    const boundValues = new Set<string>();
    function collectBoundValues(components: FormComponent[]) {
        components.forEach(comp => {
            // For Select and Input, assume 'value' is what's bound
            if ((comp.type === 'Input' || comp.type === 'Select') && comp.props.name) {
                // Initialize with a default based on type or an empty string
                const initialValue = comp.props.value ? JSON.stringify(comp.props.value) : `''`;
                boundValues.add(`let ${comp.props.name} = $state(${initialValue});`);
            }
            if (comp.children) {
                collectBoundValues(comp.children);
            }
        });
    }
    collectBoundValues(formDefinition.components);
    boundValues.forEach(val => code += `  ${val}\n`);
    code += `</script>\n\n`;

    code += `<form>\n`;
    formDefinition.components.forEach(component => {
      // Use a version of renderLiveComponent that generates code strings
      code += `  ${renderCodeComponent(component)}\n`;
    });
    code += `</form>`;
    return code;
  });

  // Function to generate the string for the code preview
  function renderCodeComponent(component: FormComponent, indentLevel = 1): string {
    const indent = '  '.repeat(indentLevel);
    const commonProps = {
      label: component.props.label ? `label="${component.props.label}"` : '',
      name: component.props.name ? `name="${component.props.name}"` : '',
      value: component.props.name ? `bind:value={${component.props.name}}` : ''
    };

    if (component.type === 'Input') {
      const typeProp = component.props.type ? `type="${component.props.type}"` : '';
      return `${indent}<Inp ${typeProp} ${commonProps.label} ${commonProps.name} ${commonProps.value} />`;
    } else if (component.type === 'Select') {
      const itemsProp = component.props.items && component.props.items.length > 0
        ? `items={${JSON.stringify(component.props.items)}}` // Stringify array for code
        : '';
      return `${indent}<Select ${commonProps.label} ${commonProps.name} ${itemsProp} ${commonProps.value} />`;
    } else if (component.type === 'SctForm') {
      const childrenCode = component.children
        ? component.children.map(c => renderCodeComponent(c, indentLevel + 1)).join('\n')
        : '';
      return `${indent}<SctForm>\n${indent}  <svelte:fragment slot="pos">\n${childrenCode}\n${indent}  </svelte:fragment>\n${indent}</SctForm>`;
    }
    return `${indent}`;
  }

</script>

<div
  use:makeDroppable={handleDropOnCanvas}
  class="border-dashed border-2 border-gray-400 p-4 min-h-64 bg-gray-100 flex flex-col gap-4"
>
  {#if formDefinition.components.length === 0}
    <p class="text-gray-500 text-center">Drag components here</p>
  {:else}
    {#each formDefinition.components as component (component.id)}
      <div
        draggable="true"
        on:dragstart={(e) => handleDragStart(e, component.id)}
        on:dragover={(e) => handleDragOver(e, component.id)}
        on:dragleave={(e) => handleDragLeave(e, component.id)}
        on:drop={(e) => handleDrop(e, component.id)}
        on:dragend={handleDragEnd}
        class="p-2 border rounded bg-white cursor-move
               {selectedComponentId === component.id ? 'border-blue-500 ring-2 ring-blue-300' : ''}
               {dragOverTargetId === component.id ? 'bg-yellow-100 border-yellow-500' : ''}"
        data-id={component.id} {#comment} Required for reordering logic to find original items {#/comment}
      >
        {#if component.type === 'Input'}
          <Inp
            label={component.props.label}
            name={component.props.name}
            type={component.props.type}
            bind:value={component.props.value}
            on:click|stopPropagation={() => selectComponent(component.id)}
          />
        {:else if component.type === 'Select'}
          <Select
            label={component.props.label}
            name={component.props.name}
            items={component.props.items}
            bind:value={component.props.value}
            on:click|stopPropagation={() => selectComponent(component.id)}
          />
        {:else if component.type === 'SctForm'}
          <SctForm on:click|stopPropagation={() => selectComponent(component.id)}>
            <svelte:fragment slot="pos">
              {#each component.children || [] as child (child.id)}
                <div
                  draggable="true"
                  on:dragstart={(e) => handleDragStart(e, child.id)}
                  on:dragover={(e) => handleDragOver(e, child.id)}
                  on:dragleave={(e) => handleDragLeave(e, child.id)}
                  on:drop={(e) => handleDrop(e, child.id)}
                  on:dragend={handleDragEnd}
                  class="ml-4 p-1 border-l border-gray-300 cursor-move
                         {selectedComponentId === child.id ? 'border-blue-500 ring-2 ring-blue-300' : ''}
                         {dragOverTargetId === child.id ? 'bg-yellow-100 border-yellow-500' : ''}"
                  data-id={child.id}
                >
                  {#if child.type === 'Input'}
                    <Inp
                      label={child.props.label}
                      name={child.props.name}
                      type={child.props.type}
                      bind:value={child.props.value}
                      on:click|stopPropagation={() => selectComponent(child.id)}
                    />
                  {:else if child.type === 'Select'}
                    <Select
                      label={child.props.label}
                      name={child.props.name}
                      items={child.props.items}
                      bind:value={child.props.value}
                      on:click|stopPropagation={() => selectComponent(child.id)}
                    />
                  {/if}
                </div>
              {/each}
            </svelte:fragment>
          </SctForm>
        {/if}
      </div>
    {/each}
  {/if}
</div>