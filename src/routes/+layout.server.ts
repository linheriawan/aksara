import type { LayoutServerLoad } from './$types';
import { parse } from 'cookie';
import routesData from '$lib/generated/routes.json';
import type { MenuItem } from '$lib/types/routes';
import {APP_NAME}  from '$env/static/private';
const AppModules: MenuItem[] = routesData.routes;
export const load: LayoutServerLoad = async ({ request,url }) => {
  const isolatedPaths = ['/designer', '/standalone', '/admin-only'];
  const isIsolated = isolatedPaths.some(path => url.pathname.startsWith(path));
  
  const cookies = parse(request.headers.get('cookie') || '');
  let layout = cookies.layout || 'classic';
  if (isIsolated) {
     layout = '-standalone-';
  }
  const info={
    name:APP_NAME,
    user:"+Uname+"
  }
  return { layout, app:{info,modules:AppModules}};
};