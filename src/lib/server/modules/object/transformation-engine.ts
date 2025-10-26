/**
 * Transformation Engine for Business Objects
 *
 * Applies data transformations to object fields
 */

import type { ObjectData, Transformation, TransformContext } from './types';

export class TransformationEngine {
	/**
	 * Apply all transformations to object data
	 */
	transform(context: TransformContext): ObjectData {
		const result = { ...context.data };

		for (const field of context.objectDef.fields) {
			if (field.transformations && field.transformations.length > 0) {
				const value = result[field.name];

				// Apply transformations in sequence
				let transformedValue = value;
				for (const transformation of field.transformations) {
					transformedValue = this.applyTransformation(
						transformedValue,
						transformation,
						context
					);
				}

				result[field.name] = transformedValue;
			}
		}

		return result;
	}

	/**
	 * Apply a single transformation to a value
	 */
	private applyTransformation(
		value: any,
		transformation: Transformation,
		context: TransformContext
	): any {
		if (value === null || value === undefined) {
			return value;
		}

		switch (transformation.type) {
			case 'uppercase':
				return typeof value === 'string' ? value.toUpperCase() : value;

			case 'lowercase':
				return typeof value === 'string' ? value.toLowerCase() : value;

			case 'trim':
				return typeof value === 'string' ? value.trim() : value;

			case 'concat':
				if (transformation.params?.values && Array.isArray(transformation.params.values)) {
					const values = transformation.params.values.map((v: string) => {
						// Support field references like {fieldName}
						if (v.startsWith('{') && v.endsWith('}')) {
							const fieldName = v.slice(1, -1);
							return context.data[fieldName] || '';
						}
						return v;
					});
					return values.join(transformation.params.separator || '');
				}
				return value;

			case 'split':
				if (typeof value === 'string' && transformation.params?.separator) {
					const parts = value.split(transformation.params.separator);
					if (transformation.params.index !== undefined) {
						return parts[transformation.params.index] || '';
					}
					return parts;
				}
				return value;

			case 'replace':
				if (typeof value === 'string' && transformation.params?.search) {
					const search = transformation.params.search;
					const replace = transformation.params.replace || '';
					const useRegex = transformation.params.regex === true;

					if (useRegex) {
						const flags = transformation.params.flags || 'g';
						const regex = new RegExp(search, flags);
						return value.replace(regex, replace);
					} else {
						return value.replaceAll(search, replace);
					}
				}
				return value;

			case 'regex':
				if (typeof value === 'string' && transformation.params?.pattern) {
					const regex = new RegExp(
						transformation.params.pattern,
						transformation.params.flags || ''
					);
					const match = value.match(regex);
					if (match) {
						// Return first capture group if exists, otherwise full match
						return match[1] || match[0];
					}
					return transformation.params.default || null;
				}
				return value;

			case 'date_format':
				return this.formatDate(value, transformation.params);

			case 'number_format':
				return this.formatNumber(value, transformation.params);

			case 'json_parse':
				if (typeof value === 'string') {
					try {
						return JSON.parse(value);
					} catch (error: any) {
						console.error('JSON parse error:', error.message);
						return transformation.params?.default || null;
					}
				}
				return value;

			case 'json_stringify':
				if (typeof value === 'object') {
					try {
						const indent = transformation.params?.indent;
						return JSON.stringify(value, null, indent);
					} catch (error: any) {
						console.error('JSON stringify error:', error.message);
						return null;
					}
				}
				return value;

			case 'custom':
				return this.applyCustomTransformation(value, transformation, context);

			default:
				return value;
		}
	}

	/**
	 * Format date values
	 */
	private formatDate(value: any, params?: Record<string, any>): any {
		if (!value) return value;

		try {
			const date = value instanceof Date ? value : new Date(value);
			if (isNaN(date.getTime())) return value;

			const format = params?.format || 'ISO';

			switch (format) {
				case 'ISO':
					return date.toISOString();

				case 'date':
					return date.toISOString().split('T')[0];

				case 'time':
					return date.toTimeString().split(' ')[0];

				case 'datetime':
					return date.toISOString().replace('T', ' ').split('.')[0];

				case 'unix':
					return Math.floor(date.getTime() / 1000);

				case 'unix_ms':
					return date.getTime();

				case 'custom':
					// For custom format, use simple token replacement
					if (params?.pattern) {
						return this.formatDateCustom(date, params.pattern);
					}
					return date.toISOString();

				default:
					return date.toISOString();
			}
		} catch (error: any) {
			console.error('Date format error:', error.message);
			return value;
		}
	}

	/**
	 * Custom date formatting with simple tokens
	 */
	private formatDateCustom(date: Date, pattern: string): string {
		const tokens: Record<string, string> = {
			YYYY: date.getFullYear().toString(),
			MM: String(date.getMonth() + 1).padStart(2, '0'),
			DD: String(date.getDate()).padStart(2, '0'),
			HH: String(date.getHours()).padStart(2, '0'),
			mm: String(date.getMinutes()).padStart(2, '0'),
			ss: String(date.getSeconds()).padStart(2, '0')
		};

		let result = pattern;
		for (const [token, value] of Object.entries(tokens)) {
			result = result.replace(new RegExp(token, 'g'), value);
		}
		return result;
	}

	/**
	 * Format number values
	 */
	private formatNumber(value: any, params?: Record<string, any>): any {
		if (typeof value !== 'number') {
			const parsed = parseFloat(value);
			if (isNaN(parsed)) return value;
			value = parsed;
		}

		const decimals = params?.decimals;
		const thousandsSeparator = params?.thousandsSeparator || '';
		const decimalSeparator = params?.decimalSeparator || '.';
		const prefix = params?.prefix || '';
		const suffix = params?.suffix || '';

		// Round to decimals
		let formatted = decimals !== undefined ? value.toFixed(decimals) : value.toString();

		// Replace decimal separator
		if (decimalSeparator !== '.') {
			formatted = formatted.replace('.', decimalSeparator);
		}

		// Add thousands separator
		if (thousandsSeparator) {
			const parts = formatted.split(decimalSeparator);
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
			formatted = parts.join(decimalSeparator);
		}

		return `${prefix}${formatted}${suffix}`;
	}

	/**
	 * Apply custom transformation function
	 */
	private applyCustomTransformation(
		value: any,
		transformation: Transformation,
		context: TransformContext
	): any {
		if (!transformation.customFunction) {
			return value;
		}

		try {
			// Execute custom transformation function
			// Function receives: value, allData, operation
			const fn = new Function('value', 'data', 'operation', transformation.customFunction);
			const result = fn(value, context.data, context.operation);
			return result !== undefined ? result : value;
		} catch (error: any) {
			console.error('Custom transformation error:', error.message);
			return value;
		}
	}

	/**
	 * Transform data for create operation
	 */
	transformForCreate(data: ObjectData, objectDef: any): ObjectData {
		return this.transform({
			data,
			objectDef,
			operation: 'create'
		});
	}

	/**
	 * Transform data for update operation
	 */
	transformForUpdate(data: ObjectData, objectDef: any): ObjectData {
		return this.transform({
			data,
			objectDef,
			operation: 'update'
		});
	}

	/**
	 * Transform data for read operation
	 */
	transformForRead(data: ObjectData, objectDef: any): ObjectData {
		return this.transform({
			data,
			objectDef,
			operation: 'read'
		});
	}
}

export const transformationEngine = new TransformationEngine();
