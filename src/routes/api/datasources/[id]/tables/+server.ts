import { json, type RequestHandler } from '@sveltejs/kit';
import { datasourceService } from '$lib/server/modules/datasource/datasource.service';

/**
 * POST /api/datasources/[id]/tables - Create a new table
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { tableName, columns } = body;

		if (!tableName || !columns || !Array.isArray(columns) || columns.length === 0) {
			return json({ error: 'Table name and columns are required' }, { status: 400 });
		}

		// Build CREATE TABLE query
		const columnDefs = columns
			.map((col: any) => {
				let def = `${col.name} ${col.type}`;
				if (!col.nullable) def += ' NOT NULL';
				if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
				if (col.isPrimaryKey) def += ' PRIMARY KEY';
				if (col.isUnique) def += ' UNIQUE';
				if (col.autoIncrement) def += ' AUTO_INCREMENT';
				return def;
			})
			.join(', ');

		const query = `CREATE TABLE ${tableName} (${columnDefs})`;

		// Execute the query
		await datasourceService.executeQuery(params.id, query, undefined, locals.user.id);

		return json({ success: true, message: `Table "${tableName}" created successfully` });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * PUT /api/datasources/[id]/tables - Alter a table
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { tableName, operation, columnName, columnDef } = body;

		if (!tableName || !operation) {
			return json({ error: 'Table name and operation are required' }, { status: 400 });
		}

		let query = '';

		switch (operation) {
			case 'add_column':
				if (!columnName || !columnDef) {
					return json({ error: 'Column name and definition are required' }, { status: 400 });
				}
				query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`;
				break;

			case 'drop_column':
				if (!columnName) {
					return json({ error: 'Column name is required' }, { status: 400 });
				}
				query = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;
				break;

			case 'modify_column':
				if (!columnName || !columnDef) {
					return json({ error: 'Column name and definition are required' }, { status: 400 });
				}
				query = `ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ${columnDef}`;
				break;

			case 'rename_table':
				if (!body.newTableName) {
					return json({ error: 'New table name is required' }, { status: 400 });
				}
				query = `ALTER TABLE ${tableName} RENAME TO ${body.newTableName}`;
				break;

			default:
				return json({ error: 'Invalid operation' }, { status: 400 });
		}

		// Execute the query
		await datasourceService.executeQuery(params.id, query, undefined, locals.user.id);

		return json({ success: true, message: 'Table altered successfully' });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

/**
 * DELETE /api/datasources/[id]/tables - Drop a table
 */
export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { tableName } = body;

		if (!tableName) {
			return json({ error: 'Table name is required' }, { status: 400 });
		}

		const query = `DROP TABLE ${tableName}`;

		// Execute the query
		await datasourceService.executeQuery(params.id, query, undefined, locals.user.id);

		return json({ success: true, message: `Table "${tableName}" dropped successfully` });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
