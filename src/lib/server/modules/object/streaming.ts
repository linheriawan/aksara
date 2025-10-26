/**
 * Streaming utilities for REST API
 * Supports NDJSON (Newline Delimited JSON) and CSV formats
 */

/**
 * Detect requested format from Accept header or query parameter
 */
export function detectStreamFormat(
	acceptHeader: string | null,
	formatParam: string | null
): 'json' | 'ndjson' | 'csv' {
	// Query parameter takes precedence
	if (formatParam) {
		const format = formatParam.toLowerCase();
		if (format === 'ndjson' || format === 'csv') return format;
		if (format === 'json') return 'json';
	}

	// Check Accept header
	if (acceptHeader) {
		if (acceptHeader.includes('application/x-ndjson')) return 'ndjson';
		if (acceptHeader.includes('text/csv')) return 'csv';
	}

	// Default to JSON
	return 'json';
}

/**
 * Get content type for format
 */
export function getContentType(format: 'json' | 'ndjson' | 'csv'): string {
	switch (format) {
		case 'ndjson':
			return 'application/x-ndjson';
		case 'csv':
			return 'text/csv';
		default:
			return 'application/json';
	}
}

/**
 * Create a streaming response for NDJSON format
 * Each row is sent as a separate JSON object on a new line
 */
export function createNDJSONStream(rows: any[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	let index = 0;

	return new ReadableStream({
		pull(controller) {
			if (index < rows.length) {
				const row = rows[index];
				const json = JSON.stringify(row) + '\n';
				controller.enqueue(encoder.encode(json));
				index++;
			} else {
				controller.close();
			}
		}
	});
}

/**
 * Create a streaming response for CSV format
 */
export function createCSVStream(rows: any[], fields: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	let index = -1; // Start at -1 to send header first

	return new ReadableStream({
		pull(controller) {
			if (index === -1) {
				// Send CSV header
				const header = fields.join(',') + '\n';
				controller.enqueue(encoder.encode(header));
				index = 0;
			} else if (index < rows.length) {
				// Send CSV row
				const row = rows[index];
				const values = fields.map(field => {
					const value = row[field];
					// Escape values containing commas, quotes, or newlines
					if (value === null || value === undefined) return '';
					const str = String(value);
					if (str.includes(',') || str.includes('"') || str.includes('\n')) {
						return `"${str.replace(/"/g, '""')}"`;
					}
					return str;
				});
				const line = values.join(',') + '\n';
				controller.enqueue(encoder.encode(line));
				index++;
			} else {
				controller.close();
			}
		}
	});
}

/**
 * Create a chunked streaming response
 * Sends data in chunks for better performance with large datasets
 */
export async function* streamRowsInChunks(
	datasourceService: any,
	datasourceId: string,
	query: string,
	params: any[],
	userId: string,
	chunkSize: number = 100
) {
	// For now, we'll execute the full query and chunk the results
	// In the future, we can implement cursor-based pagination for true streaming
	const rows = await datasourceService.executeQuery(datasourceId, query, params, userId);

	for (let i = 0; i < rows.length; i += chunkSize) {
		yield rows.slice(i, i + chunkSize);
	}
}
