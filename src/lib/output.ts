/**
 * Output formatting utilities
 */

import { Page, Database, User, Block } from './types';

export interface OutputOptions {
  json?: boolean;
  quiet?: boolean;
}

/**
 * Format data for output
 */
export function formatOutput(data: unknown, options: OutputOptions = {}): string {
  if (options.json) {
    return JSON.stringify(data, null, 2);
  }

  if (typeof data === 'string') {
    return data;
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Print formatted output to console
 */
export function printOutput(data: unknown, options: OutputOptions = {}): void {
  if (options.quiet) {
    return;
  }
  console.log(formatOutput(data, options));
}

/**
 * Print success message
 */
export function printSuccess(message: string, quiet?: boolean): void {
  if (!quiet) {
    console.log(`✓ ${message}`);
  }
}

/**
 * Print error message
 */
export function printError(message: string, error?: string): void {
  console.error(`✗ ${message}`);
  if (error) {
    console.error(`  ${error}`);
  }
}

/**
 * Print info message
 */
export function printInfo(message: string, quiet?: boolean): void {
  if (!quiet) {
    console.log(`ℹ ${message}`);
  }
}

/**
 * Print a page summary (used across multiple commands)
 */
export function printPageSummary(page: Page): void {
  const title = getPageTitle(page);
  const id = page.id;
  const url = page.url || 'N/A';
  const status =
    (page.properties?.Status as any)?.status?.name ||
    (page.properties?.Status as any)?.select?.name ||
    '';

  console.log(`[PAGE] ${title}`);
  console.log(`  ID: ${id}`);
  console.log(`  URL: ${url}`);
  if (status) {
    console.log(`  Status: ${status}`);
  }
  console.log('');
}

/**
 * Extract page title from various property formats
 */
export function getPageTitle(page: Page): string {
  const nameProp = page.properties?.Name as any;
  const titleProp = page.properties?.title as any;

  return nameProp?.title?.[0]?.plain_text || titleProp?.title?.[0]?.plain_text || 'Untitled';
}

/**
 * Print a database summary
 */
export function printDatabaseSummary(db: Database): void {
  const title = db.title?.[0]?.plain_text || 'Untitled Database';
  const id = db.id;
  const url = db.url || 'N/A';
  const properties = Object.keys(db.properties || {}).join(', ');

  console.log(`[DATABASE] ${title}`);
  console.log(`  ID: ${id}`);
  console.log(`  URL: ${url}`);
  console.log(`  Properties: ${properties}`);
  console.log('');
}

/**
 * Print a user summary
 */
export function printUserSummary(user: User): void {
  const name = user.name || 'Unknown';
  const id = user.id;
  const type = user.type;
  const email = user.person?.email || user.bot?.email || 'N/A';

  console.log(`[USER] ${name}`);
  console.log(`  ID: ${id}`);
  console.log(`  Type: ${type}`);
  console.log(`  Email: ${email}`);
  console.log('');
}

/**
 * Print a block summary
 */
export function printBlockSummary(block: Block): void {
  const type = block.type;
  const id = block.id;
  const blockContent = getBlockContent(block);
  const hasChildren = block.has_children ? ' (has children)' : '';

  console.log(`[${type.toUpperCase()}] ${blockContent}`);
  console.log(`  ID: ${id}${hasChildren}`);
  console.log('');
}

/**
 * Extract block content for display
 */
export function getBlockContent(block: Block): string {
  const type = block.type;
  const blockType = (block as any)[type];

  if (!blockType) {
    return '';
  }

  if (blockType.rich_text) {
    return blockType.rich_text.map((rt: any) => rt.plain_text || rt.text?.content || '').join('');
  }

  if (type === 'divider') {
    return '---';
  }
  if (type === 'image') {
    return blockType.external?.url || blockType.file?.url || '[image]';
  }
  if (type === 'embed' || type === 'bookmark') {
    return blockType.url || '';
  }

  return '';
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}
