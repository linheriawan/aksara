/**
 * Types for Object Mapping Module
 */

export type FieldType =
	| 'string'
	| 'number'
	| 'integer'
	| 'boolean'
	| 'date'
	| 'datetime'
	| 'timestamp'
	| 'json'
	| 'array'
	| 'object'
	| 'binary'
	| 'uuid';

export type MappingType = 'direct' | 'computed' | 'transformed' | 'relation';

export type TransformationType =
	| 'uppercase'
	| 'lowercase'
	| 'trim'
	| 'concat'
	| 'split'
	| 'replace'
	| 'regex'
	| 'date_format'
	| 'number_format'
	| 'json_parse'
	| 'json_stringify'
	| 'custom';

export type ValidationType =
	| 'required'
	| 'email'
	| 'url'
	| 'min_length'
	| 'max_length'
	| 'min'
	| 'max'
	| 'pattern'
	| 'enum'
	| 'custom';

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

/**
 * Field definition in a business object
 */
export interface ObjectField {
	name: string;
	type: FieldType;
	required?: boolean;
	defaultValue?: any;
	description?: string;

	// Field mapping configuration
	mapping?: FieldMapping;

	// Validation rules
	validations?: ValidationRule[];

	// Transformations
	transformations?: Transformation[];
}

/**
 * Field mapping configuration
 */
export interface FieldMapping {
	type: MappingType;

	// For direct mapping
	source?: {
		datasourceId: string;
		table: string;
		column: string;
	};

	// For computed fields
	expression?: string; // SQL expression or formula

	// For relations
	relation?: RelationMapping;

	// For transformed fields
	sourceField?: string; // Reference to another field in same object
}

/**
 * Relation mapping (for joining tables)
 */
export interface RelationMapping {
	datasourceId: string;
	table: string;
	joinType: JoinType;
	on: {
		localField: string;
		foreignField: string;
	};
	select?: string[]; // Columns to select from related table
}

/**
 * Validation rule
 */
export interface ValidationRule {
	type: ValidationType;
	value?: any; // For min, max, pattern, enum, etc.
	message?: string;
	customFunction?: string; // JavaScript function as string for custom validation
}

/**
 * Data transformation
 */
export interface Transformation {
	type: TransformationType;
	params?: Record<string, any>;
	customFunction?: string; // JavaScript function as string for custom transformation
}

/**
 * Datasource reference in a business object
 */
export interface DatasourceReference {
	id: string; // Datasource ID
	alias: string; // Alias for referencing in queries (e.g., "main_db", "analytics_db")
	isDefault: boolean; // If true, this is the primary datasource
}

/**
 * Cross-datasource relation configuration
 */
export interface CrossDatasourceRelation {
	name: string; // Relation name
	sourceDatasource: string; // Datasource alias
	sourceTable: string;
	sourceField: string;
	targetDatasource: string; // Datasource alias (can be different datasource)
	targetTable: string;
	targetField: string;
	joinType: JoinType;
	joinStrategy: 'runtime_join' | 'cache' | 'federated'; // How to handle cross-DB joins
}

/**
 * Primary key configuration
 */
export interface PrimaryKeyConfig {
	type: 'auto' | 'single' | 'composite';
	fields: string[]; // e.g., ['id'] or ['store_id', 'txn_id', 'line_item']
}

/**
 * REST API configuration
 */
export interface RestConfig {
	enabled: boolean;
	methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>;

	// Path configuration
	customPath?: string; // Optional. Default: '/api/{objectName}'

	// Safety limits
	maxPageSize: number; // default: 100
	defaultLimit: number; // default: 1000 (when no pagination params)

	// Optional: Filter controls
	filtering?: {
		allowedOperators?: Array<'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'between'>;
		allowedFields?: string[]; // Empty = all visible fields
	};

	// Optional: Sort controls
	sorting?: {
		allowedFields?: string[]; // Empty = all visible fields
		defaultSort?: {
			field: string;
			order: 'asc' | 'desc';
		};
	};
}

/**
 * Publishing configuration for an object
 */
export interface PublishingConfig {
	protocols: {
		rest?: RestConfig;
		graphql?: { enabled: boolean };
		grpc?: { enabled: boolean };
		websocket?: { enabled: boolean };
		mqtt?: { enabled: boolean };
		soap?: { enabled: boolean };
	};
	security: {
		type: 'public' | 'authenticated' | 'role_based';
		allowedRoles?: string[];
	};
	rateLimit: {
		requestsPerMinute: number;
		burstLimit: number;
		ipThrottling: boolean;
	};
	fieldVisibility?: {
		[fieldName: string]: boolean; // true = visible, false = hidden
	};
	primaryKey?: PrimaryKeyConfig; // Primary key configuration
}

/**
 * Direct object mapping (1:1 table mapping)
 */
export interface DirectMapping {
	datasourceId: string;
	table: string;
	// Auto-populated from schema discovery
}

/**
 * Custom object mapping (multi-table JOINs)
 */
export interface CustomMapping {
	datasources: DatasourceReference[];
	fields: ObjectField[];
	joins?: TableJoin[];
	crossDatasourceRelations?: CrossDatasourceRelation[];
	// Keep for backward compatibility
	primaryTable?: string;
	primaryDatasourceId?: string;
}

/**
 * Business Object definition (Phase 3: Multi-Datasource Support)
 */
export interface BusinessObject {
	id?: string;
	name: string; // Unique identifier for the object
	displayName: string;
	description?: string;
	version: number;

	// NEW: Object type
	objectType: 'direct' | 'custom';

	// Field definitions
	fields: ObjectField[];

	// For direct objects (auto-discovered from datasources)
	directMapping?: DirectMapping;

	// For custom objects (manually created with complex mappings)
	customMapping?: CustomMapping;

	// Publishing configuration
	publishing?: PublishingConfig;

	// Status
	status: 'enabled' | 'disabled' | 'broken';
	brokenReason?: string; // e.g., "Source table 'users' no longer exists"

	// Metadata
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	deleted?: boolean;
	deletedAt?: Date;

	// DEPRECATED: Keep for backward compatibility during migration
	datasources?: DatasourceReference[];
	primaryTable?: string;
	joins?: TableJoin[];
	crossDatasourceRelations?: CrossDatasourceRelation[];
	primaryDatasourceId?: string;
}

/**
 * Table join configuration
 */
export interface TableJoin {
	datasourceId: string;
	table: string;
	alias?: string;
	joinType: JoinType;
	on: {
		leftTable: string; // Table alias or primary table
		leftColumn: string;
		rightColumn: string;
	};
}

/**
 * Query builder result
 */
export interface QueryPlan {
	sql: string;
	params: any[];
	datasources: {
		id: string;
		tables: string[];
	}[];
}

/**
 * Object instance data
 */
export interface ObjectData {
	[key: string]: any;
}

/**
 * Object CRUD operation options
 */
export interface ObjectOperationOptions {
	validate?: boolean;
	transform?: boolean;
	userId: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
	valid: boolean;
	errors: {
		field: string;
		message: string;
		rule: string;
	}[];
}

/**
 * Transformation context
 */
export interface TransformContext {
	data: ObjectData;
	objectDef: BusinessObject;
	operation: 'create' | 'update' | 'read';
}

/**
 * Query filter operator
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'between';

/**
 * Query filter
 */
export interface QueryFilter {
	field: string;
	operator: FilterOperator;
	value: any;
}

/**
 * Query sort
 */
export interface QuerySort {
	field: string;
	order: 'asc' | 'desc';
}

/**
 * Query pagination
 */
export interface QueryPagination {
	page?: number;
	limit?: number;
	offset?: number;
}

/**
 * Parsed query options from request
 */
export interface QueryOptions {
	filters?: QueryFilter[];
	sort?: QuerySort[];
	pagination?: QueryPagination;
}

/**
 * API Response format
 */
export interface ApiResponse<T = any> {
	data: T;
	metadata?: {
		total?: number;
		returned?: number;
		page?: number;
		limit?: number;
		totalPages?: number;
		hasNext?: boolean;
		hasPrev?: boolean;
		hasMore?: boolean;
		message?: string;
	};
}

/**
 * Streaming format
 */
export type StreamFormat = 'json' | 'ndjson' | 'csv';
