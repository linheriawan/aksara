import type { Handle } from '@sveltejs/kit';
import { authService } from '$lib/server/security/auth';
import { SESSION_COOKIE_NAME } from '$env/static/private';
import { mongodb } from '$lib/server/database/mongodb';
import { objectService } from '$lib/server/modules/object/object.service';

// Initialize MongoDB connection on server startup
await mongodb.connect();

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
	const publicRoutes = ['/login', '/api/auth/login', '/api/health', '/api/v1/docs'];
	let isPublicRoute = publicRoutes.some((route) => event.url.pathname.startsWith(route));

	// Check if this is a public REST API endpoint
	if (!isPublicRoute && event.url.pathname.startsWith('/api/v1/')) {
		const pathParts = event.url.pathname.split('/').filter(Boolean);
		// pathParts: ['api', 'v1', 'objectName', ...]
		const objectName = pathParts[2];

		if (objectName) {
			try {
				// Get all public objects
				const publicObjects = await objectService.listAllPublicObjectDefinitions();
				// Check if this object is public
				const isPublicObject = publicObjects.some((obj) => obj.name === objectName);
				if (isPublicObject) {
					isPublicRoute = true;
				}
			} catch (error) {
				console.error('Error checking public object:', error);
			}
		}
	}

	// Check if this is a public API documentation page (/api/v1/docs/{objectName})
	if (!isPublicRoute && event.url.pathname.startsWith('/api/v1/docs/')) {
		const pathParts = event.url.pathname.split('/').filter(Boolean);
		// pathParts: ['api', 'v1', 'docs', 'objectName']
		const objectName = pathParts[3];

		if (objectName) {
			try {
				// Get all public objects
				const publicObjects = await objectService.listAllPublicObjectDefinitions();
				// Check if this object is public
				const isPublicObject = publicObjects.some((obj) => obj.name === objectName);
				if (isPublicObject) {
					isPublicRoute = true;
				}
			} catch (error) {
				console.error('Error checking public API docs:', error);
			}
		}
	}

	// Keep old route for backward compatibility (but redirect to new route)
	if (!isPublicRoute && event.url.pathname.startsWith('/objects/') && event.url.pathname.includes('/api-docs')) {
		const pathParts = event.url.pathname.split('/').filter(Boolean);
		// pathParts: ['objects', 'objectId', 'api-docs']
		const objectId = pathParts[1];

		if (objectId) {
			try {
				// Get the object to check if it's public
				const object = await objectService.getObjectDefinition(objectId);
				if (object &&
					object.status === 'enabled' &&
					object.publishing?.protocols?.rest?.enabled &&
					object.publishing?.security?.type === 'public') {
					isPublicRoute = true;
				}
			} catch (error) {
				console.error('Error checking public API docs:', error);
			}
		}
	}

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
