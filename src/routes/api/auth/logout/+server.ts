import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authService } from '$lib/server/security/auth';
import { SESSION_COOKIE_NAME } from '$env/static/private';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (locals.user?.sessionId) {
		await authService.logout(locals.user.sessionId);
	}

	// Clear session cookie
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

	// Check if this is a form submission (redirect) or API call (JSON response)
	const contentType = cookies.get('Content-Type');
	if (contentType?.includes('application/json')) {
		return json({ success: true });
	}

	// Redirect to login page for form submissions
	throw redirect(302, '/login');
};
