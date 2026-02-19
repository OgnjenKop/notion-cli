/**
 * Property builders for Notion database properties
 *
 * This module provides utility functions for building Notion database properties
 * and property values programmatically. It's designed for use in custom scripts
 * and advanced use cases where you need to construct complex property schemas.
 *
 * @example
 * // Build database properties
 * const props = buildProperties([
 *   { name: 'Name', type: 'title' },
 *   { name: 'Status', type: 'select', options: { options: [{ name: 'Done' }] } }
 * ]);
 *
 * // Build property values for pages
 * const statusValue = buildPropertyValue('select', 'Done');
 */

export type PropertyType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'people'
  | 'files'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by'
  | 'status';

export interface PropertyConfig {
  name: string;
  type: PropertyType;
  options?: any;
}

/**
 * Build a single property definition for database creation/update
 */
export function buildProperty(config: PropertyConfig): any {
  const { name, type, options } = config;

  switch (type) {
    case 'title':
      return { [name]: { title: {} } };

    case 'rich_text':
      return { [name]: { rich_text: {} } };

    case 'number':
      return {
        [name]: {
          number: {
            format: options?.format || 'number',
          },
        },
      };

    case 'select':
      return {
        [name]: {
          select: {
            options: options?.options || [],
          },
        },
      };

    case 'multi_select':
      return {
        [name]: {
          multi_select: {
            options: options?.options || [],
          },
        },
      };

    case 'date':
      return { [name]: { date: {} } };

    case 'people':
      return { [name]: { people: {} } };

    case 'files':
      return { [name]: { files: {} } };

    case 'checkbox':
      return { [name]: { checkbox: {} } };

    case 'url':
      return { [name]: { url: {} } };

    case 'email':
      return { [name]: { email: {} } };

    case 'phone_number':
      return { [name]: { phone_number: {} } };

    case 'formula':
      return {
        [name]: {
          formula: {
            expression: options?.expression || '',
          },
        },
      };

    case 'relation':
      return {
        [name]: {
          relation: {
            database_id: options?.databaseId,
            type: options?.type || 'dual_property',
          },
        },
      };

    case 'rollup':
      return {
        [name]: {
          rollup: {
            relation_property_name: options?.relationPropertyName,
            relation_property_id: options?.relationPropertyId,
            rollup_property_name: options?.rollupPropertyName,
            rollup_property_id: options?.rollupPropertyId,
            function: options?.function,
          },
        },
      };

    case 'created_time':
      return { [name]: { created_time: {} } };

    case 'created_by':
      return { [name]: { created_by: {} } };

    case 'last_edited_time':
      return { [name]: { last_edited_time: {} } };

    case 'last_edited_by':
      return { [name]: { last_edited_by: {} } };

    case 'status':
      return {
        [name]: {
          status: {
            options: options?.options || [],
            groups: options?.groups || [],
          },
        },
      };

    default:
      throw new Error(`Unsupported property type: ${type}`);
  }
}

/**
 * Build multiple properties for database creation
 */
export function buildProperties(configs: PropertyConfig[]): any {
  return configs.reduce((acc, config) => {
    return { ...acc, ...buildProperty(config) };
  }, {});
}

/**
 * Build a property value for page creation/update
 */
export function buildPropertyValue(type: PropertyType, value: any): any {
  switch (type) {
    case 'title':
      return {
        title: [{ text: { content: value } }],
      };

    case 'rich_text':
      return {
        rich_text: [{ text: { content: value } }],
      };

    case 'number':
      return { number: value };

    case 'select':
      return { select: { name: value } };

    case 'multi_select':
      return {
        multi_select: Array.isArray(value)
          ? value.map((v: string) => ({ name: v }))
          : [{ name: value }],
      };

    case 'date':
      return {
        date: {
          start: value.start,
          end: value.end || null,
          time_zone: value.time_zone || null,
        },
      };

    case 'checkbox':
      return { checkbox: value };

    case 'url':
      return { url: value };

    case 'email':
      return { email: value };

    case 'phone_number':
      return { phone_number: value };

    case 'people':
      return {
        people: Array.isArray(value) ? value.map((id: string) => ({ id })) : [{ id: value }],
      };

    case 'files':
      return {
        files: Array.isArray(value)
          ? value.map((f: any) => ({
              name: f.name,
              type: f.type || 'external',
              external: f.type === 'external' ? { url: f.url } : undefined,
            }))
          : [
              {
                name: value.name,
                type: value.type || 'external',
                external: { url: value.url },
              },
            ],
      };

    case 'relation':
      return {
        relation: Array.isArray(value) ? value.map((id: string) => ({ id })) : [{ id: value }],
      };

    case 'status':
      return { status: { name: value } };

    default:
      throw new Error(`Unsupported property type for value: ${type}`);
  }
}
