import axios, { AxiosInstance, AxiosError } from 'axios';
import { getToken, getVersion, logVerbose } from './config';
import {
  SearchResponse,
  ListResponse,
  Page,
  Database,
  Block,
  User,
  Comment,
  PageProperties,
  DatabaseProperties,
  BlockContent,
  RichText,
} from './types';
import { validateId } from './validation';
import { NotionError, createErrorFromStatus, extractErrorInfo } from './errors';
import { redactSensitiveText, stringifyRedacted } from './redaction';

const BASE_URL = 'https://api.notion.com/v1';
const RATE_LIMIT_DELAY_MS = 350; // Notion allows ~3 requests/second, use 350ms for safety
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * Performance metrics for API calls
 */
export interface ApiMetrics {
  requestCount: number;
  totalDuration: number;
  averageDuration: number;
  slowestDuration: number;
  fastestDuration: number;
  retryCount: number;
  errorCount: number;
}

/**
 * Global metrics tracker
 */
let metrics: ApiMetrics = {
  requestCount: 0,
  totalDuration: 0,
  averageDuration: 0,
  slowestDuration: 0,
  fastestDuration: Infinity,
  retryCount: 0,
  errorCount: 0,
};

/**
 * Get current API metrics
 */
export function getApiMetrics(): ApiMetrics {
  return { ...metrics };
}

/**
 * Reset API metrics
 */
export function resetApiMetrics(): void {
  metrics = {
    requestCount: 0,
    totalDuration: 0,
    averageDuration: 0,
    slowestDuration: 0,
    fastestDuration: Infinity,
    retryCount: 0,
    errorCount: 0,
  };
}

export interface SearchOptions {
  query?: string | undefined;
  filter?: { property: string; value: string } | undefined;
  startCursor?: string | undefined;
  pageSize?: number | undefined;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof NotionError)) {
    return false;
  }
  // Retry on rate limit (429) or server errors (5xx)
  return error.status === 429 || (error.status || 0) >= 500;
}

/**
 * Calculate retry delay with exponential backoff and jitter
 */
function calculateRetryDelay(attempt: number): number {
  const exponentialDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
  return exponentialDelay + jitter;
}

export class NotionClient {
  private client: AxiosInstance;
  private lastRequestTime: number = 0;

  /**
   * Create a new Notion API client
   * @throws Error if no token is configured
   */
  constructor() {
    const token = getToken();
    const version = getVersion();

    if (!token) {
      throw new Error(
        'Notion token not found. Please run `notion auth login <token>` or set NOTION_TOKEN environment variable.'
      );
    }

    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': version,
        'Content-Type': 'application/json',
      },
    });

    // Add request/response logging interceptor
    this.client.interceptors.request.use(async (config) => {
      // Rate limiting: ensure minimum delay between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
        const delay = RATE_LIMIT_DELAY_MS - timeSinceLastRequest;
        logVerbose(`Rate limiting: waiting ${delay}ms`);
        await sleep(delay);
      }
      this.lastRequestTime = Date.now();

      logVerbose(redactSensitiveText(`Request: ${config.method?.toUpperCase()} ${config.url}`));
      if (config.data) {
        logVerbose(`Request body: ${stringifyRedacted(config.data, 2)}`);
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        logVerbose(`Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error: AxiosError) => {
        const errorInfo = extractErrorInfo(error);
        logVerbose(
          `Error: ${errorInfo.status || 'Unknown'} - ${stringifyRedacted(errorInfo.response)}`
        );

        // Create appropriate error based on status code
        if (errorInfo.status) {
          const notionError = createErrorFromStatus(
            errorInfo.status,
            errorInfo.message,
            errorInfo.response
          );
          return Promise.reject(notionError);
        }

        // Network or other error
        return Promise.reject(new NotionError(errorInfo.message, errorInfo.code));
      }
    );
  }

  /**
   * Make an API request with retry logic for transient errors
   */
  private async requestWithRetry<T>(requestFn: () => Promise<T>, operation: string): Promise<T> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    metrics.requestCount++;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      attempts++;
      try {
        const result = await requestFn();

        // Record successful request metrics
        const duration = Date.now() - startTime;
        metrics.totalDuration += duration;
        metrics.averageDuration = metrics.totalDuration / metrics.requestCount;
        metrics.slowestDuration = Math.max(metrics.slowestDuration, duration);
        metrics.fastestDuration = Math.min(metrics.fastestDuration, duration);

        if (attempts > 1) {
          metrics.retryCount += attempts - 1;
        }

        logVerbose(
          `API ${operation} completed in ${duration}ms${attempts > 1 ? ` (${attempts} attempts)` : ''}`
        );

        return result;
      } catch (error) {
        lastError = error as Error;

        if (!isRetryableError(error) || attempt === MAX_RETRIES) {
          metrics.errorCount++;
          break;
        }

        const delay = calculateRetryDelay(attempt);
        logVerbose(
          `Retry ${attempt + 1}/${MAX_RETRIES} for ${operation} after ${Math.round(delay)}ms`
        );
        await sleep(delay);
      }
    }

    const context = `${operation} failed after ${attempts} attempt(s)`;

    if (lastError instanceof Error) {
      if (!lastError.message.startsWith(context)) {
        lastError.message = `${context}: ${lastError.message}`;
      }
      throw lastError;
    }

    throw new NotionError(`${context}: Unknown error`, 'REQUEST_FAILED');
  }

  /**
   * Search for pages and databases in Notion
   * @param options - Search options including query, filter, and pagination
   * @returns Search results with pages and/or databases
   */
  async search(options: SearchOptions = {}): Promise<SearchResponse> {
    return this.requestWithRetry(async () => {
      const params: Record<string, unknown> = {};
      if (options.query !== undefined) {
        params.query = options.query;
      }
      if (options.filter) {
        params.filter = options.filter;
      }
      if (options.startCursor) {
        params.start_cursor = options.startCursor;
      }
      if (options.pageSize) {
        params.page_size = options.pageSize;
      }

      const response = await this.client.post('/search', params);
      return response.data as SearchResponse;
    }, 'search');
  }

  // Pages endpoints
  async getPage(pageId: string): Promise<Page> {
    validateId(pageId, 'Page ID');
    return this.requestWithRetry(async () => {
      const response = await this.client.get(`/pages/${pageId}`);
      return response.data as Page;
    }, 'getPage');
  }

  async createPage(
    parent: { type: string; [key: string]: string },
    properties: PageProperties,
    content?: BlockContent[]
  ): Promise<Page> {
    return this.requestWithRetry(async () => {
      const params: Record<string, unknown> = {
        parent,
        properties,
      };
      if (content && content.length > 0) {
        params.children = content;
      }

      const response = await this.client.post('/pages', params);
      return response.data as Page;
    }, 'createPage');
  }

  async updatePage(pageId: string, properties?: PageProperties, archived?: boolean): Promise<Page> {
    validateId(pageId, 'Page ID');
    return this.requestWithRetry(async () => {
      const params: Record<string, unknown> = {};
      if (properties) {
        params.properties = properties;
      }
      if (archived !== undefined) {
        params.archived = archived;
      }

      const response = await this.client.patch(`/pages/${pageId}`, params);
      return response.data as Page;
    }, 'updatePage');
  }

  async updatePageFull(pageId: string, params: Record<string, unknown>): Promise<Page> {
    validateId(pageId, 'Page ID');
    return this.requestWithRetry(async () => {
      const response = await this.client.patch(`/pages/${pageId}`, params);
      return response.data as Page;
    }, 'updatePageFull');
  }

  async deletePage(pageId: string): Promise<Page> {
    return this.updatePage(pageId, undefined, true);
  }

  async duplicatePage(
    pageId: string,
    parent?: { type: string; [key: string]: string },
    title?: string
  ): Promise<Page> {
    validateId(pageId, 'Page ID');
    return this.requestWithRetry(async () => {
      const params: Record<string, unknown> = {
        page_id: pageId,
      };
      if (parent) {
        params.parent = parent;
      }
      if (title) {
        params.title = title;
      }

      const response = await this.client.post(`/pages/${pageId}/duplicate`, params);
      return response.data as Page;
    }, 'duplicatePage');
  }

  async listPages(
    databaseId: string,
    pageSize?: number,
    startCursor?: string
  ): Promise<ListResponse<Page>> {
    validateId(databaseId, 'Database ID');
    const query: Record<string, unknown> = {};
    if (pageSize) {
      query.page_size = pageSize;
    }
    if (startCursor) {
      query.start_cursor = startCursor;
    }
    return this.queryDatabase(databaseId, query);
  }

  // Database endpoints
  async getDatabase(databaseId: string): Promise<Database> {
    validateId(databaseId, 'Database ID');
    return this.requestWithRetry(async () => {
      const response = await this.client.get(`/databases/${databaseId}`);
      return response.data as Database;
    }, 'getDatabase');
  }

  async queryDatabase(
    databaseId: string,
    query?: Record<string, unknown>
  ): Promise<ListResponse<Page>> {
    validateId(databaseId, 'Database ID');
    return this.requestWithRetry(async () => {
      const response = await this.client.post(`/databases/${databaseId}/query`, query || {});
      return response.data as ListResponse<Page>;
    }, 'queryDatabase');
  }

  async createDatabase(
    parent: { type: string; [key: string]: string },
    properties: DatabaseProperties,
    title?: RichText[]
  ): Promise<Database> {
    return this.requestWithRetry(async () => {
      const params: Record<string, unknown> = {
        parent,
        properties,
      };
      if (title) {
        params.title = title;
      }

      const response = await this.client.post('/databases', params);
      return response.data as Database;
    }, 'createDatabase');
  }

  async updateDatabase(
    databaseId: string,
    properties?: DatabaseProperties,
    title?: RichText[]
  ): Promise<Database> {
    return this.requestWithRetry(async () => {
      const params: Record<string, unknown> = {};
      if (properties) {
        params.properties = properties;
      }
      if (title) {
        params.title = title;
      }

      const response = await this.client.patch(`/databases/${databaseId}`, params);
      return response.data as Database;
    }, 'updateDatabase');
  }

  // Blocks endpoints
  async getBlockChildren(
    blockId: string,
    pageSize?: number,
    startCursor?: string
  ): Promise<ListResponse<Block>> {
    validateId(blockId, 'Block ID');
    return this.requestWithRetry(async () => {
      const params: Record<string, unknown> = {};
      if (pageSize) {
        params.page_size = pageSize;
      }
      if (startCursor) {
        params.start_cursor = startCursor;
      }

      const response = await this.client.get(`/blocks/${blockId}/children`, { params });
      return response.data as ListResponse<Block>;
    }, 'getBlockChildren');
  }

  async appendBlockChildren(
    blockId: string,
    children: BlockContent[]
  ): Promise<ListResponse<Block>> {
    validateId(blockId, 'Block ID');
    return this.requestWithRetry(async () => {
      const response = await this.client.patch(`/blocks/${blockId}/children`, {
        children,
      });
      return response.data as ListResponse<Block>;
    }, 'appendBlockChildren');
  }

  async deleteBlock(blockId: string): Promise<Block> {
    validateId(blockId, 'Block ID');
    return this.requestWithRetry(async () => {
      const response = await this.client.delete(`/blocks/${blockId}`);
      return response.data as Block;
    }, 'deleteBlock');
  }

  async getBlock(blockId: string): Promise<Block> {
    validateId(blockId, 'Block ID');
    return this.requestWithRetry(async () => {
      const response = await this.client.get(`/blocks/${blockId}`);
      return response.data as Block;
    }, 'getBlock');
  }

  async updateBlock(blockId: string, properties: Record<string, unknown>): Promise<Block> {
    validateId(blockId, 'Block ID');
    return this.requestWithRetry(async () => {
      const response = await this.client.patch(`/blocks/${blockId}`, properties);
      return response.data as Block;
    }, 'updateBlock');
  }

  // Users endpoints
  async getUser(userId: string): Promise<User> {
    validateId(userId, 'User ID');
    return this.requestWithRetry(async () => {
      const response = await this.client.get(`/users/${userId}`);
      return response.data as User;
    }, 'getUser');
  }

  async listUsers(pageSize?: number, startCursor?: string): Promise<ListResponse<User>> {
    return this.requestWithRetry(async () => {
      const params: Record<string, unknown> = {};
      if (pageSize) {
        params.page_size = pageSize;
      }
      if (startCursor) {
        params.start_cursor = startCursor;
      }

      const response = await this.client.get('/users', { params });
      return response.data as ListResponse<User>;
    }, 'listUsers');
  }

  async getMe(): Promise<User> {
    return this.requestWithRetry(async () => {
      const response = await this.client.get('/users/me');
      return response.data as User;
    }, 'getMe');
  }

  // Comments endpoint
  async createComment(
    parent: { type: string; [key: string]: string } | undefined,
    rich_text?: RichText[],
    discussion_id?: string
  ): Promise<Comment> {
    return this.requestWithRetry(async () => {
      const params: Record<string, unknown> = {};
      if (parent) {
        params.parent = parent;
      }
      if (rich_text) {
        params.rich_text = rich_text;
      }
      if (discussion_id) {
        params.discussion_id = discussion_id;
      }

      const response = await this.client.post('/comments', params);
      return response.data as Comment;
    }, 'createComment');
  }

  async getComments(blockId: string): Promise<ListResponse<Comment>> {
    return this.requestWithRetry(async () => {
      const params: Record<string, unknown> = { block_id: blockId };
      const response = await this.client.get('/comments', { params });
      return response.data as ListResponse<Comment>;
    }, 'getComments');
  }
}
