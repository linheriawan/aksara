import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '$env/static/private';

export interface JWTPayload {
	// Standard claims
	iss: string; // Issuer
	sub: string; // Subject (user ID)
	aud: string[]; // Audience
	exp: number; // Expiration timestamp
	nbf: number; // Not before timestamp
	iat: number; // Issued at timestamp
	jti: string; // JWT ID (unique identifier)

	// Custom claims
	userId: string;
	email: string;
	roles: string[];
	permissions: string[];
	organizationId?: string;

	// Security
	sessionId: string;
	tokenType: 'access' | 'refresh';
}

export class JWTService {
	private secret: string;
	private accessTokenExpiry: string;
	private refreshTokenExpiry: string;

	constructor() {
		this.secret = JWT_SECRET;
		this.accessTokenExpiry = JWT_EXPIRES_IN;
		this.refreshTokenExpiry = JWT_REFRESH_EXPIRES_IN;
	}

	/**
	 * Generate access token
	 */
	generateAccessToken(payload: Omit<JWTPayload, 'exp' | 'nbf' | 'iat' | 'jti' | 'tokenType'>): string {
		const now = Math.floor(Date.now() / 1000);

		const fullPayload: JWTPayload = {
			...payload,
			iss: 'platform.aksara.local',
			aud: ['bun-service'],
			exp: now + this.parseExpiry(this.accessTokenExpiry),
			nbf: now,
			iat: now,
			jti: this.generateJTI(),
			tokenType: 'access'
		};

		return jwt.sign(fullPayload, this.secret, {
			algorithm: 'HS256'
		});
	}

	/**
	 * Generate refresh token
	 */
	generateRefreshToken(payload: Omit<JWTPayload, 'exp' | 'nbf' | 'iat' | 'jti' | 'tokenType'>): string {
		const now = Math.floor(Date.now() / 1000);

		const fullPayload: JWTPayload = {
			...payload,
			iss: 'platform.aksara.local',
			aud: ['bun-service'],
			exp: now + this.parseExpiry(this.refreshTokenExpiry),
			nbf: now,
			iat: now,
			jti: this.generateJTI(),
			tokenType: 'refresh'
		};

		return jwt.sign(fullPayload, this.secret, {
			algorithm: 'HS256'
		});
	}

	/**
	 * Verify and decode token
	 */
	verify(token: string): JWTPayload | null {
		try {
			const decoded = jwt.verify(token, this.secret, {
				algorithms: ['HS256'],
				issuer: 'platform.aksara.local'
			}) as JWTPayload;

			// Check expiration
			if (decoded.exp < Date.now() / 1000) {
				return null;
			}

			return decoded;
		} catch (error) {
			console.error('JWT verification failed:', error);
			return null;
		}
	}

	/**
	 * Decode token without verification (for debugging)
	 */
	decode(token: string): JWTPayload | null {
		try {
			return jwt.decode(token) as JWTPayload;
		} catch {
			return null;
		}
	}

	/**
	 * Generate unique JWT ID
	 */
	private generateJTI(): string {
		return `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Parse expiry string to seconds
	 */
	private parseExpiry(expiry: string): number {
		const unit = expiry.slice(-1);
		const value = parseInt(expiry.slice(0, -1));

		switch (unit) {
			case 's':
				return value;
			case 'm':
				return value * 60;
			case 'h':
				return value * 60 * 60;
			case 'd':
				return value * 24 * 60 * 60;
			default:
				return 3600; // Default: 1 hour
		}
	}
}

// Singleton instance
export const jwtService = new JWTService();
