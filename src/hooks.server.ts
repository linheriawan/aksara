import type { Handle } from '@sveltejs/kit';
import { authService } from '$lib/server/security/auth';
import { SESSION_COOKIE_NAME } from '$env/static/private';

export const handle: Handle = async ({ event, resolve }) => {
	// Get session token from cookie
	const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);

	if (sessionToken) {
		// Validate token and get user info
		const payload = await authService.validateToken(sessionToken);

		if (payload) {
			// Attach user info to event.locals
			event.locals.user = {
				id: payload.userId,
				email: payload.email,
				roles: payload.roles,
				permissions: payload.permissions,
				sessionId: payload.sessionId
			};
		}
	}

	// Public routes that don't require authentication
	const publicRoutes = ['/login', '/api/auth/login', '/api/health'];
	const isPublicRoute = publicRoutes.some((route) => event.url.pathname.startsWith(route));

	// Redirect to login if not authenticated and not on public route
	if (!event.locals.user && !isPublicRoute) {
		if (event.url.pathname.startsWith('/api/')) {
			// Return 401 for API routes
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		} else {
			// Redirect to login for page routes
			return Response.redirect(new URL('/login', event.url.origin), 302);
		}
	}

	const response = await resolve(event);
	return response;
};
