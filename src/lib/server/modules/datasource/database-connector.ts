import mysql from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import { MongoClient } from 'mongodb';
import type {
	DatabaseConnector,
	ConnectionTestResult,
	SchemaInfo,
	TableInfo,
	ColumnInfo
} from './types';
import type { DatabaseConnection } from '$lib/types';

export class MySQLConnector implements DatabaseConnector {
	private connection: mysql.Connection | null = null;
	private config: DatabaseConnection;

	constructor(config: DatabaseConnection) {
		this.config = config;
	}

	async testConnection(): Promise<ConnectionTestResult> {
		const start = Date.now();
		try {
			const conn = await mysql.createConnection({
				host: this.config.host,
				port: this.config.port,
				user: this.config.username,
				password: this.config.password,
				database: this.config.database,
				ssl: this.config.ssl ? {} : undefined
			});

			const [rows] = await conn.query('SELECT VERSION() as version');
			const responseTime = Date.now() - start;

			await conn.end();

			return {
				success: true,
				message: 'Successfully connected to MySQL database',
				details: {
					host: this.config.host,
					database: this.config.database,
					version: (rows as any)[0].version,
					responseTime
				}
			};
		} catch (error: any) {
			return {
				success: false,
				message: 'Failed to connect to MySQL database',
				error: error.message
			};
		}
	}

	async discoverSchema(): Promise<SchemaInfo> {
		await this.connect();

		// Get all tables
		const [tables] = await this.connection!.query(
			`SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
			[this.config.database]
		);

		const tableInfos: TableInfo[] = [];

		for (const table of tables as any[]) {
			const tableName = table.TABLE_NAME;

			// Get columns
			const [columns] = await this.connection!.query(
				`SELECT
          COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT,
          CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE,
          COLUMN_KEY
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION`,
				[this.config.database, tableName]
			);

			const columnInfos: ColumnInfo[] = (columns as any[]).map((col) => ({
				name: col.COLUMN_NAME,
				type: col.DATA_TYPE,
				nullable: col.IS_NULLABLE === 'YES',
				defaultValue: col.COLUMN_DEFAULT,
				maxLength: col.CHARACTER_MAXIMUM_LENGTH,
				precision: col.NUMERIC_PRECISION,
				scale: col.NUMERIC_SCALE,
				isPrimaryKey: col.COLUMN_KEY === 'PRI',
				isUnique: col.COLUMN_KEY === 'UNI'
			}));

			const primaryKeys = columnInfos.filter((c) => c.isPrimaryKey).map((c) => c.name);

			tableInfos.push({
				name: tableName,
				schema: this.config.database,
				columns: columnInfos,
				primaryKeys
			});
		}

		return { tables: tableInfos };
	}

	async executeQuery(query: string, params?: any[]): Promise<any[]> {
		await this.connect();
		const [rows] = await this.connection!.query(query, params);
		return rows as any[];
	}

	async listDatabases(): Promise<string[]> {
		// Create a temporary connection without specifying a database
		const tempConn = await mysql.createConnection({
			host: this.config.host,
			port: this.config.port,
			user: this.config.username,
			password: this.config.password,
			ssl: this.config.ssl ? {} : undefined
		});

		try {
			const [rows] = await tempConn.query(
				'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME NOT IN (?, ?, ?, ?)',
				['information_schema', 'mysql', 'performance_schema', 'sys']
			);
			return (rows as any[]).map((row) => row.SCHEMA_NAME);
		} finally {
			await tempConn.end();
		}
	}

	async close(): Promise<void> {
		if (this.connection) {
			await this.connection.end();
			this.connection = null;
		}
	}

	private async connect(): Promise<void> {
		if (!this.connection) {
			this.connection = await mysql.createConnection({
				host: this.config.host,
				port: this.config.port,
				user: this.config.username,
				password: this.config.password,
				database: this.config.database,
				ssl: this.config.ssl ? {} : undefined
			});
		}
	}
}

export class PostgreSQLConnector implements DatabaseConnector {
	private pool: PgPool | null = null;
	private config: DatabaseConnection;

	constructor(config: DatabaseConnection) {
		this.config = config;
	}

	async testConnection(): Promise<ConnectionTestResult> {
		const start = Date.now();
		try {
			const pool = new PgPool({
				host: this.config.host,
				port: this.config.port,
				user: this.config.username,
				password: this.config.password,
				database: this.config.database,
				ssl: this.config.ssl ? { rejectUnauthorized: false } : false
			});

			const client = await pool.connect();
			const result = await client.query('SELECT version()');
			const responseTime = Date.now() - start;

			client.release();
			await pool.end();

			return {
				success: true,
				message: 'Successfully connected to PostgreSQL database',
				details: {
					host: this.config.host,
					database: this.config.database,
					version: result.rows[0].version,
					responseTime
				}
			};
		} catch (error: any) {
			return {
				success: false,
				message: 'Failed to connect to PostgreSQL database',
				error: error.message
			};
		}
	}

	async discoverSchema(): Promise<SchemaInfo> {
		await this.connect();

		// Get all tables
		const tablesResult = await this.pool!.query(
			`SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
		);

		const tableInfos: TableInfo[] = [];

		for (const table of tablesResult.rows) {
			const tableName = table.table_name;

			// Get columns
			const columnsResult = await this.pool!.query(
				`SELECT
          column_name, data_type, is_nullable, column_default,
          character_maximum_length, numeric_precision, numeric_scale
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position`,
				[tableName]
			);

			// Get primary keys
			const pkResult = await this.pool!.query(
				`SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary`,
				[tableName]
			);

			const primaryKeys = pkResult.rows.map((row) => row.attname);

			const columnInfos: ColumnInfo[] = columnsResult.rows.map((col) => ({
				name: col.column_name,
				type: col.data_type,
				nullable: col.is_nullable === 'YES',
				defaultValue: col.column_default,
				maxLength: col.character_maximum_length,
				precision: col.numeric_precision,
				scale: col.numeric_scale,
				isPrimaryKey: primaryKeys.includes(col.column_name)
			}));

			tableInfos.push({
				name: tableName,
				schema: 'public',
				columns: columnInfos,
				primaryKeys
			});
		}

		return { tables: tableInfos };
	}

	async executeQuery(query: string, params?: any[]): Promise<any[]> {
		await this.connect();
		const result = await this.pool!.query(query, params);
		return result.rows;
	}

	async listDatabases(): Promise<string[]> {
		// Create a temporary connection to 'postgres' database to list all databases
		const tempPool = new PgPool({
			host: this.config.host,
			port: this.config.port,
			user: this.config.username,
			password: this.config.password,
			database: 'postgres', // Connect to default postgres database
			ssl: this.config.ssl ? { rejectUnauthorized: false } : false
		});

		try {
			const result = await tempPool.query(
				`SELECT datname FROM pg_database
         WHERE datistemplate = false AND datname NOT IN ('postgres', 'template0', 'template1')`
			);
			return result.rows.map((row) => row.datname);
		} finally {
			await tempPool.end();
		}
	}

	async close(): Promise<void> {
		if (this.pool) {
			await this.pool.end();
			this.pool = null;
		}
	}

	private async connect(): Promise<void> {
		if (!this.pool) {
			this.pool = new PgPool({
				host: this.config.host,
				port: this.config.port,
				user: this.config.username,
				password: this.config.password,
				database: this.config.database,
				ssl: this.config.ssl ? { rejectUnauthorized: false } : false
			});
		}
	}
}

export class MongoDBConnector implements DatabaseConnector {
	private client: MongoClient | null = null;
	private config: DatabaseConnection;

	constructor(config: DatabaseConnection) {
		this.config = config;
	}

	async testConnection(): Promise<ConnectionTestResult> {
		const start = Date.now();
		try {
			const connectionString =
				this.config.connectionString ||
				`mongodb://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;

			const client = new MongoClient(connectionString);
			await client.connect();

			const db = client.db(this.config.database);
			await db.admin().ping();
			const responseTime = Date.now() - start;

			await client.close();

			return {
				success: true,
				message: 'Successfully connected to MongoDB database',
				details: {
					host: this.config.host,
					database: this.config.database,
					responseTime
				}
			};
		} catch (error: any) {
			return {
				success: false,
				message: 'Failed to connect to MongoDB database',
				error: error.message
			};
		}
	}

	async discoverSchema(): Promise<SchemaInfo> {
		await this.connect();

		const db = this.client!.db(this.config.database);
		const collections = await db.listCollections().toArray();

		const tableInfos: TableInfo[] = [];

		for (const collection of collections) {
			// Sample first document to infer schema
			const sample = await db.collection(collection.name).findOne();

			const columnInfos: ColumnInfo[] = [];
			if (sample) {
				Object.keys(sample).forEach((key) => {
					columnInfos.push({
						name: key,
						type: typeof sample[key],
						nullable: true,
						isPrimaryKey: key === '_id'
					});
				});
			}

			tableInfos.push({
				name: collection.name,
				columns: columnInfos,
				primaryKeys: ['_id']
			});
		}

		return { tables: tableInfos };
	}

	async executeQuery(query: string, params?: any[]): Promise<any[]> {
		await this.connect();
		// MongoDB uses find queries, not SQL
		// This is a simplified implementation
		throw new Error('MongoDB uses find() not SQL queries');
	}

	async listDatabases(): Promise<string[]> {
		await this.connect();
		const adminDb = this.client!.db().admin();
		const result = await adminDb.listDatabases();
		// Filter out system databases
		return result.databases
			.filter((db) => !['admin', 'local', 'config'].includes(db.name))
			.map((db) => db.name);
	}

	async close(): Promise<void> {
		if (this.client) {
			await this.client.close();
			this.client = null;
		}
	}

	private async connect(): Promise<void> {
		if (!this.client) {
			const connectionString =
				this.config.connectionString ||
				`mongodb://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;

			this.client = new MongoClient(connectionString);
			await this.client.connect();
		}
	}
}

export function createDatabaseConnector(
	type: 'mysql' | 'postgresql' | 'mongodb',
	config: DatabaseConnection
): DatabaseConnector {
	switch (type) {
		case 'mysql':
			return new MySQLConnector(config);
		case 'postgresql':
			return new PostgreSQLConnector(config);
		case 'mongodb':
			return new MongoDBConnector(config);
		default:
			throw new Error(`Unsupported database type: ${type}`);
	}
}
