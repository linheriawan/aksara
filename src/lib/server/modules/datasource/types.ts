import type { Datasource, DatabaseConnection, APIConnection } from '$lib/types';

export interface ConnectionTestResult {
	success: boolean;
	message: string;
	details?: {
		host?: string;
		database?: string;
		version?: string;
		responseTime?: number;
	};
	error?: string;
}

export interface SchemaInfo {
	tables: TableInfo[];
	views?: ViewInfo[];
}

export interface TableInfo {
	name: string;
	schema?: string;
	columns: ColumnInfo[];
	primaryKeys: string[];
	foreignKeys?: ForeignKeyInfo[];
	indexes?: IndexInfo[];
}

export interface ColumnInfo {
	name: string;
	type: string;
	nullable: boolean;
	defaultValue?: any;
	maxLength?: number;
	precision?: number;
	scale?: number;
	isPrimaryKey?: boolean;
	isForeignKey?: boolean;
	isUnique?: boolean;
}

export interface ViewInfo {
	name: string;
	schema?: string;
	definition: string;
}

export interface ForeignKeyInfo {
	name: string;
	column: string;
	referencedTable: string;
	referencedColumn: string;
}

export interface IndexInfo {
	name: string;
	columns: string[];
	unique: boolean;
}

export interface DatabaseConnector {
	testConnection(): Promise<ConnectionTestResult>;
	discoverSchema(): Promise<SchemaInfo>;
	executeQuery(query: string, params?: any[]): Promise<any[]>;
	listDatabases(): Promise<string[]>;
	close(): Promise<void>;
}

export interface APIConnectorConfig {
	baseUrl: string;
	authType: 'none' | 'bearer' | 'api_key' | 'oauth2';
	authConfig?: {
		token?: string;
		apiKey?: string;
		keyName?: string;
		clientId?: string;
		clientSecret?: string;
	};
	headers?: Record<string, string>;
}

export interface APIEndpointInfo {
	path: string;
	method: string;
	description?: string;
	parameters?: APIParameterInfo[];
	responseSchema?: any;
}

export interface APIParameterInfo {
	name: string;
	in: 'query' | 'path' | 'header' | 'body';
	required: boolean;
	type: string;
	description?: string;
}
