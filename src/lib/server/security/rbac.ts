import { db } from '../database/mongodb';
import type { Permission, Condition } from '$lib/types';

export class RBACService {
	/**
	 * Check if user has permission to perform action on resource
	 */
	async checkPermission(
		userId: string,
		resource: string,
		action: string,
		context?: any
	): Promise<boolean> {
		// Get user roles
		const user = await db().collection('users').findOne({ id: userId });
		if (!user) return false;

		// Load permissions for all roles
		const permissions: Permission[] = [];
		for (const roleId of user.roles || []) {
			const role = await db().collection('roles').findOne({ name: roleId });
			if (role && role.permissions) {
				permissions.push(...role.permissions);
			}
		}

		// Check if any permission matches
		for (const permission of permissions) {
			// Wildcard check
			if (permission.resource === '*' && permission.action === '*') {
				return true;
			}

			// Exact match
			if (permission.resource === resource && permission.action === action) {
				// Check conditions if any
				if (permission.conditions) {
					const conditionsMet = this.evaluateConditions(permission.conditions, context);
					if (!conditionsMet) continue;
				}
				return true;
			}
		}

		return false;
	}

	/**
	 * Evaluate permission conditions
	 */
	private evaluateConditions(conditions: Condition[], context: any): boolean {
		for (const condition of conditions) {
			const value = context?.[condition.field];

			switch (condition.operator) {
				case 'equals':
					if (value !== condition.value) return false;
					break;
				case 'not_equals':
					if (value === condition.value) return false;
					break;
				case 'in':
					if (!condition.value.includes(value)) return false;
					break;
				case 'not_in':
					if (condition.value.includes(value)) return false;
					break;
			}
		}

		return true;
	}

	/**
	 * Initialize default roles
	 */
	async initializeDefaultRoles(): Promise<void> {
		const roles = [
			{
				id: 'role_admin',
				name: 'admin',
				description: 'Administrator with full system access',
				permissions: [{ resource: '*', action: '*' }],
				createdAt: new Date()
			},
			{
				id: 'role_developer',
				name: 'developer',
				description: 'Can create and manage objects and APIs',
				permissions: [
					{ resource: 'datasources', action: 'read' },
					{ resource: 'datasources', action: 'write' },
					{ resource: 'objects', action: 'read' },
					{ resource: 'objects', action: 'write' },
					{ resource: 'apis', action: 'read' },
					{ resource: 'apis', action: 'publish' },
					{ resource: 'uis', action: 'read' },
					{ resource: 'uis', action: 'publish' }
				],
				createdAt: new Date()
			},
			{
				id: 'role_viewer',
				name: 'viewer',
				description: 'Read-only access',
				permissions: [
					{ resource: 'datasources', action: 'read' },
					{ resource: 'objects', action: 'read' },
					{ resource: 'apis', action: 'read' },
					{ resource: 'uis', action: 'read' }
				],
				createdAt: new Date()
			}
		];

		for (const role of roles) {
			const existing = await db().collection('roles').findOne({ name: role.name });
			if (!existing) {
				await db().collection('roles').insertOne(role);
				console.log(`✅ Created default role: ${role.name}`);
			}
		}
	}

	/**
	 * Check if user has any of the required roles
	 */
	hasRole(userRoles: string[], requiredRoles: string[]): boolean {
		return requiredRoles.some((role) => userRoles.includes(role));
	}

	/**
	 * Check if user has permission from locals (quick check)
	 */
	hasPermission(userPermissions: string[], resource: string, action: string): boolean {
		const permString = `${resource}:${action}`;
		const wildcard = '*:*';

		return userPermissions.includes(permString) || userPermissions.includes(wildcard);
	}
}

// Singleton instance
export const rbacService = new RBACService();
