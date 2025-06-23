// yaml-parser.ts - Dedicated YAML parser for Svelte form schemas
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export interface SvelteComponent {
  tag: string;
  props?: Record<string, any>;
  children?: SvelteComponent[];
  text?: string;
}

export interface FormElement {
  type: string;
  props: Record<string, any>;
  _id: string;
  nesting?: FormElement[];
}

/**
 * Parse Svelte component code to extract structure
 */
export function parseSvelteCode(code: string): SvelteComponent[] {
  // This is a simplified parser - for production use, consider using a proper Svelte AST parser
  const components: SvelteComponent[] = [];
  
  // Remove script and style tags
  const cleanCode = code
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim();
  
  // Parse HTML-like structure
  const parseElement = (html: string): SvelteComponent[] => {
    const elements: SvelteComponent[] = [];
    const tagRegex = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>|<(\w+)([^>]*)\s*\/>/g;
    
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const [fullMatch, tag1, attrs1, content, tag2, attrs2] = match;
      const tag = tag1 || tag2;
      const attrs = attrs1 || attrs2;
      
      // Parse attributes
      const props: Record<string, any> = {};
      if (attrs) {
        const attrRegex = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|{([^}]*)}|([^\s>]+)))?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
          const [, name, doubleQuote, singleQuote, braces, unquoted] = attrMatch;
          let value = doubleQuote || singleQuote || braces || unquoted || true;
          
          // Try to parse as JSON if it looks like an object/array
          if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            try {
              value = JSON.parse(value);
            } catch {
              // Keep as string if not valid JSON
            }
          }
          
          props[name] = value;
        }
      }
      
      const element: SvelteComponent = { tag, props };
      
      // Parse children if content exists
      if (content) {
        const trimmedContent = content.trim();
        if (trimmedContent) {
          // Check if content contains nested tags
          if (trimmedContent.includes('<')) {
            element.children = parseElement(trimmedContent);
          } else {
            element.text = trimmedContent;
          }
        }
      }
      
      elements.push(element);
    }
    
    return elements;
  };
  
  return parseElement(cleanCode);
}

/**
 * Convert Svelte components to YAML
 */
export function svelteToYaml(components: SvelteComponent[]): string {
  const convertComponent = (comp: SvelteComponent): any => {
    const result: any = {
      type: comp.tag
    };
    
    if (comp.props && Object.keys(comp.props).length > 0) {
      result.props = comp.props;
    }
    
    if (comp.text) {
      result.text = comp.text;
    }
    
    if (comp.children && comp.children.length > 0) {
      result.children = comp.children.map(convertComponent);
    }
    
    return result;
  };
  
  const yamlData = components.map(convertComponent);
  
  return stringifyYaml(yamlData, {
    indent: 2,
    lineWidth: 120,
    minContentWidth: 0,
    quotingType: '"',
    defaultKeyType: null,
    defaultStringType: 'PLAIN'
  });
}

/**
 * Convert YAML back to Svelte components
 */
export function yamlToSvelte(yamlString: string): SvelteComponent[] {
  try {
    const parsed = parseYaml(yamlString);
    if (!Array.isArray(parsed)) {
      throw new Error('YAML must represent an array of components');
    }
    
    const convertToComponent = (item: any): SvelteComponent => {
      const component: SvelteComponent = {
        tag: item.type || 'div'
      };
      
      if (item.props) {
        component.props = item.props;
      }
      
      if (item.text) {
        component.text = item.text;
      }
      
      if (item.children && Array.isArray(item.children)) {
        component.children = item.children.map(convertToComponent);
      }
      
      return component;
    };
    
    return parsed.map(convertToComponent);
  } catch (error) {
    console.error('Failed to parse YAML:', error);
    return [];
  }
}

/**
 * Generate Svelte code from components
 */
export function generateSvelteCode(components: SvelteComponent[], indent: string = ''): string {
  const generateComponent = (comp: SvelteComponent, currentIndent: string): string => {
    const { tag, props, children, text } = comp;
    
    // Generate props string
    let propsStr = '';
    if (props) {
      propsStr = Object.entries(props)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `${key}="${value}"`;
          } else if (typeof value === 'boolean') {
            return value ? key : `${key}={false}`;
          } else if (typeof value === 'object') {
            return `${key}={${JSON.stringify(value)}}`;
          } else {
            return `${key}={${value}}`;
          }
        })
        .join(' ');
    }
    
    const openTag = propsStr ? `<${tag} ${propsStr}>` : `<${tag}>`;
    const closeTag = `</${tag}>`;
    
    // Handle self-closing tags
    const selfClosingTags = ['input', 'img', 'br', 'hr', 'meta', 'link'];
    if (selfClosingTags.includes(tag.toLowerCase()) && !children && !text) {
      return `${currentIndent}${propsStr ? `<${tag} ${propsStr} />` : `<${tag} />`}`;
    }
    
    // Handle text content
    if (text && !children) {
      return `${currentIndent}${openTag}${text}${closeTag}`;
    }
    
    // Handle children
    if (children && children.length > 0) {
      const childrenStr = children
        .map(child => generateComponent(child, currentIndent + '  '))
        .join('\n');
      return `${currentIndent}${openTag}\n${childrenStr}\n${currentIndent}${closeTag}`;
    }
    
    // Empty element
    return `${currentIndent}${openTag}${closeTag}`;
  };
  
  return components
    .map(comp => generateComponent(comp, indent))
    .join('\n');
}

/**
 * Convert form schema to Svelte components
 */
export function formSchemaToSvelte(schema: FormElement[]): SvelteComponent[] {
  const convertElement = (element: FormElement): SvelteComponent => {
    const component: SvelteComponent = {
      tag: element.type,
      props: { ...element.props }
    };
    
    // Remove internal properties
    delete component.props._id;
    
    if (element.nesting && element.nesting.length > 0) {
      component.children = element.nesting.map(convertElement);
    }
    
    return component;
  };
  
  return schema.map(convertElement);
}

/**
 * Convert Svelte components to form schema
 */
export function svelteToFormSchema(components: SvelteComponent[]): FormElement[] {
  const generateId = (): string => 'el_' + Math.random().toString(36).substr(2, 9);
  
  const convertComponent = (comp: SvelteComponent): FormElement => {
    const element: FormElement = {
      type: comp.tag,
      props: { ...comp.props },
      _id: generateId()
    };
    
    if (comp.children && comp.children.length > 0) {
      element.nesting = comp.children.map(convertComponent);
    }
    
    return element;
  };
  
  return components.map(convertComponent);
}

/**
 * Complete workflow: Svelte code -> YAML
 */
export function svelteCodeToYaml(code: string): string {
  const components = parseSvelteCode(code);
  return svelteToYaml(components);
}

/**
 * Complete workflow: YAML -> Svelte code
 */
export function yamlToSvelteCode(yamlString: string): string {
  const components = yamlToSvelte(yamlString);
  return generateSvelteCode(components);
}

/**
 * Validate YAML structure for Svelte components
 */
export function validateSvelteYaml(yamlString: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const parsed = parseYaml(yamlString);
    
    if (!Array.isArray(parsed)) {
      errors.push('Root must be an array of components');
      return { isValid: false, errors };
    }
    
    const validateComponent = (comp: any, path: string = '') => {
      if (!comp.type) {
        errors.push(`Component at ${path} missing 'type' property`);
      }
      
      if (comp.props && typeof comp.props !== 'object') {
        errors.push(`Component at ${path} has invalid 'props' (must be object)`);
      }
      
      if (comp.children) {
        if (!Array.isArray(comp.children)) {
          errors.push(`Component at ${path} has invalid 'children' (must be array)`);
        } else {
          comp.children.forEach((child: any, index: number) => {
            validateComponent(child, `${path}[${index}]`);
          });
        }
      }
    };
    
    parsed.forEach((comp, index) => {
      validateComponent(comp, `[${index}]`);
    });
    
  } catch (error) {
    errors.push(`YAML parsing error: ${error.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Utility to format YAML with consistent styling
 */
export function formatYaml(yamlString: string): string {
  try {
    const parsed = parseYaml(yamlString);
    return stringifyYaml(parsed, {
      indent: 2,
      lineWidth: 120,
      minContentWidth: 0,
      quotingType: '"',
      defaultKeyType: null,
      defaultStringType: 'PLAIN'
    });
  } catch (error) {
    console.error('Failed to format YAML:', error);
    return yamlString;
  }
}

// Example usage:
/*
// Parse Svelte code to YAML
const svelteCode = `
  <div class="container">
    <input type="text" bind:value={name} />
    <button onclick={handleClick}>Submit</button>
  </div>
`;

const yaml = svelteCodeToYaml(svelteCode);
console.log(yaml);

// Convert back to Svelte
const backToSvelte = yamlToSvelteCode(yaml);
console.log(backToSvelte);
*/