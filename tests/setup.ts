/**
 * Global test setup
 *
 * This file runs before all tests and sets up the testing environment.
 */

import { beforeAll, afterAll } from 'bun:test';

// Test environment configuration
export const TEST_CONFIG = {
	baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
	timeout: parseInt(process.env.TEST_TIMEOUT || '5000'),
	// Test user credentials - use environment variables or defaults
	testUser: {
		email: process.env.TEST_USER_EMAIL || 'admin@aksara.local',
		password: process.env.TEST_USER_PASSWORD || 'admin123'
	}
};

// Global setup before all tests
beforeAll(async () => {
	console.log('🧪 Starting test suite...');
	console.log(`📍 API Base URL: ${TEST_CONFIG.baseUrl}`);
	console.log(`👤 Test User: ${TEST_CONFIG.testUser.email}`);
});

// Global cleanup after all tests
afterAll(async () => {
	console.log('✅ Test suite completed');
});
