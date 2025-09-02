<script lang="ts">
import type {FormElement} from "./utils.ts"

function formatSchema(elements: FormElement[]): Record<string, any>[] {
  return elements.map(element => {
    const elementContent: Record<string, any> = { ...element.props };
    
    if (element.nesting && element.nesting.length > 0) {
      elementContent.nesting = formatSchema(element.nesting);
    } else {
      elementContent.nesting = [];
    }
    
    return { [element.type]: elementContent };
  });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  return JSON.stringify(value);
}

function toYAML(obj: unknown, indent = 0): string {
  const padding = '  '.repeat(indent);
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return `${padding}[]\n`;
    }
    
    return obj
      .map(item => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const [key, value] = Object.entries(item)[0];
          return `${padding}- ${key}:\n${toYAML(value, indent + 1)}`;
        }
        return `${padding}- ${formatValue(item)}\n`;
      })
      .join('');
  }
  
  if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return `${padding}${key}:\n${toYAML(value, indent + 1)}`;
        }
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return `${padding}${key}: []\n`;
          }
          return `${padding}${key}:\n${toYAML(value, indent + 1)}`;
        }
        return `${padding}${key}: ${formatValue(value)}\n`;
      })
      .join('');
  }
  
  return `${padding}${formatValue(obj)}\n`;
}

const { schema } = $props();
const yamlOutput = $derived(() => {
  const formattedSchema = formatSchema(schema as FormElement[]);
  return toYAML(formattedSchema);
});
</script>

<div class="overflow-x-auto border bg-black">
  <pre class="p-2 text-white text-sm font-mono whitespace-pre" 
       role="region" 
       aria-label="Schema YAML output">{yamlOutput()}</pre>
</div>