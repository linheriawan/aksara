import { mongodb } from './database/mongodb';
import { authService } from './security/auth';
import { rbacService } from './security/rbac';

/**
 * Initialize the platform database with default data
 */
export async function initializePlatform(): Promise<void> {
	console.log('🚀 Initializing Aksara Platform...');

	try {
		// Ensure MongoDB is connected
		await mongodb.connect();

		// Initialize default roles
		await rbacService.initializeDefaultRoles();

		// Create default admin user
		await authService.createDefaultAdmin();

		// Create indexes for better performance
		await createIndexes();

		console.log('✅ Platform initialization complete!');
	} catch (error) {
		console.error('❌ Platform initialization failed:', error);
		throw error;
	}
}

/**
 * Create database indexes for better performance
 */
async function createIndexes(): Promise<void> {
	const db = mongodb.getDb();

	// Users collection
	await db.collection('users').createIndex({ email: 1 }, { unique: true });
	await db.collection('users').createIndex({ id: 1 }, { unique: true });

	// Sessions collection
	await db.collection('sessions').createIndex({ sessionId: 1 }, { unique: true });
	await db.collection('sessions').createIndex({ userId: 1 });
	await db.collection('sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days

	// Roles collection
	await db.collection('roles').createIndex({ name: 1 }, { unique: true });

	// Datasources collection
	await db.collection('datasources').createIndex({ id: 1 }, { unique: true });
	await db.collection('datasources').createIndex({ createdBy: 1 });

	// Objects collection
	await db.collection('objects').createIndex({ id: 1 }, { unique: true });
	await db.collection('objects').createIndex({ datasourceId: 1 });
	await db.collection('objects').createIndex({ createdBy: 1 });

	// Published APIs collection
	await db.collection('published_apis').createIndex({ id: 1 }, { unique: true });
	await db.collection('published_apis').createIndex({ objectId: 1 });
	await db.collection('published_apis').createIndex({ status: 1 });

	// Published UIs collection
	await db.collection('published_uis').createIndex({ id: 1 }, { unique: true });
	await db.collection('published_uis').createIndex({ objectId: 1 });
	await db.collection('published_uis').createIndex({ status: 1 });

	// Audit logs collection
	await db.collection('audit_logs').createIndex({ timestamp: -1 });
	await db.collection('audit_logs').createIndex({ userId: 1 });
	await db.collection('audit_logs').createIndex({ resource: 1 });
	await db.collection('audit_logs').createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

	console.log('✅ Database indexes created');
}
