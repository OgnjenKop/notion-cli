/**
 * Input validation utilities for command options
 */

import { ValidationError } from './errors';

/**
 * Validate that a string is not empty
 */
export function validateRequired(value: string | undefined, fieldName: string): void {
  if (!value || value.trim() === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
}

/**
 * Validate that a value is a positive integer
 */
export function validatePositiveInteger(
  value: number | string | undefined,
  fieldName: string,
  options?: { max?: number; min?: number }
): number {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (num === undefined || isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a number`, fieldName);
  }

  if (!Number.isInteger(num)) {
    throw new ValidationError(`${fieldName} must be an integer`, fieldName);
  }

  if (options?.min !== undefined && num < options.min) {
    throw new ValidationError(`${fieldName} must be at least ${options.min}`, fieldName);
  }

  if (options?.max !== undefined && num > options.max) {
    throw new ValidationError(`${fieldName} must be at most ${options.max}`, fieldName);
  }

  if (num <= 0) {
    throw new ValidationError(`${fieldName} must be positive`, fieldName);
  }

  return num;
}

/**
 * Validate email format
 */
export function validateEmail(email: string | undefined, fieldName: string = 'Email'): void {
  if (!email) {
    return; // Optional field
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', fieldName);
  }
}

/**
 * Validate URL format
 */
export function validateUrlFormat(url: string | undefined, fieldName: string = 'URL'): void {
  if (!url) {
    return; // Optional field
  }

  try {
    new URL(url);
  } catch {
    throw new ValidationError('Invalid URL format', fieldName);
  }
}

/**
 * Validate ISO date string
 */
export function validateIsoDate(date: string | undefined, fieldName: string = 'Date'): void {
  if (!date) {
    return; // Optional field
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new ValidationError('Invalid date format. Use ISO format (YYYY-MM-DD)', fieldName);
  }
}

/**
 * Validate that at least one of the provided values is present
 */
export function validateAtLeastOne(
  values: Array<{ value: unknown; name: string }>,
  context: string
): void {
  const hasValue = values.some((v) => v.value !== undefined && v.value !== null && v.value !== '');

  if (!hasValue) {
    const names = values.map((v) => v.name).join(' or ');
    throw new ValidationError(`At least one of ${names} is required`, context);
  }
}

/**
 * Validate that only one of the provided values is present
 */
export function validateOnlyOne(
  values: Array<{ value: unknown; name: string }>,
  context: string
): void {
  const presentValues = values.filter(
    (v) => v.value !== undefined && v.value !== null && v.value !== ''
  );

  if (presentValues.length === 0) {
    const names = values.map((v) => v.name).join(' or ');
    throw new ValidationError(`One of ${names} is required`, context);
  }

  if (presentValues.length > 1) {
    const names = presentValues.map((v) => v.name).join(' and ');
    throw new ValidationError(`Only one of ${names} is allowed`, context);
  }
}

/**
 * Validate array length
 */
export function validateArrayLength<T>(
  array: T[] | undefined,
  fieldName: string,
  options: { min?: number; max?: number }
): void {
  if (!array) {
    return; // Optional field
  }

  if (options.min !== undefined && array.length < options.min) {
    throw new ValidationError(`${fieldName} must have at least ${options.min} item(s)`, fieldName);
  }

  if (options.max !== undefined && array.length > options.max) {
    throw new ValidationError(`${fieldName} must have at most ${options.max} item(s)`, fieldName);
  }
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string | undefined,
  fieldName: string,
  options: { min?: number; max?: number }
): void {
  if (!value) {
    return; // Optional field
  }

  if (options.min !== undefined && value.length < options.min) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.min} character(s)`,
      fieldName
    );
  }

  if (options.max !== undefined && value.length > options.max) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.max} character(s)`,
      fieldName
    );
  }
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: T | undefined,
  allowedValues: T[],
  fieldName: string
): void {
  if (!value) {
    return; // Optional field
  }

  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName
    );
  }
}
