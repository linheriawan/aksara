/**
 * Query Builder for Business Objects
 *
 * Builds SQL queries for object CRUD operations with JOIN support
 */

import type { BusinessObject, TableJoin, QueryPlan, ObjectData } from './types';
import { FieldMapper, type FieldMappingResult } from './field-mapper';

export interface QueryFilter {
	field: string;
	operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'is_null' | 'is_not_null';
	value?: any;
}

export interface QueryOptions {
	filters?: QueryFilter[];
	sort?: { field: string; direction: 'ASC' | 'DESC' }[];
	limit?: number;
	offset?: number;
}

export class QueryBuilder {
	private fieldMapper: FieldMapper;

	constructor() {
		this.fieldMapper = new FieldMapper();
	}

	/**
	 * Build SELECT query for fetching objects
	 */
	buildSelectQuery(objectDef: BusinessObject, options?: QueryOptions): QueryPlan {
		const mappingResult = this.fieldMapper.mapFields(objectDef);
		const params: any[] = [];

		// Build SELECT clause
		const selectClause = this.fieldMapper.buildSelectClause(
			mappingResult,
			this.getTableAlias(objectDef.primaryTable)
		);

		// Build FROM clause with alias
		const primaryAlias = this.getTableAlias(objectDef.primaryTable);
		let fromClause = `${objectDef.primaryTable} AS ${primaryAlias}`;

		// Build JOIN clauses
		const joinClauses: string[] = [];
		if (objectDef.joins && objectDef.joins.length > 0) {
			for (const join of objectDef.joins) {
				const joinClause = this.buildJoinClause(join, objectDef.primaryTable);
				joinClauses.push(joinClause);
			}
		}

		// Build WHERE clause
		let whereClause = '';
		if (options?.filters && options.filters.length > 0) {
			const conditions = options.filters.map((filter) => {
				return this.buildFilterCondition(filter, primaryAlias, params);
			});
			whereClause = `WHERE ${conditions.join(' AND ')}`;
		}

		// Build ORDER BY clause
		let orderByClause = '';
		if (options?.sort && options.sort.length > 0) {
			const sortParts = options.sort.map((s) => `${primaryAlias}.${s.field} ${s.direction}`);
			orderByClause = `ORDER BY ${sortParts.join(', ')}`;
		}

		// Build LIMIT/OFFSET clause
		let limitClause = '';
		if (options?.limit) {
			limitClause = `LIMIT ${options.limit}`;
			if (options.offset) {
				limitClause += ` OFFSET ${options.offset}`;
			}
		}

		// Assemble query
		const sqlParts = [
			`SELECT ${selectClause}`,
			`FROM ${fromClause}`,
			...joinClauses,
			whereClause,
			orderByClause,
			limitClause
		].filter((part) => part.length > 0);

		const sql = sqlParts.join('\n');

		return {
			sql,
			params,
			datasources: [
				{
					id: objectDef.primaryDatasourceId,
					tables: this.fieldMapper.getRequiredTables(mappingResult)
				}
			]
		};
	}

	/**
	 * Build SELECT query to get single object by ID
	 */
	buildSelectByIdQuery(objectDef: BusinessObject, id: any): QueryPlan {
		const pkFields = this.fieldMapper.getPrimaryKeyFields(objectDef);
		const primaryAlias = this.getTableAlias(objectDef.primaryTable);

		// Build filters for primary key
		const filters: QueryFilter[] = pkFields.map((field) => ({
			field,
			operator: 'eq',
			value: id
		}));

		return this.buildSelectQuery(objectDef, { filters, limit: 1 });
	}

	/**
	 * Build INSERT query
	 */
	buildInsertQuery(objectDef: BusinessObject, data: ObjectData): QueryPlan {
		const columnData = this.fieldMapper.mapDataToColumns(data, objectDef);
		const params: any[] = [];

		// For now, only support single-table inserts (primary table)
		const tableData = columnData[objectDef.primaryTable];
		if (!tableData || Object.keys(tableData).length === 0) {
			throw new Error('No data to insert');
		}

		const columns = Object.keys(tableData);
		const values = Object.values(tableData);

		// Build placeholders
		const placeholders = values.map((value) => {
			params.push(value);
			return '?';
		});

		const sql = `INSERT INTO ${objectDef.primaryTable} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;

		return {
			sql,
			params,
			datasources: [
				{
					id: objectDef.primaryDatasourceId,
					tables: [objectDef.primaryTable]
				}
			]
		};
	}

	/**
	 * Build UPDATE query
	 */
	buildUpdateQuery(objectDef: BusinessObject, id: any, data: ObjectData): QueryPlan {
		const columnData = this.fieldMapper.mapDataToColumns(data, objectDef);
		const params: any[] = [];

		// For now, only support single-table updates (primary table)
		const tableData = columnData[objectDef.primaryTable];
		if (!tableData || Object.keys(tableData).length === 0) {
			throw new Error('No data to update');
		}

		// Build SET clause
		const setParts = Object.entries(tableData).map(([column, value]) => {
			params.push(value);
			return `${column} = ?`;
		});

		// Build WHERE clause for primary key
		const pkFields = this.fieldMapper.getPrimaryKeyFields(objectDef);
		const whereParts = pkFields.map((field) => {
			params.push(id);
			return `${field} = ?`;
		});

		const sql = `UPDATE ${objectDef.primaryTable} SET ${setParts.join(', ')} WHERE ${whereParts.join(' AND ')}`;

		return {
			sql,
			params,
			datasources: [
				{
					id: objectDef.primaryDatasourceId,
					tables: [objectDef.primaryTable]
				}
			]
		};
	}

	/**
	 * Build DELETE query
	 */
	buildDeleteQuery(objectDef: BusinessObject, id: any): QueryPlan {
		const params: any[] = [];

		// Build WHERE clause for primary key
		const pkFields = this.fieldMapper.getPrimaryKeyFields(objectDef);
		const whereParts = pkFields.map((field) => {
			params.push(id);
			return `${field} = ?`;
		});

		const sql = `DELETE FROM ${objectDef.primaryTable} WHERE ${whereParts.join(' AND ')}`;

		return {
			sql,
			params,
			datasources: [
				{
					id: objectDef.primaryDatasourceId,
					tables: [objectDef.primaryTable]
				}
			]
		};
	}

	/**
	 * Build JOIN clause
	 */
	private buildJoinClause(join: TableJoin, primaryTable: string): string {
		const joinType = join.joinType || 'INNER';
		const joinTable = join.alias || join.table;
		const leftTable = join.on.leftTable || this.getTableAlias(primaryTable);

		return `${joinType} JOIN ${join.table} AS ${joinTable} ON ${leftTable}.${join.on.leftColumn} = ${joinTable}.${join.on.rightColumn}`;
	}

	/**
	 * Build filter condition
	 */
	private buildFilterCondition(filter: QueryFilter, tableAlias: string, params: any[]): string {
		const field = `${tableAlias}.${filter.field}`;

		switch (filter.operator) {
			case 'eq':
				params.push(filter.value);
				return `${field} = ?`;

			case 'ne':
				params.push(filter.value);
				return `${field} != ?`;

			case 'gt':
				params.push(filter.value);
				return `${field} > ?`;

			case 'gte':
				params.push(filter.value);
				return `${field} >= ?`;

			case 'lt':
				params.push(filter.value);
				return `${field} < ?`;

			case 'lte':
				params.push(filter.value);
				return `${field} <= ?`;

			case 'like':
				params.push(filter.value);
				return `${field} LIKE ?`;

			case 'in':
				if (!Array.isArray(filter.value)) {
					throw new Error('IN operator requires array value');
				}
				const placeholders = filter.value.map((v) => {
					params.push(v);
					return '?';
				});
				return `${field} IN (${placeholders.join(', ')})`;

			case 'is_null':
				return `${field} IS NULL`;

			case 'is_not_null':
				return `${field} IS NOT NULL`;

			default:
				throw new Error(`Unsupported operator: ${filter.operator}`);
		}
	}

	/**
	 * Get table alias (use first letter + sequential number if needed)
	 */
	private getTableAlias(tableName: string): string {
		// Simple alias: t1, t2, etc. or use first letter
		return `t_${tableName}`;
	}

	/**
	 * Build COUNT query
	 */
	buildCountQuery(objectDef: BusinessObject, options?: QueryOptions): QueryPlan {
		const params: any[] = [];
		const primaryAlias = this.getTableAlias(objectDef.primaryTable);

		// Build FROM clause
		let fromClause = `${objectDef.primaryTable} AS ${primaryAlias}`;

		// Build JOIN clauses if needed for filters
		const joinClauses: string[] = [];
		if (objectDef.joins && objectDef.joins.length > 0) {
			for (const join of objectDef.joins) {
				const joinClause = this.buildJoinClause(join, objectDef.primaryTable);
				joinClauses.push(joinClause);
			}
		}

		// Build WHERE clause
		let whereClause = '';
		if (options?.filters && options.filters.length > 0) {
			const conditions = options.filters.map((filter) => {
				return this.buildFilterCondition(filter, primaryAlias, params);
			});
			whereClause = `WHERE ${conditions.join(' AND ')}`;
		}

		// Assemble query
		const sqlParts = [
			`SELECT COUNT(*) as count`,
			`FROM ${fromClause}`,
			...joinClauses,
			whereClause
		].filter((part) => part.length > 0);

		const sql = sqlParts.join('\n');

		return {
			sql,
			params,
			datasources: [
				{
					id: objectDef.primaryDatasourceId,
					tables: [objectDef.primaryTable]
				}
			]
		};
	}

	/**
	 * Convert query plan to PostgreSQL syntax (replace ? with $1, $2, etc.)
	 */
	toPostgreSQLSyntax(queryPlan: QueryPlan): QueryPlan {
		let sql = queryPlan.sql;
		let paramIndex = 1;

		// Replace ? with $1, $2, etc.
		sql = sql.replace(/\?/g, () => `$${paramIndex++}`);

		return {
			...queryPlan,
			sql
		};
	}

	/**
	 * Validate query plan
	 */
	validateQueryPlan(queryPlan: QueryPlan): string[] {
		const errors: string[] = [];

		if (!queryPlan.sql || queryPlan.sql.trim().length === 0) {
			errors.push('SQL query is empty');
		}

		if (!queryPlan.datasources || queryPlan.datasources.length === 0) {
			errors.push('No datasources specified');
		}

		// Check parameter count matches
		const placeholderCount = (queryPlan.sql.match(/\?/g) || []).length;
		const dollarSignCount = (queryPlan.sql.match(/\$\d+/g) || []).length;
		const expectedParams = Math.max(placeholderCount, dollarSignCount);

		if (queryPlan.params.length !== expectedParams) {
			errors.push(
				`Parameter count mismatch: expected ${expectedParams}, got ${queryPlan.params.length}`
			);
		}

		return errors;
	}
}

export const queryBuilder = new QueryBuilder();
