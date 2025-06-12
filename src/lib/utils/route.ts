import type { MenuItem } from '$lib/types/routes';

export function listPaths(routes: MenuItem[], base = ''): string[] {
    let paths: string[] = [];
    for (const r of routes) {
      const fullPath = base ? `${base}/${r.name}` : r.name;
      paths.push(fullPath);
      if (r.children) paths = paths.concat(listPaths(r.children, fullPath));
    }
    return paths;
}

export function getNodeByPath(data: MenuItem[], path: string): MenuItem | undefined {
    const parts = path.split('/');
    let currentNodes: MenuItem[] | undefined = data;
    let foundNode: MenuItem | undefined;
    for (const part of parts) {
      if (!currentNodes) return undefined; // No children to search in
      foundNode = currentNodes.find((r) => r.name === part);
      if (!foundNode) return undefined; // Part not found
      currentNodes = foundNode.children; // Move to children for next part
    }
    return foundNode;
}