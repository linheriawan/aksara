import type { LayoutServerLoad } from './$types';
import { parse } from 'cookie';
import routesData from '$lib/generated/routes.json';
import type { MenuItem } from './designer/modules/route';
import {APP_NAME}  from '$env/static/private';
const AppModules: MenuItem[] = routesData.routes;
export const load: LayoutServerLoad = async ({ request, url }) => {
  const adminPaths = ['/designer'];
  const isAdminPath = adminPaths.some(path => url.pathname.startsWith(path));
  
  const cookies = parse(request.headers.get('cookie') || '');
  let layout = cookies.layout || 'modern';
  
  // Force admin layout for designer routes
  if (isAdminPath) {
    layout = 'designer';
  } else {
    // End-user layouts: modern, classic, floating
    layout = cookies.layout || 'modern';
  }
  
  const info = {
    name: APP_NAME,
    user: "+Uname+"
  }
  
  return { 
    layout, 
    isAdmin: isAdminPath,
    app: { info, modules: AppModules }
  };
};