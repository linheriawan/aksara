import bcrypt from 'bcryptjs';
import { jwtService, type JWTPayload } from './jwt';
import { db } from '../database/mongodb';
import type { User } from '$lib/types';

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface AuthResult {
	success: boolean;
	user?: User;
	accessToken?: string;
	refreshToken?: string;
	error?: string;
}

export class AuthService {
	/**
	 * Hash password
	 */
	async hashPassword(password: string): Promise<string> {
		const salt = await bcrypt.genSalt(10);
		return bcrypt.hash(password, salt);
	}

	/**
	 * Verify password
	 */
	async verifyPassword(password: string, hash: string): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}

	/**
	 * Authenticate user with credentials
	 */
	async login(credentials: LoginCredentials): Promise<AuthResult> {
		try {
			// Find user by email
			const user = await db()
				.collection<User>('users')
				.findOne({ email: credentials.email, active: true });

			if (!user) {
				return {
					success: false,
					error: 'Invalid email or password'
				};
			}

			// Verify password
			if (!user.password) {
				return {
					success: false,
					error: 'Invalid email or password'
				};
			}

			const isValidPassword = await this.verifyPassword(credentials.password, user.password);

			if (!isValidPassword) {
				return {
					success: false,
					error: 'Invalid email or password'
				};
			}

			// Create session
			const sessionId = this.generateSessionId();
			await this.createSession(user.id, sessionId);

			// Generate tokens
			const tokenPayload = {
				iss: 'platform.aksara.local',
				sub: user.id,
				aud: ['bun-service'],
				userId: user.id,
				email: user.email,
				roles: user.roles || ['user'],
				permissions: await this.getUserPermissions(user.roles || ['user']),
				sessionId
			};

			const accessToken = jwtService.generateAccessToken(tokenPayload);
			const refreshToken = jwtService.generateRefreshToken(tokenPayload);

			// Update last login
			await db()
				.collection('users')
				.updateOne({ id: user.id }, { $set: { lastLoginAt: new Date() } });

			// Remove password from response
			const { password, ...userWithoutPassword } = user;

			return {
				success: true,
				user: userWithoutPassword as User,
				accessToken,
				refreshToken
			};
		} catch (error) {
			console.error('Login error:', error);
			return {
				success: false,
				error: 'An error occurred during login'
			};
		}
	}

	/**
	 * Validate access token
	 */
	async validateToken(token: string): Promise<JWTPayload | null> {
		const payload = jwtService.verify(token);

		if (!payload) {
			return null;
		}

		// Check if session is valid
		const session = await this.getSession(payload.sessionId);
		if (!session || session.status !== 'active') {
			return null;
		}

		return payload;
	}

	/**
	 * Logout user
	 */
	async logout(sessionId: string): Promise<void> {
		await db()
			.collection('sessions')
			.updateOne({ sessionId }, { $set: { status: 'inactive', endedAt: new Date() } });
	}

	/**
	 * Create user session
	 */
	private async createSession(userId: string, sessionId: string): Promise<void> {
		await db()
			.collection('sessions')
			.insertOne({
				sessionId,
				userId,
				status: 'active',
				createdAt: new Date(),
				lastActivityAt: new Date()
			});
	}

	/**
	 * Get user session
	 */
	private async getSession(sessionId: string) {
		return await db().collection('sessions').findOne({ sessionId });
	}

	/**
	 * Generate unique session ID
	 */
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Get user permissions based on roles
	 */
	private async getUserPermissions(roles: string[]): Promise<string[]> {
		const permissions: string[] = [];

		for (const roleName of roles) {
			const role = await db().collection('roles').findOne({ name: roleName });
			if (role && role.permissions) {
				for (const permission of role.permissions) {
					const permString = `${permission.resource}:${permission.action}`;
					if (!permissions.includes(permString)) {
						permissions.push(permString);
					}
				}
			}
		}

		return permissions;
	}

	/**
	 * Create default admin user (for initial setup)
	 */
	async createDefaultAdmin(): Promise<void> {
		const existingAdmin = await db()
			.collection('users')
			.findOne({ email: 'admin@aksara.local' });

		if (!existingAdmin) {
			const hashedPassword = await this.hashPassword('admin123');

			await db()
				.collection('users')
				.insertOne({
					id: 'user_admin_001',
					email: 'admin@aksara.local',
					password: hashedPassword,
					name: 'Administrator',
					roles: ['admin'],
					active: true,
					createdAt: new Date(),
					updatedAt: new Date()
				});

			console.log('✅ Default admin user created (admin@aksara.local / admin123)');
		}
	}
}

// Singleton instance
export const authService = new AuthService();
