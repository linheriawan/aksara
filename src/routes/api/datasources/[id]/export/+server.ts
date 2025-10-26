import { type RequestHandler } from '@sveltejs/kit';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * POST /api/datasources/[id]/export
 * Export data from a table or query result
 *
 * Request body:
 * {
 *   format: 'csv' | 'json' | 'sql',
 *   table?: string,         // Table name to export
 *   query?: string,         // Or custom query
 *   params?: any[]          // Query parameters
 * }
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const { format, table, query, params: queryParams } = await request.json();

		if (!format || !['csv', 'json', 'sql'].includes(format)) {
			return new Response(
				JSON.stringify({ error: 'Invalid format. Must be csv, json, or sql' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		if (!table && !query) {
			return new Response(
				JSON.stringify({ error: 'Either table or query must be provided' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Build query
		let finalQuery: string;
		if (table) {
			// Simple table export
			finalQuery = `SELECT * FROM ${table}`;
		} else {
			finalQuery = query!;
		}

		// Execute query
		const data = await datasourceService.executeQuery(
			params.id,
			finalQuery,
			queryParams,
			locals.user.id
		);

		// Generate export based on format
		let content: string;
		let contentType: string;
		let filename: string;

		if (format === 'json') {
			content = JSON.stringify(data, null, 2);
			contentType = 'application/json';
			filename = `${table || 'export'}_${Date.now()}.json`;
		} else if (format === 'csv') {
			content = convertToCSV(data);
			contentType = 'text/csv';
			filename = `${table || 'export'}_${Date.now()}.csv`;
		} else {
			// SQL format
			content = convertToSQL(table || 'exported_data', data);
			contentType = 'text/plain';
			filename = `${table || 'export'}_${Date.now()}.sql`;
		}

		return new Response(content, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Content-Length': new Blob([content]).size.toString()
			}
		});
	} catch (error: any) {
		console.error('Failed to export data:', error);
		return new Response(
			JSON.stringify({ error: error.message || 'Failed to export data' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

/**
 * Convert data array to CSV format
 */
function convertToCSV(data: any[]): string {
	if (data.length === 0) {
		return '';
	}

	// Get headers from first row
	const headers = Object.keys(data[0]);

	// Escape CSV value
	const escapeCSV = (value: any): string => {
		if (value === null || value === undefined) {
			return '';
		}
		const str = String(value);
		// Escape quotes and wrap in quotes if contains comma, quote, or newline
		if (str.includes(',') || str.includes('"') || str.includes('\n')) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	// Build CSV
	const csvHeaders = headers.map(escapeCSV).join(',');
	const csvRows = data.map((row) => headers.map((header) => escapeCSV(row[header])).join(','));

	return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Convert data array to SQL INSERT statements
 */
function convertToSQL(tableName: string, data: any[]): string {
	if (data.length === 0) {
		return `-- No data to export\n`;
	}

	const headers = Object.keys(data[0]);

	// Escape SQL value
	const escapeSQL = (value: any): string => {
		if (value === null || value === undefined) {
			return 'NULL';
		}
		if (typeof value === 'number') {
			return String(value);
		}
		if (typeof value === 'boolean') {
			return value ? '1' : '0';
		}
		// String - escape single quotes
		return `'${String(value).replace(/'/g, "''")}'`;
	};

	const sql: string[] = [];

	// Add header comment
	sql.push(`-- Exported from table: ${tableName}`);
	sql.push(`-- Export date: ${new Date().toISOString()}`);
	sql.push(`-- Total rows: ${data.length}`);
	sql.push('');

	// Generate INSERT statements (batch by 100 rows for efficiency)
	const batchSize = 100;
	for (let i = 0; i < data.length; i += batchSize) {
		const batch = data.slice(i, Math.min(i + batchSize, data.length));

		const values = batch
			.map((row) => {
				const rowValues = headers.map((header) => escapeSQL(row[header])).join(', ');
				return `  (${rowValues})`;
			})
			.join(',\n');

		sql.push(`INSERT INTO ${tableName} (${headers.join(', ')}) VALUES`);
		sql.push(values + ';');
		sql.push('');
	}

	return sql.join('\n');
}
