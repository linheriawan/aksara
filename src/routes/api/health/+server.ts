import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mongodb } from '$lib/server/database/mongodb';

export const GET: RequestHandler = async () => {
	const checks: Record<string, any> = {};

	// Check MongoDB
	const mongoStart = Date.now();
	try {
		const isHealthy = await mongodb.healthCheck();
		checks.mongodb = {
			status: isHealthy ? 'pass' : 'fail',
			responseTime: Date.now() - mongoStart
		};
	} catch (error: any) {
		checks.mongodb = {
			status: 'fail',
			message: error.message,
			responseTime: Date.now() - mongoStart
		};
	}

	// Determine overall status
	const allPassed = Object.values(checks).every((c: any) => c.status === 'pass');
	const anyFailed = Object.values(checks).some((c: any) => c.status === 'fail');

	let status: 'healthy' | 'degraded' | 'unhealthy';
	if (allPassed) {
		status = 'healthy';
	} else if (anyFailed) {
		status = 'unhealthy';
	} else {
		status = 'degraded';
	}

	const response = {
		status,
		service: 'aksara-platform-frontend',
		version: '1.0.0',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		checks
	};

	const statusCode = status === 'healthy' ? 200 : 503;
	return json(response, { status: statusCode });
};
