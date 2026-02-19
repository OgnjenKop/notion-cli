/**
 * Tests for error classes and utilities
 */

import {
  NotionError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  ConflictError,
  ServerError,
  UnavailableError,
  ConfigurationError,
  FileError,
  createErrorFromStatus,
  extractErrorInfo,
} from '../lib/errors';

describe('Error Classes', () => {
  describe('NotionError (base class)', () => {
    it('should create a basic NotionError', () => {
      const error = new NotionError('Something went wrong');

      expect(error.name).toBe('NotionError');
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('NOTION_ERROR');
      expect(error.status).toBeUndefined();
      expect(error.response).toBeUndefined();
    });

    it('should create a NotionError with status and response', () => {
      const response = { error: 'test error' };
      const error = new NotionError('API error', 'API_ERROR', 500, response);

      expect(error.name).toBe('NotionError');
      expect(error.message).toBe('API error');
      expect(error.code).toBe('API_ERROR');
      expect(error.status).toBe(500);
      expect(error.response).toBe(response);
    });

    it('should have a stack trace', () => {
      const error = new NotionError('Test error');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should serialize to JSON', () => {
      const error = new NotionError('Test error', 'TEST', 400);
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'NotionError',
        message: 'Test error',
        code: 'TEST',
        status: 400,
        stack: expect.any(String),
      });
    });
  });

  describe('AuthenticationError', () => {
    it('should create with default message', () => {
      const error = new AuthenticationError();

      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe('Authentication failed');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.status).toBe(401);
    });

    it('should create with custom message and response', () => {
      const response = { error: 'invalid_token' };
      const error = new AuthenticationError('Token expired', response);

      expect(error.message).toBe('Token expired');
      expect(error.response).toBe(response);
    });
  });

  describe('AuthorizationError', () => {
    it('should create with default message', () => {
      const error = new AuthorizationError();

      expect(error.name).toBe('AuthorizationError');
      expect(error.message).toBe('Insufficient permissions');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.status).toBe(403);
    });

    it('should create with custom message', () => {
      const error = new AuthorizationError('Cannot access this database');
      expect(error.message).toBe('Cannot access this database');
    });
  });

  describe('NotFoundError', () => {
    it('should create with default resource and id', () => {
      const error = new NotFoundError();

      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('Resource not found: unknown');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.status).toBe(404);
    });

    it('should create with custom resource and id', () => {
      const error = new NotFoundError('Page', 'abc123');

      expect(error.message).toBe('Page not found: abc123');
    });
  });

  describe('RateLimitError', () => {
    it('should create with default message', () => {
      const error = new RateLimitError();

      expect(error.name).toBe('RateLimitError');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.status).toBe(429);
      expect(error.retryAfter).toBeUndefined();
    });

    it('should create with retryAfter value', () => {
      const error = new RateLimitError('Too many requests', 60);

      expect(error.retryAfter).toBe(60);
    });
  });

  describe('ValidationError', () => {
    it('should create without field', () => {
      const error = new ValidationError('Invalid input');

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create with field name', () => {
      const error = new ValidationError('is required', 'title');

      expect(error.message).toBe('title: is required');
    });
  });

  describe('ConflictError', () => {
    it('should create with default message', () => {
      const error = new ConflictError();

      expect(error.name).toBe('ConflictError');
      expect(error.message).toBe('Resource conflict');
      expect(error.code).toBe('CONFLICT_ERROR');
      expect(error.status).toBe(409);
    });

    it('should create with custom message and response', () => {
      const response = { duplicate: true };
      const error = new ConflictError('Duplicate entry', response);

      expect(error.message).toBe('Duplicate entry');
      expect(error.response).toBe(response);
    });
  });

  describe('ServerError', () => {
    it('should create with default message', () => {
      const error = new ServerError();

      expect(error.name).toBe('ServerError');
      expect(error.message).toBe('Internal server error');
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.status).toBe(500);
    });
  });

  describe('UnavailableError', () => {
    it('should create with default message', () => {
      const error = new UnavailableError();

      expect(error.name).toBe('UnavailableError');
      expect(error.message).toBe('Service unavailable');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.status).toBe(503);
    });
  });

  describe('ConfigurationError', () => {
    it('should create with message', () => {
      const error = new ConfigurationError('Config file corrupted');

      expect(error.name).toBe('ConfigurationError');
      expect(error.message).toBe('Config file corrupted');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.status).toBeUndefined();
    });
  });

  describe('FileError', () => {
    it('should create without path', () => {
      const error = new FileError('Cannot read file');

      expect(error.name).toBe('FileError');
      expect(error.message).toBe('Cannot read file');
      expect(error.code).toBe('FILE_ERROR');
    });

    it('should create with path', () => {
      const error = new FileError('File not found', '/path/to/file');

      expect(error.message).toBe('File not found: /path/to/file');
    });
  });
});

describe('createErrorFromStatus', () => {
  it('should create AuthenticationError for 401', () => {
    const error = createErrorFromStatus(401, 'Unauthorized');
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.status).toBe(401);
  });

  it('should create AuthorizationError for 403', () => {
    const error = createErrorFromStatus(403, 'Forbidden');
    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.status).toBe(403);
  });

  it('should create NotFoundError for 404', () => {
    const error = createErrorFromStatus(404, 'Not Found');
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.status).toBe(404);
  });

  it('should create ConflictError for 409', () => {
    const error = createErrorFromStatus(409, 'Conflict');
    expect(error).toBeInstanceOf(ConflictError);
    expect(error.status).toBe(409);
  });

  it('should create RateLimitError for 429', () => {
    const error = createErrorFromStatus(429, 'Rate Limited');
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.status).toBe(429);
  });

  it('should create ServerError for 500', () => {
    const error = createErrorFromStatus(500, 'Server Error');
    expect(error).toBeInstanceOf(ServerError);
    expect(error.status).toBe(500);
  });

  it('should create UnavailableError for 503', () => {
    const error = createErrorFromStatus(503, 'Unavailable');
    expect(error).toBeInstanceOf(UnavailableError);
    expect(error.status).toBe(503);
  });

  it('should create generic NotionError for other status codes', () => {
    const error = createErrorFromStatus(400, 'Bad Request');
    expect(error).toBeInstanceOf(NotionError);
    expect(error.code).toBe('HTTP_400');
    expect(error.status).toBe(400);
  });
});

describe('extractErrorInfo', () => {
  it('should extract info from axios error with response', () => {
    const axiosError = {
      response: {
        status: 404,
        data: {
          message: 'Page not found',
          code: 'object_not_found',
        },
      },
    };

    const info = extractErrorInfo(axiosError);

    expect(info).toEqual({
      message: 'Page not found',
      status: 404,
      code: 'object_not_found',
      response: {
        message: 'Page not found',
        code: 'object_not_found',
      },
    });
  });

  it('should extract info from axios error with nested error object', () => {
    const axiosError = {
      response: {
        status: 401,
        data: {
          error: {
            message: 'Invalid token',
            code: 'invalid_token',
          },
        },
      },
    };

    const info = extractErrorInfo(axiosError);

    expect(info.message).toBe('Invalid token');
    expect(info.status).toBe(401);
    expect(info.code).toBe('invalid_token');
  });

  it('should handle axios error with request but no response', () => {
    const axiosError = {
      request: {},
      response: undefined,
    };

    const info = extractErrorInfo(axiosError);

    expect(info.message).toBe('No response received from server');
    expect(info.code).toBe('NETWORK_ERROR');
    expect(info.status).toBeUndefined();
  });

  it('should handle regular Error', () => {
    const error = new Error('Something went wrong');
    const info = extractErrorInfo(error);

    expect(info.message).toBe('Something went wrong');
    expect(info.status).toBeUndefined();
    expect(info.code).toBeUndefined();
  });

  it('should handle unknown error type', () => {
    const info = extractErrorInfo('string error');

    expect(info.message).toBe('Unknown error');
  });
});
