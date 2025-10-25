import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authService } from '$lib/server/security/auth';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '$env/static/private';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to home if already logged in
	if (locals.user) {
		throw redirect(302, '/');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const result = await authService.login({ email, password });

		if (!result.success) {
			return fail(401, { error: result.error || 'Invalid credentials' });
		}

		// Set session cookie
		cookies.set(SESSION_COOKIE_NAME, result.accessToken!, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: parseInt(SESSION_MAX_AGE)
		});

		throw redirect(302, '/');
	}
};
