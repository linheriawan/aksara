export interface MenuItem {
  name: string;
  path: string;
  icon: string;
  children?: MenuItem[];
}

export type FileType = 'component' | 'load' | 'server-load' | 'error' | 'unknown';