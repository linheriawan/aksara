// User & Authentication Types
export interface User {
	id: string;
	email: string;
	name: string;
	password?: string; // Optional for responses (excluded after auth)
	roles: string[];
	active: boolean;
	organizationId?: string;
	createdAt: Date;
	updatedAt: Date;
	lastLoginAt?: Date;
}

export interface Role {
	id: string;
	name: string;
	description: string;
	permissions: Permission[];
	createdAt: Date;
}

export interface Permission {
	resource: string; // e.g., "objects", "apis", "users"
	action: string; // e.g., "read", "write", "delete", "publish"
	conditions?: Condition[];
}

export interface Condition {
	field: string;
	operator: 'equals' | 'not_equals' | 'in' | 'not_in';
	value: any;
}

// Session Types
export interface Session {
	sessionId: string;
	userId: string;
	status: 'active' | 'inactive';
	createdAt: Date;
	lastActivityAt: Date;
	endedAt?: Date;
}

// Datasource Types
export interface Datasource {
	id: string;
	name: string;
	type: 'mysql' | 'postgresql' | 'mongodb' | 'rest_api';
	connection: DatabaseConnection | APIConnection;
	status: 'active' | 'inactive' | 'error';
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	lastTestedAt?: Date;
}

export interface DatabaseConnection {
	host: string;
	port: number;
	database: string;
	username: string;
	password: string; // Encrypted
	ssl?: boolean;
	connectionString?: string;
}

export interface APIConnection {
	baseUrl: string;
	authType: 'none' | 'bearer' | 'api_key' | 'oauth2';
	authConfig?: Record<string, any>;
	headers?: Record<string, string>;
}

// Object Definition Types
export interface ObjectDefinition {
	id: string;
	name: string;
	description?: string;
	datasourceId: string;
	mappingType: 'single_table' | 'multi_table' | 'api_endpoint';
	fields: FieldDefinition[];
	mapping: ObjectMapping;
	validationRules?: ValidationRule[];
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface FieldDefinition {
	name: string;
	type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
	required: boolean;
	unique?: boolean;
	defaultValue?: any;
	validation?: FieldValidation;
}

export interface FieldValidation {
	min?: number;
	max?: number;
	pattern?: string;
	enum?: any[];
	custom?: string; // Custom validation function
}

export interface ObjectMapping {
	type: 'single_table' | 'multi_table' | 'api_endpoint';
	config: SingleTableMapping | MultiTableMapping | APIEndpointMapping;
}

export interface SingleTableMapping {
	tableName: string;
	fieldMappings: Record<string, string>; // objectField -> tableColumn
}

export interface MultiTableMapping {
	mainTable: string;
	joins: TableJoin[];
	fieldMappings: Record<string, TableFieldMapping>;
}

export interface TableJoin {
	table: string;
	type: 'INNER' | 'LEFT' | 'RIGHT';
	on: JoinCondition;
}

export interface JoinCondition {
	leftTable: string;
	leftField: string;
	rightTable: string;
	rightField: string;
}

export interface TableFieldMapping {
	table: string;
	column: string;
	transformation?: string;
}

export interface APIEndpointMapping {
	endpoint: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	fieldMappings: Record<string, string>;
	responseMapping: string; // JSONPath or similar
}

export interface ValidationRule {
	field: string;
	type: 'required' | 'unique' | 'pattern' | 'custom';
	config: any;
	message: string;
}

// Published API Types
export interface PublishedAPI {
	id: string;
	objectId: string;
	name: string;
	description?: string;
	protocol: 'rest' | 'grpc' | 'websocket' | 'mqtt' | 'soap' | 'mq' | 'iso8583' | 'fix';
	endpoints: APIEndpoint[];
	security: APISecurity;
	status: 'active' | 'inactive' | 'deprecated';
	version: string;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	deprecationDate?: Date;
	sunsetDate?: Date;
}

export interface APIEndpoint {
	name: string;
	method: string;
	path: string;
	operation: 'list' | 'get' | 'create' | 'update' | 'delete' | 'custom';
	customHandler?: string;
}

export interface APISecurity {
	authentication: boolean;
	authorization: boolean;
	rateLimit?: RateLimit;
	ipWhitelist?: string[];
	cors?: CORSConfig;
}

export interface RateLimit {
	enabled: boolean;
	requests: number;
	period: number; // in seconds
}

export interface CORSConfig {
	enabled: boolean;
	origins: string[];
	methods: string[];
	credentials: boolean;
}

// Published UI Types
export interface PublishedUI {
	id: string;
	objectId: string;
	uiType: 'form' | 'datatable' | 'crud' | 'detail';
	routes: UIRoutes;
	menu: MenuConfig;
	breadcrumbs: BreadcrumbConfig;
	page: PageConfig;
	status: 'active' | 'inactive';
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface UIRoutes {
	basePath: string;
	pattern: 'standard' | 'custom';
	list?: string;
	create?: string;
	detail?: string;
	edit?: string;
	delete?: string;
	customRoutes?: Record<string, string>;
}

export interface MenuConfig {
	enabled: boolean;
	label: string;
	icon?: string;
	parentMenuId?: string;
	order?: number;
	badge?: MenuBadge;
	roles?: string[];
}

export interface MenuBadge {
	type: 'count' | 'text' | 'dot';
	value?: string | number;
	color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
	pulse?: boolean;
}

export interface BreadcrumbConfig {
	enabled: boolean;
	homeLabel?: string;
	separator?: string;
	showObjectName?: boolean;
}

export interface PageConfig {
	title?: string;
	description?: string;
	layout?: 'default' | 'fullwidth' | 'sidebar';
}

// Audit Log Types
export interface AuditLog {
	id: string;
	timestamp: Date;
	userId?: string;
	serviceId?: string;
	ipAddress: string;
	userAgent?: string;
	action: string;
	resource: string;
	resourceId?: string;
	method?: string;
	endpoint?: string;
	status: 'success' | 'failure';
	statusCode?: number;
	errorMessage?: string;
	changes?: {
		before?: any;
		after?: any;
	};
	metadata?: Record<string, any>;
	sessionId?: string;
	requestId: string;
}
