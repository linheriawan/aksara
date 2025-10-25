import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authService } from '$lib/server/security/auth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		const result = await authService.login({ email, password });

		if (!result.success) {
			return json({ error: result.error || 'Invalid credentials' }, { status: 401 });
		}

		return json({
			success: true,
			user: result.user,
			accessToken: result.accessToken,
			refreshToken: result.refreshToken
		});
	} catch (error) {
		console.error('Login API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
