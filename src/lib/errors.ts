/**
 * Custom error classes for Notion CLI
 */

/**
 * Base error class for all Notion CLI errors
 */
export class NotionError extends Error {
  public readonly code: string;
  public readonly status?: number | undefined;
  public readonly response?: unknown;

  constructor(
    message: string,
    code: string = 'NOTION_ERROR',
    status?: number | undefined,
    response?: unknown
  ) {
    super(message);
    this.name = 'NotionError';
    this.code = code;
    if (status !== undefined) {
      this.status = status;
    }
    if (response !== undefined) {
      this.response = response;
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotionError);
    }
  }

  /**
   * Convert error to a plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      stack: this.stack,
    };
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends NotionError {
  constructor(message: string = 'Authentication failed', response?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', 401, response);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when authorization fails (insufficient permissions)
 */
export class AuthorizationError extends NotionError {
  constructor(message: string = 'Insufficient permissions', response?: unknown) {
    super(message, 'AUTHORIZATION_ERROR', 403, response);
    this.name = 'AuthorizationError';
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends NotionError {
  constructor(
    resource: string = 'Resource',
    id: string = 'unknown',
    response?: unknown,
    message?: string
  ) {
    super(message || `${resource} not found: ${id}`, 'NOT_FOUND', 404, response);
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends NotionError {
  public readonly retryAfter?: number | undefined;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number | undefined) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
  }
}

/**
 * Error thrown for invalid request data
 */
export class ValidationError extends NotionError {
  constructor(message: string, field?: string) {
    super(field ? `${field}: ${message}` : message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when a conflict occurs (e.g., duplicate resource)
 */
export class ConflictError extends NotionError {
  constructor(message: string = 'Resource conflict', response?: unknown) {
    super(message, 'CONFLICT_ERROR', 409, response);
    this.name = 'ConflictError';
  }
}

/**
 * Error thrown for internal server errors
 */
export class ServerError extends NotionError {
  constructor(message: string = 'Internal server error', response?: unknown) {
    super(message, 'SERVER_ERROR', 500, response);
    this.name = 'ServerError';
  }
}

/**
 * Error thrown when the API is unavailable
 */
export class UnavailableError extends NotionError {
  constructor(message: string = 'Service unavailable', response?: unknown) {
    super(message, 'SERVICE_UNAVAILABLE', 503, response);
    this.name = 'UnavailableError';
  }
}

/**
 * Error thrown for configuration issues
 */
export class ConfigurationError extends NotionError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown for file operations
 */
export class FileError extends NotionError {
  constructor(message: string, path?: string) {
    super(path ? `${message}: ${path}` : message, 'FILE_ERROR');
    this.name = 'FileError';
  }
}

/**
 * Error thrown by command handlers for user-facing CLI failures.
 * The top-level CLI parser catches this and renders standardized output.
 */
export class CommandExecutionError extends Error {
  public readonly title: string;
  public readonly detail?: string | undefined;
  public readonly exitCode: number;
  public readonly code?: string | undefined;
  public readonly status?: number | undefined;
  public readonly cause?: unknown;

  constructor(
    title: string,
    detail?: string | undefined,
    options?: {
      exitCode?: number;
      code?: string | undefined;
      status?: number | undefined;
      cause?: unknown;
    }
  ) {
    super(detail ? `${title}: ${detail}` : title);
    this.name = 'CommandExecutionError';
    this.title = title;
    this.exitCode = options?.exitCode ?? 1;
    if (detail !== undefined) {
      this.detail = detail;
    }
    if (options?.code !== undefined) {
      this.code = options.code;
    }
    if (options?.status !== undefined) {
      this.status = options.status;
    }
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

/**
 * Map HTTP status codes to appropriate error classes
 */
export function createErrorFromStatus(
  status: number,
  message: string,
  response?: unknown
): NotionError {
  switch (status) {
    case 401:
      return new AuthenticationError(message, response);
    case 403:
      return new AuthorizationError(message, response);
    case 404:
      return new NotFoundError('Resource', 'unknown', response, message);
    case 409:
      return new ConflictError(message, response);
    case 429:
      return new RateLimitError(message);
    case 500:
      return new ServerError(message, response);
    case 503:
      return new UnavailableError(message, response);
    default:
      return new NotionError(message, `HTTP_${status}`, status, response);
  }
}

/**
 * Extract error information from axios error response
 */
export function extractErrorInfo(error: unknown): {
  message: string;
  status?: number;
  code?: string;
  response?: unknown;
} {
  const axiosError = error as any;

  if (axiosError.response) {
    const { status, data } = axiosError.response;
    const message = data?.message || data?.error?.message || `HTTP ${status}`;
    return {
      message,
      status,
      code: data?.code || data?.error?.code,
      response: data,
    };
  }

  if (axiosError.request) {
    return {
      message: 'No response received from server',
      code: 'NETWORK_ERROR',
    };
  }

  return {
    message: (error as Error).message || 'Unknown error',
  };
}
