#!/usr/bin/env bun
/**
 * Database initialization script
 * Run with: bun run db:init
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(import.meta.dir, '../.env') });

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URL = process.env.MONGODB_URL!;
const MONGODB_DB = process.env.MONGODB_DB!;

async function main() {
	console.log('🚀 Starting database initialization...\n');

	if (!MONGODB_URL || !MONGODB_DB) {
		console.error('❌ Missing MONGODB_URL or MONGODB_DB in .env file');
		process.exit(1);
	}

	let client: MongoClient | null = null;

	try {
		// Connect to MongoDB
		console.log('Connecting to MongoDB...');
		client = new MongoClient(MONGODB_URL);
		await client.connect();
		const db = client.db(MONGODB_DB);
		console.log('✅ Connected to MongoDB:', MONGODB_DB);

		// Initialize default roles
		console.log('\nInitializing default roles...');
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
			const existing = await db.collection('roles').findOne({ name: role.name });
			if (!existing) {
				await db.collection('roles').insertOne(role);
				console.log(`✅ Created role: ${role.name}`);
			} else {
				console.log(`⏭️  Role already exists: ${role.name}`);
			}
		}

		// Create default admin user
		console.log('\nCreating default admin user...');
		const existingAdmin = await db.collection('users').findOne({ email: 'admin@aksara.local' });

		if (!existingAdmin) {
			const hashedPassword = await bcrypt.hash('admin123', 10);

			await db.collection('users').insertOne({
				id: 'user_admin_001',
				email: 'admin@aksara.local',
				password: hashedPassword,
				name: 'Administrator',
				roles: ['admin'],
				active: true,
				createdAt: new Date(),
				updatedAt: new Date()
			});
			console.log('✅ Default admin user created');
		} else {
			console.log('⏭️  Admin user already exists');
		}

		// Create indexes
		console.log('\nCreating database indexes...');
		await db.collection('users').createIndex({ email: 1 }, { unique: true });
		await db.collection('users').createIndex({ id: 1 }, { unique: true });
		await db.collection('sessions').createIndex({ sessionId: 1 }, { unique: true });
		await db.collection('sessions').createIndex({ userId: 1 });
		await db
			.collection('sessions')
			.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days
		await db.collection('roles').createIndex({ name: 1 }, { unique: true });
		console.log('✅ Database indexes created');

		console.log('\n✅ Database initialization completed successfully!');
		console.log('\nDefault admin credentials:');
		console.log('  Email: admin@aksara.local');
		console.log('  Password: admin123');
		console.log('\nYou can now start the dev server with: bun run dev');
	} catch (error) {
		console.error('\n❌ Database initialization failed:', error);
		process.exit(1);
	} finally {
		if (client) {
			await client.close();
			console.log('\n✅ MongoDB connection closed');
		}
		process.exit(0);
	}
}

main();
