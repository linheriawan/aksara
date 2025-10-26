import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { CRYPTO_SECRET } from '$env/static/private';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive encryption key from secret using scrypt
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
	return scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Encrypt sensitive data
 * Returns base64 encoded string containing: salt + iv + authTag + encryptedData
 */
export function encrypt(plaintext: string): string {
	// Generate random salt and IV
	const salt = randomBytes(SALT_LENGTH);
	const iv = randomBytes(IV_LENGTH);

	// Derive key from secret
	const key = deriveKey(CRYPTO_SECRET, salt);

	// Create cipher and encrypt
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

	// Get authentication tag
	const authTag = cipher.getAuthTag();

	// Combine all parts: salt + iv + authTag + encrypted data
	const result = Buffer.concat([salt, iv, authTag, encrypted]);

	// Return as base64
	return result.toString('base64');
}

/**
 * Decrypt encrypted data
 * Input should be base64 encoded string from encrypt()
 */
export function decrypt(ciphertext: string): string {
	// Decode from base64
	const data = Buffer.from(ciphertext, 'base64');

	// Extract components
	const salt = data.subarray(0, SALT_LENGTH);
	const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
	const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
	const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

	// Derive key from secret
	const key = deriveKey(CRYPTO_SECRET, salt);

	// Create decipher and decrypt
	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

	return decrypted.toString('utf8');
}

/**
 * Encrypt database connection credentials
 */
export function encryptConnectionCredentials(connection: any): any {
	const encrypted = { ...connection };

	// Encrypt password if present
	if (connection.password) {
		encrypted.password = encrypt(connection.password);
	}

	// Encrypt connection string if present (MongoDB)
	if (connection.connectionString) {
		encrypted.connectionString = encrypt(connection.connectionString);
	}

	// Encrypt API tokens if present
	if (connection.authConfig?.token) {
		encrypted.authConfig = {
			...connection.authConfig,
			token: encrypt(connection.authConfig.token)
		};
	}

	if (connection.authConfig?.apiKey) {
		encrypted.authConfig = {
			...encrypted.authConfig,
			apiKey: encrypt(connection.authConfig.apiKey)
		};
	}

	if (connection.authConfig?.clientSecret) {
		encrypted.authConfig = {
			...encrypted.authConfig,
			clientSecret: encrypt(connection.authConfig.clientSecret)
		};
	}

	return encrypted;
}

/**
 * Decrypt database connection credentials
 */
export function decryptConnectionCredentials(connection: any): any {
	const decrypted = { ...connection };

	try {
		// Decrypt password if present
		if (connection.password) {
			decrypted.password = decrypt(connection.password);
		}

		// Decrypt connection string if present (MongoDB)
		if (connection.connectionString) {
			decrypted.connectionString = decrypt(connection.connectionString);
		}

		// Decrypt API tokens if present
		if (connection.authConfig?.token) {
			decrypted.authConfig = {
				...connection.authConfig,
				token: decrypt(connection.authConfig.token)
			};
		}

		if (connection.authConfig?.apiKey) {
			decrypted.authConfig = {
				...decrypted.authConfig,
				apiKey: decrypt(connection.authConfig.apiKey)
			};
		}

		if (connection.authConfig?.clientSecret) {
			decrypted.authConfig = {
				...decrypted.authConfig,
				clientSecret: decrypt(connection.authConfig.clientSecret)
			};
		}
	} catch (error) {
		throw new Error('Failed to decrypt connection credentials');
	}

	return decrypted;
}
