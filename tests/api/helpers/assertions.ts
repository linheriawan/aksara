/**
 * Custom assertions for API testing
 */

import { expect } from 'bun:test';
import type { ApiResponse } from './request';

/**
 * Assert that API response is successful
 */
export function assertSuccess<T>(response: ApiResponse<T>, message?: string) {
	expect(response.ok).toBe(true);
	expect(response.status).toBeGreaterThanOrEqual(200);
	expect(response.status).toBeLessThan(300);
	if (message) {
		expect(response.error).toBeUndefined();
	}
}

/**
 * Assert that API response is an error with specific status
 */
export function assertError(response: ApiResponse, expectedStatus: number, message?: string) {
	expect(response.ok).toBe(false);
	expect(response.status).toBe(expectedStatus);
	if (message) {
		expect(response.error).toContain(message);
	}
}

/**
 * Assert unauthorized (401)
 */
export function assertUnauthorized(response: ApiResponse) {
	assertError(response, 401, 'Unauthorized');
}

/**
 * Assert not found (404)
 */
export function assertNotFound(response: ApiResponse) {
	assertError(response, 404);
}

/**
 * Assert bad request (400)
 */
export function assertBadRequest(response: ApiResponse, message?: string) {
	assertError(response, 400, message);
}

/**
 * Assert that data has required fields
 */
export function assertHasFields<T extends object>(
	data: T | undefined,
	fields: (keyof T)[]
): asserts data is T {
	expect(data).toBeDefined();
	for (const field of fields) {
		expect(data).toHaveProperty(field as string);
	}
}

/**
 * Assert that response contains a valid ID
 */
export function assertHasValidId(data: any) {
	expect(data).toHaveProperty('id');
	expect(typeof data.id).toBe('string');
	expect(data.id.length).toBeGreaterThan(0);
}

/**
 * Assert that response is an array
 */
export function assertIsArray<T>(data: any): asserts data is T[] {
	expect(Array.isArray(data)).toBe(true);
}

/**
 * Assert that array is not empty
 */
export function assertNotEmpty<T>(data: T[]) {
	assertIsArray(data);
	expect(data.length).toBeGreaterThan(0);
}
