/**
 * Validation utilities for Notion CLI
 */

/**
 * Notion ID format: 36 character UUID (with or without hyphens)
 * Example: 12345678-1234-1234-1234-123456789012 or 12345678123412341234123412345678
 */

/**
 * Validate a Notion ID (page, database, block, user, etc.)
 * Notion IDs are UUIDs, either with or without hyphens
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Remove hyphens for consistent checking
  const cleanId = id.replace(/-/g, '');

  // Should be 32 hex characters
  return /^[0-9a-f]{32}$/i.test(cleanId);
}

/**
 * Validate and normalize a Notion ID
 * Returns the ID with hyphens added if missing
 */
export function normalizeId(id: string): string {
  const cleanId = id.replace(/-/g, '');

  if (!/^[0-9a-f]{32}$/i.test(cleanId)) {
    throw new Error(`Invalid Notion ID format: ${id}. Expected a 32-character hex string (UUID).`);
  }

  // Add hyphens in standard UUID format: 8-4-4-4-12
  return [
    cleanId.slice(0, 8),
    cleanId.slice(8, 12),
    cleanId.slice(12, 16),
    cleanId.slice(16, 20),
    cleanId.slice(20),
  ].join('-');
}

/**
 * Validate a Notion ID, throwing an error if invalid
 */
export function validateId(id: string, context: string = 'ID'): void {
  if (!isValidId(id)) {
    throw new Error(`Invalid ${context} format: ${id}. Expected a Notion ID (UUID).`);
  }
}

/**
 * Validate that a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate URL, throwing an error if invalid
 */
export function validateUrl(url: string, context: string = 'URL'): void {
  if (!isValidUrl(url)) {
    throw new Error(`Invalid ${context}: ${url}. Expected a valid URL.`);
  }
}

/**
 * Validate JSON string
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse and validate JSON, throwing an error if invalid
 */
export function parseJson(str: string, context: string = 'JSON'): unknown {
  try {
    return JSON.parse(str);
  } catch (error) {
    const message = (error as Error).message;
    const customError = new Error(`Invalid ${context}: ${message}`);
    (customError as any).cause = error;
    throw customError;
  }
}

/**
 * Validate API version format (YYYY-MM-DD)
 */
export function isValidVersion(version: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(version);
}

/**
 * Validate API version, throwing an error if invalid
 */
export function validateVersion(version: string): void {
  if (!isValidVersion(version)) {
    throw new Error(
      `Invalid API version format: ${version}. Expected YYYY-MM-DD (e.g., 2025-09-03).`
    );
  }
}

/**
 * Color options supported by Notion
 */
export const VALID_COLORS = [
  'default',
  'gray',
  'brown',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
] as const;

export type Color = (typeof VALID_COLORS)[number];

/**
 * Validate a color value
 */
export function isValidColor(color: string): color is Color {
  return VALID_COLORS.includes(color as Color);
}

/**
 * Validate color, throwing an error if invalid
 */
export function validateColor(color: string): void {
  if (!isValidColor(color)) {
    throw new Error(`Invalid color: ${color}. Valid options: ${VALID_COLORS.join(', ')}`);
  }
}

/**
 * Block types supported by Notion
 */
export const VALID_BLOCK_TYPES = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'toggle',
  'quote',
  'callout',
  'code',
  'divider',
  'image',
  'embed',
  'bookmark',
  'video',
  'pdf',
  'file',
  'audio',
  'table',
  'table_row',
  'column',
  'column_list',
  'synced_block',
] as const;

export type BlockType = (typeof VALID_BLOCK_TYPES)[number];

/**
 * Validate a block type
 */
export function isValidBlockType(type: string): type is BlockType {
  return VALID_BLOCK_TYPES.includes(type as BlockType);
}

/**
 * Validate block type, throwing an error if invalid
 */
export function validateBlockType(type: string): void {
  if (!isValidBlockType(type)) {
    throw new Error(`Invalid block type: ${type}. Valid options: ${VALID_BLOCK_TYPES.join(', ')}`);
  }
}
