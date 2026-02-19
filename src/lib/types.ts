/**
 * Type definitions for Notion API responses
 */

/**
 * Common Notion object types
 */
export type NotionObjectType = 'page' | 'database' | 'block' | 'user' | 'comment';

/**
 * Base interface for all Notion objects
 */
export interface NotionObject {
  object: NotionObjectType;
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by?: User;
  last_edited_by?: User;
}

/**
 * Page properties - flexible record type for dynamic properties
 */
export interface PageProperties {
  [key: string]: unknown;
}

/**
 * Database properties schema - flexible record type
 */
export interface DatabaseProperties {
  [key: string]: unknown;
}

/**
 * Block content for creating/updating blocks
 */
export interface BlockContent {
  [key: string]: unknown;
}

/**
 * User object
 */
export interface User extends NotionObject {
  object: 'user';
  name: string;
  avatar_url?: string;
  type: 'person' | 'bot';
  person?: {
    email?: string;
  };
  bot?: {
    email?: string;
    workspace_name?: string;
    workspace_icon?: string;
    workspace_logo?: string;
  };
}

/**
 * Rich text content
 */
export interface RichText {
  type?: 'text' | 'equation' | 'mention';
  text?: {
    content: string;
    link?: { url: string };
  };
  annotations?: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text?: string;
  href?: string;
}

/**
 * Page object
 */
export interface Page extends NotionObject {
  object: 'page';
  archived: boolean;
  cover?: {
    type: 'external' | 'file';
    external?: { url: string };
    file?: { url: string; expiry_time: string };
  };
  icon?: {
    type: 'emoji' | 'file' | 'external';
    emoji?: string;
    file?: { url: string };
    external?: { url: string };
  };
  properties: Record<string, PropertyValue>;
  parent: {
    type: 'database_id' | 'page_id' | 'workspace' | 'block_id';
    database_id?: string;
    page_id?: string;
    workspace?: true;
    block_id?: string;
  };
  url: string;
  public_url?: string;
}

/**
 * Property value types
 */
export interface PropertyValue {
  id: string;
  type: string;
  title?: RichText[];
  rich_text?: RichText[];
  number?: number;
  select?: { id: string; name: string; color?: string };
  multi_select?: { id: string; name: string; color?: string }[];
  status?: { id: string; name: string; color?: string };
  date?: { start: string; end?: string; time_zone?: string };
  checkbox?: boolean;
  url?: string;
  email?: string;
  phone_number?: string;
  people?: User[];
  files?: { name: string; type: string; file?: { url: string }; external?: { url: string } }[];
  relation?: { id: string }[];
  rollup?: { type: string; number?: number; string?: string; date?: { start: string } };
  created_time?: string;
  created_by?: User;
  last_edited_time?: string;
  last_edited_by?: User;
  formula?: {
    type: string;
    string?: string;
    number?: number;
    boolean?: boolean;
    date?: { start: string };
  };
  button?: Record<string, never>;
}

/**
 * Database object
 */
export interface Database extends NotionObject {
  object: 'database';
  title: RichText[];
  description: RichText[];
  icon?: {
    type: 'emoji' | 'file' | 'external';
    emoji?: string;
  };
  cover?: {
    type: 'external' | 'file';
    external?: { url: string };
  };
  properties: Record<string, PropertySchema>;
  parent: {
    type: 'page_id' | 'block_id' | 'workspace';
    page_id?: string;
    block_id?: string;
    workspace?: true;
  };
  url: string;
  public_url?: string;
  archived: boolean;
  is_inline: boolean;
}

/**
 * Property schema for databases
 */
export interface PropertySchema {
  id: string;
  name: string;
  type: string;
  title?: Record<string, never>;
  rich_text?: Record<string, never>;
  number?: { format: string };
  select?: { options: { id: string; name: string; color?: string }[] };
  multi_select?: { options: { id: string; name: string; color?: string }[] };
  status?: { options: { id: string; name: string; color?: string }[]; groups: any[] };
  date?: Record<string, never>;
  checkbox?: Record<string, never>;
  url?: Record<string, never>;
  email?: Record<string, never>;
  phone_number?: Record<string, never>;
  people?: Record<string, never>;
  files?: Record<string, never>;
  relation?: { database_id: string; type: string };
  rollup?: { relation_property_name: string; rollup_property_name: string; function: string };
  created_time?: Record<string, never>;
  created_by?: Record<string, never>;
  last_edited_time?: Record<string, never>;
  last_edited_by?: Record<string, never>;
  formula?: { expression: string };
  button?: Record<string, never>;
}

/**
 * Block object
 */
export interface Block extends NotionObject {
  object: 'block';
  type: string;
  archived: boolean;
  has_children: boolean;
  paragraph?: BlockContent;
  heading_1?: BlockContent & { is_toggleable?: boolean };
  heading_2?: BlockContent & { is_toggleable?: boolean };
  heading_3?: BlockContent & { is_toggleable?: boolean };
  bulleted_list_item?: BlockContent;
  numbered_list_item?: BlockContent;
  to_do?: BlockContent & { checked?: boolean };
  toggle?: BlockContent;
  quote?: BlockContent;
  callout?: BlockContent;
  code?: { rich_text: RichText[]; language: string; caption?: RichText[] };
  divider?: Record<string, never>;
  table_of_contents?: { caption?: RichText[] };
  breadcrumb?: Record<string, never>;
  column_list?: Record<string, never>;
  column?: Record<string, never>;
  link_preview?: { url: string };
  link_to_page?: { type: string; page_id?: string; database_id?: string; comment_id?: string };
  synced_block?: { synced_from: { type: string; block_id: string } | null; children?: Block[] };
  template?: { rich_text: RichText[]; children?: Block[] };
  image?: {
    type: string;
    file?: { url: string };
    external?: { url: string };
    caption?: RichText[];
  };
  video?: {
    type: string;
    file?: { url: string };
    external?: { url: string };
    caption?: RichText[];
  };
  pdf?: { type: string; file?: { url: string }; external?: { url: string }; caption?: RichText[] };
  file?: { type: string; file?: { url: string }; external?: { url: string }; caption?: RichText[] };
  audio?: {
    type: string;
    file?: { url: string };
    external?: { url: string };
    caption?: RichText[];
  };
  embed?: { url: string; caption?: RichText[] };
  bookmark?: { url: string; caption?: RichText[] };
  equation?: { equation: { expression: string }; caption?: RichText[] };
  table?: {
    table_width: number;
    table_header: boolean;
    has_column_header: boolean;
    has_row_header: boolean;
    children?: Block[];
  };
  table_row?: { cells: RichText[][] };
}

export interface BlockContent {
  rich_text: RichText[];
  color?: string;
  caption?: RichText[];
  icon?: string;
}

/**
 * Comment object
 */
export interface Comment extends NotionObject {
  object: 'comment';
  parent: {
    type: 'page_id' | 'block_id';
    page_id?: string;
    block_id?: string;
  };
  discussion_id: string;
  rich_text: RichText[];
}

/**
 * Search response
 */
export interface SearchResponse {
  object: 'list';
  results: (Page | Database)[];
  next_cursor: string | null;
  has_more: boolean;
  type: 'page_or_database';
  page_or_database?: Record<string, never>;
}

/**
 * List response (generic)
 */
export interface ListResponse<T> {
  object: 'list';
  results: T[];
  next_cursor: string | null;
  has_more: boolean;
  type?: string;
  [key: string]: any;
}

/**
 * API error response
 */
export interface ErrorResponse {
  object: 'error';
  status: number;
  code: string;
  message: string;
  requestId?: string;
}

/**
 * Block types supported by Notion
 */
export type BlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'to_do'
  | 'toggle'
  | 'quote'
  | 'callout'
  | 'code'
  | 'divider'
  | 'table_of_contents'
  | 'breadcrumb'
  | 'column_list'
  | 'column'
  | 'link_preview'
  | 'link_to_page'
  | 'synced_block'
  | 'template'
  | 'image'
  | 'video'
  | 'pdf'
  | 'file'
  | 'audio'
  | 'embed'
  | 'bookmark'
  | 'equation'
  | 'table'
  | 'table_row';

/**
 * Color options supported by Notion
 */
export type Color =
  | 'default'
  | 'gray'
  | 'brown'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'
  | 'gray_background'
  | 'brown_background'
  | 'orange_background'
  | 'yellow_background'
  | 'green_background'
  | 'blue_background'
  | 'purple_background'
  | 'pink_background'
  | 'red_background';
