import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';

/**
 * @typedef {Object} RouteFile
 * @property {string} name
 * @property {string} path
 * @property {string} type
 * @property {boolean} [isServerSide]
 */

/**
 * @typedef {Object} FileInfo
 * @property {string} name
 * @property {string} type
 * @property {string} extension
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} name
 * @property {string} path
 * @property {string} slug
 * @property {boolean} isDynamic
 * @property {boolean} [hasLayout]
 * @property {boolean} [hasPage]
 * @property {string} [type]
 * @property {FileInfo[]} [files]
 * @property {MenuItem[]} [children]
 */

/**
 * @typedef {Object} RouteNode
 * @property {string} name
 * @property {string} path
 * @property {string} slug
 * @property {boolean} isDynamic
 * @property {boolean} isDirectory
 * @property {string} type
 * @property {RouteNode[]} children
 * @property {Record<string, RouteFile>} layout
 * @property {Record<string, RouteFile>} page
 * @property {FileInfo[]} files
 */

/**
 * @typedef {Object} RoutesTree
 * @property {RouteNode[]} routes
 * @property {Record<string, RouteFile>} layout
 * @property {Record<string, RouteFile>} page
 * @property {FileInfo[]} files
 */

/**
 * @typedef {Object} TreeOptions
 * @property {boolean} [includeFiles]
 * @property {boolean} [excludeDynamic]
 * @property {boolean} [includeMetadata]
 * @property {boolean} [menuOnly]
 */

/**
 * Build routes tree from directory structure
 * @param {string} dirPath 
 * @param {string} basePath 
 * @returns {RoutesTree}
 */
export function buildRoutesTree(dirPath = './src/routes', basePath = '') {
  try {
    if (!existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const stats = statSync(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${dirPath}`);
    }

    const items = readdirSync(dirPath);
    const routes = [];
    const layoutFiles = {};
    const pageFiles = {};
    
    items
      .filter(item => !item.startsWith('.'))
      .forEach(item => {
        const itemPath = join(dirPath, item);
        const itemStats = statSync(itemPath);
        const isDirectory = itemStats.isDirectory();
        
        if (isDirectory) {
          const routePath = join(basePath, item).replace(/\\/g, '/');
          const childTree = buildRoutesTree(itemPath, routePath);
          
          routes.push({
            name: item,
            path: routePath,
            slug: extractSlug(item),
            isDynamic: isDynamicRoute(item),
            isDirectory: true,
            type: 'route',
            children: childTree.routes,
            layout: childTree.layout,
            page: childTree.page,
            files: childTree.files
          });
        } else {
          const fileInfo = analyzeFile(item);
          
          if (fileInfo.isLayoutFile) {
            layoutFiles[fileInfo.type] = {
              name: item,
              path: join(basePath, item).replace(/\\/g, '/'),
              type: fileInfo.type,
              isServerSide: fileInfo.isServerSide
            };
          } else if (fileInfo.isPageFile) {
            pageFiles[fileInfo.type] = {
              name: item,
              path: join(basePath, item).replace(/\\/g, '/'),
              type: fileInfo.type,
              isServerSide: fileInfo.isServerSide
            };
          }
        }
      });

    routes.sort((a, b) => {
      if (a.isDynamic && !b.isDynamic) return 1;
      if (!a.isDynamic && b.isDynamic) return -1;
      return a.name.localeCompare(b.name);
    });

    return {
      routes: routes,
      layout: layoutFiles,
      page: pageFiles,
      files: getAllFiles(dirPath).filter(f => !isSpecialSvelteFile(f.name))
    };

  } catch (error) {
    throw new Error(`Error reading directory: ${error.message}`);
  }
}

/**
 * Analyze file type and purpose
 * @param {string} filename 
 * @returns {Object}
 */
function analyzeFile(filename) {
  const ext = extname(filename).toLowerCase();
  const base = basename(filename, ext);
  
  const info = {
    isLayoutFile: false,
    isPageFile: false,
    isServerSide: false,
    type: 'unknown'
  };

  if (base === '+layout') {
    info.isLayoutFile = true;
    if (ext === '.svelte') info.type = 'component';
    else if (ext === '.js' || ext === '.ts') info.type = 'load';
  } else if (base === '+layout.server') {
    info.isLayoutFile = true;
    info.isServerSide = true;
    info.type = 'server-load';
  } else if (base === '+page') {
    info.isPageFile = true;
    if (ext === '.svelte') info.type = 'component';
    else if (ext === '.js' || ext === '.ts') info.type = 'load';
  } else if (base === '+page.server') {
    info.isPageFile = true;
    info.isServerSide = true;
    info.type = 'server-load';
  } else if (base === '+error') {
    info.isPageFile = true;
    info.type = 'error';
  }

  return info;
}

/**
 * Check if route is dynamic
 * @param {string} dirname 
 * @returns {boolean}
 */
function isDynamicRoute(dirname) {
  return (dirname.startsWith('[') && dirname.endsWith(']')) || 
         (dirname.startsWith('(') && dirname.endsWith(')')) ||
         dirname.includes('[') || dirname.includes('(');
}

/**
 * Extract slug from directory name
 * @param {string} dirname 
 * @returns {string}
 */
function extractSlug(dirname) {
  if (dirname.startsWith('[') && dirname.endsWith(']')) {
    return dirname.slice(1, -1);
  }
  if (dirname.startsWith('(') && dirname.endsWith(')')) {
    return dirname.slice(1, -1);
  }
  return dirname;
}

/**
 * Check if file is special SvelteKit file
 * @param {string} filename 
 * @returns {boolean}
 */
function isSpecialSvelteFile(filename) {
  return filename.startsWith('+') || 
         filename === 'app.html' || 
         filename === 'error.html';
}

/**
 * Get all files in directory
 * @param {string} dirPath 
 * @returns {FileInfo[]}
 */
function getAllFiles(dirPath) {
  try {
    return readdirSync(dirPath)
      .filter(item => {
        const itemPath = join(dirPath, item);
        return statSync(itemPath).isFile() && !item.startsWith('.');
      })
      .map(item => ({
        name: item,
        type: getFileType(item),
        extension: extname(item)
      }));
  } catch (error) {
    return [];
  }
}

/**
 * Get file type from filename
 * @param {string} filename 
 * @returns {string}
 */
function getFileType(filename) {
  const ext = extname(filename).toLowerCase();
  const base = basename(filename, ext);
  
  if (base.startsWith('+')) return 'svelte-special';
  
  switch (ext) {
    case '.svelte': return 'component';
    case '.js': return 'javascript';
    case '.ts': return 'typescript';
    case '.json': return 'json';
    case '.md': return 'markdown';
    case '.css': return 'stylesheet';
    case '.scss': case '.sass': return 'sass';
    default: return 'other';
  }
}

/**
 * Generate menu structure from routes tree
 * @param {RoutesTree} routesTree 
 * @param {TreeOptions} options 
 * @returns {MenuItem[]}
 */
export function generateMenuStructure(routesTree, options = {}) {
  const { 
    includeFiles = false, 
    excludeDynamic = false,
    includeMetadata = true 
  } = options;

  function processRoute(route) {
    if (excludeDynamic && route.isDynamic) {
      return null;
    }

    const menuItem = {
      name: route.name,
      path: route.path,
      slug: route.slug,
      isDynamic: route.isDynamic
    };

    if (includeMetadata) {
      menuItem.hasLayout = Object.keys(route.layout || {}).length > 0;
      menuItem.hasPage = Object.keys(route.page || {}).length > 0;
      menuItem.type = route.type;
    }

    if (includeFiles && route.files && route.files.length > 0) {
      menuItem.files = route.files;
    }

    if (route.children && route.children.length > 0) {
      menuItem.children = route.children
        .map(processRoute)
        .filter(Boolean);
    }

    return menuItem;
  }

  return routesTree.routes
    .map(processRoute)
    .filter(Boolean);
}

/**
 * Get routes as JSON
 * @param {string} dirPath 
 * @param {TreeOptions} options 
 * @returns {RoutesTree | MenuItem[] | Object}
 */
export function getRoutesAsJSON(dirPath = './src/routes', options = {}) {
  try {
    const tree = buildRoutesTree(dirPath);
    
    if (options.menuOnly) {
      return generateMenuStructure(tree, options);
    }
    
    return tree;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Generate routes JSON file
 * @param {string} dirPath 
 * @param {string} outputPath 
 * @param {TreeOptions} options 
 */
export function generateRoutesFile(dirPath = './src/routes', outputPath = './src/lib/generated/routes.json', options = {}) {
  try {
    // Ensure output directory exists
    mkdirSync(dirname(outputPath), { recursive: true });
    
    const result = getRoutesAsJSON(dirPath, { menuOnly: true, excludeDynamic: true, ...options });
    
    // Add metadata
    const output = {
      generated: new Date().toISOString(),
      routes: result
    };
    
    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`✅ Routes generated: ${outputPath}`);
    
  } catch (error) {
    console.error(`❌ Error generating routes: ${error.message}`);
    process.exit(1);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dirPath = args.find(arg => !arg.startsWith('--')) || './src/routes';
  
  const options = {
    menuOnly: args.includes('--menu-only'),
    includeFiles: args.includes('--include-files'),
    excludeDynamic: args.includes('--exclude-dynamic'),
    includeMetadata: !args.includes('--no-metadata')
  };
  
  if (args.includes('--generate')) {
    const outputPath = args.includes('--output') 
      ? args[args.indexOf('--output') + 1] 
      : './src/lib/generated/routes.json';
    generateRoutesFile(dirPath, outputPath, options);
  } else {
    const result = getRoutesAsJSON(dirPath, options);
    console.log(JSON.stringify(result, null, 2));
  }
}