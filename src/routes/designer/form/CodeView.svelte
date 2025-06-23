<script lang="ts">
import type {FormElement} from "./utils.ts"

const SELF_CLOSING_TAGS = new Set(['Inp', 'Select', 'input', 'img', 'br', 'hr']);

function formatPropValue(value: unknown): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return `{${JSON.stringify(value)}}`;
  }
  return `{${value}}`;
}

function formatProps(props: Record<string, any>, id?: string): string {
  const allProps = id ? { _id: id, ...props } : props;
  
  return Object.entries(allProps)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${formatPropValue(value)}`)
    .join(' ');
}

function renderSvelteCode(schema: FormElement[], indent = 0): string {
  const padding = '  '.repeat(indent);
  
  return schema
    .map((node) => {
      const { type, _id, props = {}, nesting = [] } = node;
      const propString = formatProps(props, _id);
      const attributes = propString ? ` ${propString}` : '';
      
      if (SELF_CLOSING_TAGS.has(type)) {
        return `${padding}<${type}${attributes} />`;
      }
      
      const openTag = `${padding}<${type}${attributes}>`;
      const closeTag = `${padding}</${type}>`;
      
      if (nesting.length === 0) {
        return `${openTag}${closeTag}`;
      }
      
      const nestedContent = renderSvelteCode(nesting, indent + 1);
      return `${openTag}\n${nestedContent}\n${closeTag}`;
    })
    .join('\n');
}

const { schema, toggleView = false } = $props();
const svelteCode = $derived(() => renderSvelteCode(schema as FormElement[]));
</script>

{#if toggleView}
  <div class="code-view mr-2">
    <h3 class="font-bold">Svelte Code</h3>
    <pre class="bg-black text-white p-2 overflow-x-auto text-sm"
         role="region" 
         aria-label="Generated Svelte code">{svelteCode()}</pre>
  </div>
  <slot/>
{/if}

<style>
  .code-view {
    max-height: 80vh;
    overflow-y: auto;
  }
  pre {
    white-space: pre;
    word-wrap: normal;
  }
</style>