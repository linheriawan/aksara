/**
 * Query Parser for REST API
 * Parses URL query parameters for filters, pagination, and sorting
 */

import type { QueryOptions, QueryFilter, QuerySort, QueryPagination, FilterOperator } from './types';

/**
 * Parse query parameters from URL
 *
 * Examples:
 * - Filters: ?filter[age][gte]=18&filter[status][eq]=active
 * - Pagination: ?page=2&limit=20
 * - Sorting: ?sort=-created_at,name (DESC created_at, ASC name)
 */
export function parseQueryParams(searchParams: URLSearchParams): QueryOptions {
	return {
		filters: parseFilters(searchParams),
		sort: parseSorting(searchParams),
		pagination: parsePagination(searchParams)
	};
}

/**
 * Parse filter parameters
 *
 * Supported formats:
 * - Simple: ?filter[field]=value (exact match)
 * - Operator: ?filter[field][operator]=value
 * - Multiple values (in): ?filter[field][in]=val1,val2,val3
 * - Between: ?filter[field][between]=min,max
 */
function parseFilters(searchParams: URLSearchParams): QueryFilter[] {
	const filters: QueryFilter[] = [];
	const filterPattern = /^filter\[([^\]]+)\](?:\[([^\]]+)\])?$/;

	for (const [key, value] of searchParams.entries()) {
		const match = key.match(filterPattern);
		if (!match) continue;

		const field = match[1];
		const operator = (match[2] || 'eq') as FilterOperator;

		// Validate operator
		const validOperators: FilterOperator[] = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'like', 'between'];
		if (!validOperators.includes(operator)) {
			console.warn(`Invalid filter operator: ${operator}`);
			continue;
		}

		// Parse value based on operator
		let parsedValue: any = value;
		if (operator === 'in') {
			// Split comma-separated values
			parsedValue = value.split(',').map(v => v.trim());
		} else if (operator === 'between') {
			// Split into min and max
			const [min, max] = value.split(',').map(v => v.trim());
			parsedValue = { min, max };
		}

		filters.push({
			field,
			operator,
			value: parsedValue
		});
	}

	return filters;
}

/**
 * Parse sorting parameters
 *
 * Supported formats:
 * - ?sort=field (ASC)
 * - ?sort=-field (DESC, prefix with -)
 * - ?sort=-created_at,name (multiple: DESC created_at, ASC name)
 */
function parseSorting(searchParams: URLSearchParams): QuerySort[] {
	const sortParam = searchParams.get('sort');
	if (!sortParam) return [];

	const sorts: QuerySort[] = [];
	const sortFields = sortParam.split(',').map(s => s.trim());

	for (const sortField of sortFields) {
		if (!sortField) continue;

		const isDesc = sortField.startsWith('-');
		const field = isDesc ? sortField.substring(1) : sortField;

		sorts.push({
			field,
			order: isDesc ? 'desc' : 'asc'
		});
	}

	return sorts;
}

/**
 * Parse pagination parameters
 *
 * Supported formats:
 * - ?page=2&limit=20 (offset-based)
 * - ?limit=50 (just limit, no offset)
 */
function parsePagination(searchParams: URLSearchParams): QueryPagination | undefined {
	const page = searchParams.get('page');
	const limit = searchParams.get('limit');

	if (!page && !limit) return undefined;

	const pageNum = page ? parseInt(page, 10) : 1;
	const limitNum = limit ? parseInt(limit, 10) : 20;

	// Validate
	if (isNaN(pageNum) || pageNum < 1) {
		console.warn(`Invalid page number: ${page}`);
		return undefined;
	}

	if (isNaN(limitNum) || limitNum < 1) {
		console.warn(`Invalid limit: ${limit}`);
		return undefined;
	}

	return {
		page: pageNum,
		limit: limitNum,
		offset: (pageNum - 1) * limitNum
	};
}

/**
 * Build SQL WHERE clause from filters
 */
export function buildWhereClause(
	filters: QueryFilter[],
	allowedFields?: string[],
	allowedOperators?: FilterOperator[]
): { clause: string; params: any[] } {
	if (!filters || filters.length === 0) {
		return { clause: '', params: [] };
	}

	const conditions: string[] = [];
	const params: any[] = [];

	for (const filter of filters) {
		// Validate field
		if (allowedFields && allowedFields.length > 0 && !allowedFields.includes(filter.field)) {
			console.warn(`Field not allowed for filtering: ${filter.field}`);
			continue;
		}

		// Validate operator
		if (allowedOperators && allowedOperators.length > 0 && !allowedOperators.includes(filter.operator)) {
			console.warn(`Operator not allowed: ${filter.operator}`);
			continue;
		}

		// Build condition based on operator
		switch (filter.operator) {
			case 'eq':
				conditions.push(`${filter.field} = ?`);
				params.push(filter.value);
				break;

			case 'ne':
				conditions.push(`${filter.field} != ?`);
				params.push(filter.value);
				break;

			case 'gt':
				conditions.push(`${filter.field} > ?`);
				params.push(filter.value);
				break;

			case 'gte':
				conditions.push(`${filter.field} >= ?`);
				params.push(filter.value);
				break;

			case 'lt':
				conditions.push(`${filter.field} < ?`);
				params.push(filter.value);
				break;

			case 'lte':
				conditions.push(`${filter.field} <= ?`);
				params.push(filter.value);
				break;

			case 'in':
				const values = Array.isArray(filter.value) ? filter.value : [filter.value];
				const placeholders = values.map(() => '?').join(', ');
				conditions.push(`${filter.field} IN (${placeholders})`);
				params.push(...values);
				break;

			case 'like':
				conditions.push(`${filter.field} LIKE ?`);
				params.push(`%${filter.value}%`);
				break;

			case 'between':
				if (filter.value && typeof filter.value === 'object' && 'min' in filter.value && 'max' in filter.value) {
					conditions.push(`${filter.field} BETWEEN ? AND ?`);
					params.push(filter.value.min, filter.value.max);
				}
				break;
		}
	}

	if (conditions.length === 0) {
		return { clause: '', params: [] };
	}

	return {
		clause: 'WHERE ' + conditions.join(' AND '),
		params
	};
}

/**
 * Build SQL ORDER BY clause from sorts
 */
export function buildOrderByClause(
	sorts: QuerySort[],
	allowedFields?: string[],
	defaultSort?: QuerySort
): string {
	// Use provided sorts or fall back to default
	let activeSorts = sorts && sorts.length > 0 ? sorts : (defaultSort && defaultSort.field ? [defaultSort] : []);

	if (activeSorts.length === 0) {
		return '';
	}

	// Validate fields
	const validSorts = activeSorts.filter(sort => {
		// Skip empty field names
		if (!sort.field || sort.field.trim() === '') {
			return false;
		}

		if (allowedFields && allowedFields.length > 0 && !allowedFields.includes(sort.field)) {
			console.warn(`Field not allowed for sorting: ${sort.field}`);
			return false;
		}
		return true;
	});

	if (validSorts.length === 0) {
		return '';
	}

	const orderBy = validSorts
		.map(sort => `${sort.field} ${sort.order.toUpperCase()}`)
		.join(', ');

	return `ORDER BY ${orderBy}`;
}

/**
 * Build SQL LIMIT/OFFSET clause from pagination
 */
export function buildLimitClause(
	pagination?: QueryPagination,
	maxPageSize: number = 100,
	defaultLimit: number = 1000
): { clause: string; params: any[] } {
	if (!pagination) {
		// No pagination - use default limit
		return {
			clause: 'LIMIT ?',
			params: [defaultLimit]
		};
	}

	// Apply max page size limit
	const limit = Math.min(pagination.limit, maxPageSize);
	const offset = pagination.offset || 0;

	return {
		clause: 'LIMIT ? OFFSET ?',
		params: [limit, offset]
	};
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
	totalCount: number,
	pagination?: QueryPagination,
	defaultLimit: number = 1000
) {
	if (!pagination) {
		// No pagination
		return {
			total: totalCount,
			returned: Math.min(totalCount, defaultLimit),
			hasMore: totalCount > defaultLimit,
			message: totalCount > defaultLimit
				? `Showing first ${defaultLimit} records. Use pagination for more.`
				: undefined
		};
	}

	const totalPages = Math.ceil(totalCount / pagination.limit);

	return {
		total: totalCount,
		page: pagination.page,
		limit: pagination.limit,
		totalPages,
		hasNext: pagination.page < totalPages,
		hasPrev: pagination.page > 1,
		returned: Math.min(pagination.limit, totalCount - (pagination.offset || 0))
	};
}
