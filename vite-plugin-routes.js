import { generateRoutesFile } from './src/scripts/routes-tree.mjs';

export function routesPlugin() {
  return {
    name: 'routes-plugin',
    /**
     * @param {import('vite').ViteDevServer} server
     */
    configureServer(server) {
      const watcher = server.watcher;
      
      watcher.add('./src/routes/**');
      
      watcher.on('addDir', (path) => {
        if (path.includes('/src/routes/')) {
          console.log('Directory added:', path);
          generateRoutesFile('./src/routes', './src/lib/generated/routes.json', {
            menuOnly: true, 
            excludeDynamic: true
          });
        }
      });
      
      watcher.on('unlinkDir', (path) => {
        if (path.includes('/src/routes/')) {
          console.log('Directory removed:', path);
          generateRoutesFile('./src/routes', './src/lib/generated/routes.json', {
            menuOnly: true, 
            excludeDynamic: true
          });
        }
      });
    }
  }
}