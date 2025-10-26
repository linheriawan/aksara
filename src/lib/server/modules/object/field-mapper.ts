/**
 * Field Mapper for Business Objects
 *
 * Maps business object fields to datasource columns
 */

import type {
	BusinessObject,
	ObjectField,
	ObjectData,
	FieldMapping,
	MappingType
} from './types';

export interface MappedField {
	fieldName: string;
	sourceTable: string;
	sourceColumn: string;
	mappingType: MappingType;
	expression?: string;
}

export interface FieldMappingResult {
	fields: MappedField[];
	primaryTable: string;
	primaryDatasourceId: string;
}

export class FieldMapper {
	/**
	 * Map object fields to datasource columns
	 */
	mapFields(objectDef: BusinessObject): FieldMappingResult {
		const mappedFields: MappedField[] = [];

		for (const field of objectDef.fields) {
			const mapped = this.mapField(field, objectDef);
			if (mapped) {
				mappedFields.push(mapped);
			}
		}

		return {
			fields: mappedFields,
			primaryTable: objectDef.primaryTable,
			primaryDatasourceId: objectDef.primaryDatasourceId
		};
	}

	/**
	 * Map a single field
	 */
	private mapField(field: ObjectField, objectDef: BusinessObject): MappedField | null {
		if (!field.mapping) {
			// Default direct mapping to same column name
			return {
				fieldName: field.name,
				sourceTable: objectDef.primaryTable,
				sourceColumn: field.name,
				mappingType: 'direct'
			};
		}

		switch (field.mapping.type) {
			case 'direct':
				return this.mapDirectField(field, objectDef);

			case 'computed':
				return this.mapComputedField(field, objectDef);

			case 'transformed':
				return this.mapTransformedField(field, objectDef);

			case 'relation':
				return this.mapRelationField(field, objectDef);

			default:
				return null;
		}
	}

	/**
	 * Map direct field (column to column)
	 */
	private mapDirectField(field: ObjectField, objectDef: BusinessObject): MappedField {
		const mapping = field.mapping!;

		if (mapping.source) {
			// Explicit source mapping
			return {
				fieldName: field.name,
				sourceTable: mapping.source.table,
				sourceColumn: mapping.source.column,
				mappingType: 'direct'
			};
		}

		// Default to same column name in primary table
		return {
			fieldName: field.name,
			sourceTable: objectDef.primaryTable,
			sourceColumn: field.name,
			mappingType: 'direct'
		};
	}

	/**
	 * Map computed field (SQL expression)
	 */
	private mapComputedField(field: ObjectField, objectDef: BusinessObject): MappedField {
		const mapping = field.mapping!;

		if (!mapping.expression) {
			throw new Error(`Computed field ${field.name} requires an expression`);
		}

		return {
			fieldName: field.name,
			sourceTable: objectDef.primaryTable,
			sourceColumn: field.name, // Will be aliased in SQL
			mappingType: 'computed',
			expression: mapping.expression
		};
	}

	/**
	 * Map transformed field (references another field)
	 */
	private mapTransformedField(field: ObjectField, objectDef: BusinessObject): MappedField {
		const mapping = field.mapping!;

		if (!mapping.sourceField) {
			throw new Error(`Transformed field ${field.name} requires a sourceField`);
		}

		// Find the source field
		const sourceField = objectDef.fields.find((f) => f.name === mapping.sourceField);
		if (!sourceField || !sourceField.mapping) {
			throw new Error(`Source field ${mapping.sourceField} not found or not mapped`);
		}

		// Use the source field's mapping
		const sourceMapped = this.mapField(sourceField, objectDef);
		if (!sourceMapped) {
			throw new Error(`Could not map source field ${mapping.sourceField}`);
		}

		return {
			fieldName: field.name,
			sourceTable: sourceMapped.sourceTable,
			sourceColumn: sourceMapped.sourceColumn,
			mappingType: 'transformed',
			expression: sourceMapped.expression
		};
	}

	/**
	 * Map relation field (from joined table)
	 */
	private mapRelationField(field: ObjectField, objectDef: BusinessObject): MappedField {
		const mapping = field.mapping!;

		if (!mapping.relation) {
			throw new Error(`Relation field ${field.name} requires a relation config`);
		}

		return {
			fieldName: field.name,
			sourceTable: mapping.relation.table,
			sourceColumn: field.name,
			mappingType: 'relation'
		};
	}

	/**
	 * Get SELECT clause for mapped fields
	 */
	buildSelectClause(mappingResult: FieldMappingResult, tableAlias?: string): string {
		const parts: string[] = [];
		const prefix = tableAlias || mappingResult.primaryTable;

		for (const field of mappingResult.fields) {
			if (field.mappingType === 'computed' && field.expression) {
				// Computed field: use expression with alias
				parts.push(`(${field.expression}) AS ${field.fieldName}`);
			} else if (field.mappingType === 'relation') {
				// Relation field: use joined table
				parts.push(`${field.sourceTable}.${field.sourceColumn} AS ${field.fieldName}`);
			} else if (field.mappingType === 'transformed') {
				// Transformed field: select source column with field alias
				if (field.expression) {
					parts.push(`(${field.expression}) AS ${field.fieldName}`);
				} else {
					parts.push(`${field.sourceTable}.${field.sourceColumn} AS ${field.fieldName}`);
				}
			} else {
				// Direct field
				if (field.sourceTable === mappingResult.primaryTable) {
					parts.push(`${prefix}.${field.sourceColumn} AS ${field.fieldName}`);
				} else {
					parts.push(`${field.sourceTable}.${field.sourceColumn} AS ${field.fieldName}`);
				}
			}
		}

		return parts.join(', ');
	}

	/**
	 * Get list of tables needed for mapping
	 */
	getRequiredTables(mappingResult: FieldMappingResult): string[] {
		const tables = new Set<string>();
		tables.add(mappingResult.primaryTable);

		for (const field of mappingResult.fields) {
			if (field.mappingType === 'relation') {
				tables.add(field.sourceTable);
			}
		}

		return Array.from(tables);
	}

	/**
	 * Map object data to database columns for INSERT/UPDATE
	 */
	mapDataToColumns(
		data: ObjectData,
		objectDef: BusinessObject
	): Record<string, Record<string, any>> {
		const result: Record<string, Record<string, any>> = {
			[objectDef.primaryTable]: {}
		};

		for (const field of objectDef.fields) {
			// Skip if field value not provided
			if (!(field.name in data)) {
				continue;
			}

			const value = data[field.name];
			const mapped = this.mapField(field, objectDef);

			if (!mapped) {
				continue;
			}

			// Only map direct fields for INSERT/UPDATE
			// Computed and transformed fields are read-only
			if (mapped.mappingType === 'direct' || mapped.mappingType === 'relation') {
				if (!result[mapped.sourceTable]) {
					result[mapped.sourceTable] = {};
				}
				result[mapped.sourceTable][mapped.sourceColumn] = value;
			}
		}

		return result;
	}

	/**
	 * Validate field mappings
	 */
	validateMappings(objectDef: BusinessObject): string[] {
		const errors: string[] = [];

		for (const field of objectDef.fields) {
			try {
				this.mapField(field, objectDef);
			} catch (error: any) {
				errors.push(`Field ${field.name}: ${error.message}`);
			}
		}

		return errors;
	}

	/**
	 * Get primary key field(s)
	 */
	getPrimaryKeyFields(objectDef: BusinessObject): string[] {
		// Look for fields explicitly marked or named 'id'
		const pkFields = objectDef.fields.filter(
			(f) => f.name === 'id' || f.name.endsWith('_id') || f.name.endsWith('Id')
		);

		if (pkFields.length > 0) {
			return pkFields.map((f) => f.name);
		}

		// Default to 'id'
		return ['id'];
	}

	/**
	 * Get insertable fields (exclude computed/transformed)
	 */
	getInsertableFields(objectDef: BusinessObject): ObjectField[] {
		return objectDef.fields.filter((field) => {
			if (!field.mapping) {
				return true; // Default direct mapping is insertable
			}
			return field.mapping.type === 'direct' || field.mapping.type === 'relation';
		});
	}

	/**
	 * Get updatable fields (exclude computed/transformed and PKs)
	 */
	getUpdatableFields(objectDef: BusinessObject): ObjectField[] {
		const pkFields = this.getPrimaryKeyFields(objectDef);
		return objectDef.fields.filter((field) => {
			// Exclude primary keys
			if (pkFields.includes(field.name)) {
				return false;
			}
			if (!field.mapping) {
				return true;
			}
			return field.mapping.type === 'direct' || field.mapping.type === 'relation';
		});
	}
}

export const fieldMapper = new FieldMapper();
