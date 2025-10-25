import { MongoClient, Db, type Collection, type Document } from 'mongodb';
import { MONGODB_URL, MONGODB_DB } from '$env/static/private';

class MongoDB {
	private client: MongoClient | null = null;
	private db: Db | null = null;
	private connecting: Promise<void> | null = null;

	async connect(): Promise<void> {
		if (this.db) return;

		if (this.connecting) {
			await this.connecting;
			return;
		}

		this.connecting = (async () => {
			try {
				this.client = new MongoClient(MONGODB_URL, {
					maxPoolSize: 10,
					minPoolSize: 2,
					retryWrites: true,
					retryReads: true
				});

				await this.client.connect();
				this.db = this.client.db(MONGODB_DB);

				console.log('✅ Connected to MongoDB:', MONGODB_DB);

				// Test connection
				await this.db.admin().ping();
			} catch (error) {
				console.error('❌ MongoDB connection error:', error);
				throw error;
			}
		})();

		await this.connecting;
	}

	getDb(): Db {
		if (!this.db) {
			throw new Error('Database not connected. Call connect() first.');
		}
		return this.db;
	}

	collection<T extends Document = Document>(name: string): Collection<T> {
		return this.getDb().collection<T>(name);
	}

	async close(): Promise<void> {
		if (this.client) {
			await this.client.close();
			this.client = null;
			this.db = null;
			console.log('✅ MongoDB connection closed');
		}
	}

	async healthCheck(): Promise<boolean> {
		try {
			if (!this.db) return false;
			await this.db.admin().ping();
			return true;
		} catch {
			return false;
		}
	}
}

// Singleton instance
export const mongodb = new MongoDB();

// Initialize connection on module load
mongodb.connect().catch((error) => {
	console.error('Failed to initialize MongoDB connection:', error);
});

// Export convenience method
export const db = () => mongodb.getDb();
