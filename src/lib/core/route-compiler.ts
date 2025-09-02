// Route compilation utility - combines defaults + workspace → runtime
import { readJSON, writeJSON, readYAML } from './file-system-server.js';
import { join } from 'path';
import type { MenuItem, RouteConfig } from './routes.js';

export interface RouteCompilerConfig {
  defaultsPath: string;
  workspacePath: string;
  runtimePath: string;
}

export class RouteCompiler {
  private config: RouteCompilerConfig;

  constructor(config?: Partial<RouteCompilerConfig>) {
    this.config = {
      defaultsPath: join(process.cwd(), 'src/lib/defaults'),
      workspacePath: join(process.cwd(), 'src/lib/workspace'),
      runtimePath: join(process.cwd(), 'src/lib/runtime'),
      ...config
    };
  }

  /**
   * Compile routes: defaults + workspace → runtime/routes.json
   */
  async compileRoutes(): Promise<void> {
    try {
      console.log('🔧 Compiling routes...');

      // Load default system routes (non-editable)
      const defaultRoutes = await this.loadDefaultRoutes();
      
      // Load user workspace routes (editable)
      const workspaceRoutes = await this.loadWorkspaceRoutes();
      
      // Combine routes (defaults + workspace)
      const combinedRoutes = this.mergeRoutes(defaultRoutes, workspaceRoutes);
      
      // Sort routes by order
      const sortedRoutes = this.sortRoutesByOrder(combinedRoutes);
      
      // Create final route configuration
      const finalConfig: RouteConfig = {
        version: "1.0",
        lastModified: new Date().toISOString(),
        routes: sortedRoutes
      };

      // Write to runtime/routes.json
      const runtimeFile = join(this.config.runtimePath, 'routes.json');
      await writeJSON(runtimeFile, finalConfig);
      
      console.log(`✅ Routes compiled successfully to ${runtimeFile}`);
      console.log(`📊 Total routes: ${sortedRoutes.length}`);
      
    } catch (error) {
      console.error('❌ Route compilation failed:', error);
      throw error;
    }
  }

  private async loadDefaultRoutes(): Promise<MenuItem[]> {
    try {
      const defaultFile = join(this.config.defaultsPath, 'routes-default.json');
      const defaultData = await readJSON(defaultFile);
      return defaultData.routes || [];
    } catch (error) {
      console.warn('⚠️ No default routes found, using empty array');
      return [];
    }
  }

  private async loadWorkspaceRoutes(): Promise<MenuItem[]> {
    try {
      const workspaceFile = join(this.config.workspacePath, 'routes.yaml');
      const workspaceData = await readYAML(workspaceFile);
      return workspaceData.routes || [];
    } catch (error) {
      console.warn('⚠️ No workspace routes found, using empty array');
      return [];
    }
  }

  /**
   * Merge default and workspace routes
   * - Defaults are always included and readonly
   * - Workspace routes are user-editable
   * - No conflicts since they serve different purposes
   */
  private mergeRoutes(defaultRoutes: MenuItem[], workspaceRoutes: MenuItem[]): MenuItem[] {
    const merged: MenuItem[] = [];
    
    // Add all workspace routes first (user routes get priority in display)
    merged.push(...workspaceRoutes.map(route => ({
      ...route,
      system: false,
      readonly: false
    })));
    
    // Add all default routes (system routes)
    merged.push(...defaultRoutes.map(route => ({
      ...route,
      system: true,
      readonly: true
    })));
    
    return merged;
  }

  /**
   * Sort routes by order field
   */
  private sortRoutesByOrder(routes: MenuItem[]): MenuItem[] {
    return routes.sort((a, b) => {
      const orderA = a.order || 999;
      const orderB = b.order || 999;
      return orderA - orderB;
    }).map(route => ({
      ...route,
      children: route.children ? this.sortRoutesByOrder(route.children) : undefined
    }));
  }

  /**
   * Watch for changes and auto-recompile
   */
  async watchAndCompile(): Promise<void> {
    // Initial compilation
    await this.compileRoutes();
    
    console.log('👀 Watching for route changes...');
    // TODO: Implement file watcher for auto-compilation
  }
}

// Export singleton instance
export const routeCompiler = new RouteCompiler();