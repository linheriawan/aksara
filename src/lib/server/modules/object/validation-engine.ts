/**
 * Validation Engine for Business Objects
 *
 * Validates object data against defined validation rules
 */

import type {
	BusinessObject,
	ObjectData,
	ValidationResult,
	ValidationRule,
	ValidationType
} from './types';

export class ValidationEngine {
	/**
	 * Validate object data against all field validation rules
	 */
	validate(data: ObjectData, objectDef: BusinessObject): ValidationResult {
		const errors: ValidationResult['errors'] = [];

		for (const field of objectDef.fields) {
			const value = data[field.name];

			// Check required fields
			if (field.required && (value === null || value === undefined || value === '')) {
				errors.push({
					field: field.name,
					message: `${field.name} is required`,
					rule: 'required'
				});
				continue;
			}

			// Skip validation if field is not required and value is empty
			if (!field.required && (value === null || value === undefined || value === '')) {
				continue;
			}

			// Run field-specific validations
			if (field.validations) {
				for (const rule of field.validations) {
					const error = this.validateRule(field.name, value, rule);
					if (error) {
						errors.push(error);
					}
				}
			}
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * Validate a single value against a validation rule
	 */
	private validateRule(
		fieldName: string,
		value: any,
		rule: ValidationRule
	): ValidationResult['errors'][0] | null {
		switch (rule.type) {
			case 'required':
				if (value === null || value === undefined || value === '') {
					return {
						field: fieldName,
						message: rule.message || `${fieldName} is required`,
						rule: 'required'
					};
				}
				break;

			case 'email':
				if (!this.isValidEmail(value)) {
					return {
						field: fieldName,
						message: rule.message || `${fieldName} must be a valid email`,
						rule: 'email'
					};
				}
				break;

			case 'url':
				if (!this.isValidURL(value)) {
					return {
						field: fieldName,
						message: rule.message || `${fieldName} must be a valid URL`,
						rule: 'url'
					};
				}
				break;

			case 'min_length':
				if (typeof value === 'string' && value.length < (rule.value || 0)) {
					return {
						field: fieldName,
						message:
							rule.message || `${fieldName} must be at least ${rule.value} characters`,
						rule: 'min_length'
					};
				}
				break;

			case 'max_length':
				if (typeof value === 'string' && value.length > (rule.value || 0)) {
					return {
						field: fieldName,
						message: rule.message || `${fieldName} must be at most ${rule.value} characters`,
						rule: 'max_length'
					};
				}
				break;

			case 'min':
				if (typeof value === 'number' && value < (rule.value || 0)) {
					return {
						field: fieldName,
						message: rule.message || `${fieldName} must be at least ${rule.value}`,
						rule: 'min'
					};
				}
				break;

			case 'max':
				if (typeof value === 'number' && value > (rule.value || 0)) {
					return {
						field: fieldName,
						message: rule.message || `${fieldName} must be at most ${rule.value}`,
						rule: 'max'
					};
				}
				break;

			case 'pattern':
				if (typeof value === 'string' && rule.value) {
					const regex = new RegExp(rule.value);
					if (!regex.test(value)) {
						return {
							field: fieldName,
							message: rule.message || `${fieldName} does not match required pattern`,
							rule: 'pattern'
						};
					}
				}
				break;

			case 'enum':
				if (rule.value && Array.isArray(rule.value)) {
					if (!rule.value.includes(value)) {
						return {
							field: fieldName,
							message:
								rule.message ||
								`${fieldName} must be one of: ${rule.value.join(', ')}`,
							rule: 'enum'
						};
					}
				}
				break;

			case 'custom':
				if (rule.customFunction) {
					try {
						// Execute custom validation function
						const fn = new Function('value', 'data', rule.customFunction);
						const result = fn(value, {});
						if (!result) {
							return {
								field: fieldName,
								message: rule.message || `${fieldName} failed custom validation`,
								rule: 'custom'
							};
						}
					} catch (error: any) {
						return {
							field: fieldName,
							message: `Custom validation error: ${error.message}`,
							rule: 'custom'
						};
					}
				}
				break;
		}

		return null;
	}

	/**
	 * Validate email format
	 */
	private isValidEmail(value: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(value);
	}

	/**
	 * Validate URL format
	 */
	private isValidURL(value: string): boolean {
		try {
			new URL(value);
			return true;
		} catch {
			return false;
		}
	}
}

export const validationEngine = new ValidationEngine();
