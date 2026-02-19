/**
 * Tests for NotionClient
 * Note: These tests mock the axios HTTP calls
 */

jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  };
  return {
    create: jest.fn(() => mockInstance),
  };
});

describe('NotionClient', () => {
  let NotionClient: typeof import('../lib/client').NotionClient;
  let mockGet: jest.Mock;
  let mockPost: jest.Mock;
  let mockPatch: jest.Mock;
  let mockDelete: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock config module
    jest.mock('../lib/config', () => ({
      getToken: () => 'test-token-123',
      getVersion: () => '2025-09-03',
      logVerbose: jest.fn(),
    }));

    const clientModule = require('../lib/client');
    NotionClient = clientModule.NotionClient;

    // Access the mock instance from axios.create
    const axiosMock = require('axios');
    const instance = axiosMock.create();
    mockGet = instance.get;
    mockPost = instance.post;
    mockPatch = instance.patch;
    mockDelete = instance.delete;
  });

  describe('constructor', () => {
    it('should create a client with valid token', () => {
      const client = new NotionClient();
      expect(client).toBeDefined();
      expect(require('axios').create).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search with no options', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          object: 'list',
          results: [],
          next_cursor: null,
          has_more: false,
        },
      });

      const client = new NotionClient();
      const result = await client.search();

      expect(mockPost).toHaveBeenCalledWith('/search', {});
      expect(result.results).toEqual([]);
    });

    it('should search with query', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          object: 'list',
          results: [{ id: 'page-1' }],
          next_cursor: null,
          has_more: false,
        },
      });

      const client = new NotionClient();
      const result = await client.search({ query: 'meeting notes' });

      expect(mockPost).toHaveBeenCalledWith('/search', {
        query: 'meeting notes',
      });
      expect(result.results).toHaveLength(1);
    });

    it('should handle pagination options', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          object: 'list',
          results: [],
          next_cursor: 'cursor-123',
          has_more: true,
        },
      });

      const client = new NotionClient();
      await client.search({
        startCursor: 'cursor-123',
        pageSize: 20,
      });

      expect(mockPost).toHaveBeenCalledWith('/search', {
        start_cursor: 'cursor-123',
        page_size: 20,
      });
    });
  });

  describe('getPage', () => {
    it('should get a page by ID', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          id: '12345678-1234-1234-1234-123456789012',
          object: 'page',
          properties: {
            Name: {
              title: [{ plain_text: 'Test Page' }],
            },
          },
          url: 'https://notion.so/page',
        },
      });

      const client = new NotionClient();
      const result = await client.getPage('12345678-1234-1234-1234-123456789012');

      expect(mockGet).toHaveBeenCalledWith('/pages/12345678-1234-1234-1234-123456789012');
      expect(result.id).toBe('12345678-1234-1234-1234-123456789012');
    });
  });

  describe('createPage', () => {
    it('should create a page in database', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          id: 'new-page-123',
          object: 'page',
          properties: {
            Name: {
              title: [{ plain_text: 'New Page' }],
            },
          },
        },
      });

      const client = new NotionClient();
      const result = await client.createPage(
        { type: 'database_id', database_id: 'db-123' },
        {
          Name: {
            title: [{ text: { content: 'New Page' } }],
          },
        }
      );

      expect(mockPost).toHaveBeenCalledWith('/pages', {
        parent: { type: 'database_id', database_id: 'db-123' },
        properties: {
          Name: {
            title: [{ text: { content: 'New Page' } }],
          },
        },
      });
      expect(result.id).toBe('new-page-123');
    });
  });

  describe('getDatabase', () => {
    it('should get a database by ID', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          id: '12345678-1234-1234-1234-123456789abc',
          object: 'database',
          title: [{ plain_text: 'Tasks' }],
          properties: {},
        },
      });

      const client = new NotionClient();
      const result = await client.getDatabase('12345678-1234-1234-1234-123456789abc');

      expect(mockGet).toHaveBeenCalledWith('/databases/12345678-1234-1234-1234-123456789abc');
      expect(result.title?.[0]?.plain_text).toBe('Tasks');
    });
  });

  describe('queryDatabase', () => {
    it('should query a database', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          object: 'list',
          results: [{ id: 'page-1' }],
          next_cursor: null,
          has_more: false,
        },
      });

      const client = new NotionClient();
      const result = await client.queryDatabase('12345678-1234-1234-1234-123456789abc', {
        filter: {
          property: 'Status',
          select: { equals: 'Done' },
        },
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/databases/12345678-1234-1234-1234-123456789abc/query',
        {
          filter: {
            property: 'Status',
            select: { equals: 'Done' },
          },
        }
      );
      expect(result.results).toHaveLength(1);
    });
  });

  describe('getBlockChildren', () => {
    it('should get block children', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          object: 'list',
          results: [
            {
              id: 'block-1',
              type: 'paragraph',
              paragraph: {
                rich_text: [{ plain_text: 'Hello' }],
              },
            },
          ],
          next_cursor: null,
          has_more: false,
        },
      });

      const client = new NotionClient();
      const result = await client.getBlockChildren('12345678-1234-1234-1234-123456789def');

      expect(mockGet).toHaveBeenCalledWith(
        '/blocks/12345678-1234-1234-1234-123456789def/children',
        {
          params: {},
        }
      );
      expect(result.results?.[0]?.type).toBe('paragraph');
    });
  });

  describe('appendBlockChildren', () => {
    it('should append blocks to a page', async () => {
      mockPatch.mockResolvedValueOnce({
        data: {
          object: 'list',
          results: [
            {
              id: 'new-block-1',
              type: 'paragraph',
            },
          ],
        },
      });

      const client = new NotionClient();
      await client.appendBlockChildren('12345678-1234-1234-1234-123456789def', [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: 'New content' } }],
          },
        } as any,
      ]);

      expect(mockPatch).toHaveBeenCalledWith(
        '/blocks/12345678-1234-1234-1234-123456789def/children',
        {
          children: expect.arrayContaining([expect.objectContaining({ type: 'paragraph' })]),
        }
      );
    });
  });

  describe('deleteBlock', () => {
    it('should delete a block', async () => {
      mockDelete.mockResolvedValueOnce({
        data: {
          id: 'block-123',
          type: 'paragraph',
          archived: true,
        },
      });

      const client = new NotionClient();
      const result = await client.deleteBlock('12345678-1234-1234-1234-123456789fed');

      expect(mockDelete).toHaveBeenCalledWith('/blocks/12345678-1234-1234-1234-123456789fed');
      expect(result.archived).toBe(true);
    });
  });

  describe('listUsers', () => {
    it('should list users', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          object: 'list',
          results: [
            { id: 'user-1', name: 'User 1' },
            { id: 'user-2', name: 'User 2' },
          ],
          next_cursor: null,
          has_more: false,
        },
      });

      const client = new NotionClient();
      const result = await client.listUsers();

      expect(mockGet).toHaveBeenCalledWith('/users', { params: {} });
      expect(result.results).toHaveLength(2);
    });
  });

  describe('getMe', () => {
    it('should get current bot user', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          id: 'bot-123',
          object: 'user',
          name: 'My Bot',
          type: 'bot',
          bot: { workspace_name: 'My Workspace' },
        },
      });

      const client = new NotionClient();
      const result = await client.getMe();

      expect(mockGet).toHaveBeenCalledWith('/users/me');
      expect(result.name).toBe('My Bot');
    });
  });

  describe('error handling', () => {
    it('should handle 404 error', async () => {
      const { NotFoundError } = require('../lib/errors');
      mockGet.mockRejectedValueOnce(
        new NotFoundError('Page', '12345678-1234-1234-1234-123456789012')
      );

      const client = new NotionClient();
      await expect(client.getPage('12345678-1234-1234-1234-123456789012')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should handle 401 authentication error', async () => {
      const { AuthenticationError } = require('../lib/errors');
      mockGet.mockRejectedValueOnce(new AuthenticationError('Invalid token'));

      const client = new NotionClient();
      await expect(client.getPage('12345678-1234-1234-1234-123456789012')).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should handle 429 rate limit error', async () => {
      const { RateLimitError } = require('../lib/errors');
      const error = new RateLimitError('Rate limit exceeded', 60);
      (error as any).response = { data: { message: 'Rate limited' } };

      // Rate limit errors are retried, so we need to exhaust all retries
      mockGet
        .mockRejectedValue(error)
        .mockRejectedValue(error)
        .mockRejectedValue(error)
        .mockRejectedValue(error);

      const client = new NotionClient();
      await expect(client.getPage('12345678-1234-1234-1234-123456789012')).rejects.toThrow(
        RateLimitError
      );
    });
  });

  describe('retry logic', () => {
    it('should retry on 500 server error', async () => {
      const { ServerError } = require('../lib/errors');
      mockGet
        .mockRejectedValueOnce(new ServerError('Internal server error'))
        .mockRejectedValueOnce(new ServerError('Internal server error'))
        .mockResolvedValueOnce({
          data: {
            id: 'page-123',
            object: 'page',
            properties: {},
          },
        });

      const client = new NotionClient();
      const result = await client.getPage('12345678-1234-1234-1234-123456789012');

      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(result.id).toBe('page-123');
    });

    it('should retry on 429 rate limit error', async () => {
      const { RateLimitError } = require('../lib/errors');
      mockGet
        .mockRejectedValueOnce(new RateLimitError('Rate limit exceeded'))
        .mockResolvedValueOnce({
          data: {
            id: 'page-123',
            object: 'page',
            properties: {},
          },
        });

      const client = new NotionClient();
      const result = await client.getPage('12345678-1234-1234-1234-123456789012');

      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(result.id).toBe('page-123');
    });

    it('should fail after max retries', async () => {
      const { ServerError } = require('../lib/errors');
      mockGet.mockRejectedValue(new ServerError('Persistent error'));

      const client = new NotionClient();
      await expect(client.getPage('12345678-1234-1234-1234-123456789012')).rejects.toThrow(
        ServerError
      );
      expect(mockGet).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('metrics tracking', () => {
    it('should track request count', async () => {
      const { getApiMetrics, resetApiMetrics } = require('../lib/client');
      resetApiMetrics();

      mockGet.mockResolvedValueOnce({
        data: {
          id: 'page-123',
          object: 'page',
          properties: {},
        },
      });

      const client = new NotionClient();
      await client.getPage('12345678-1234-1234-1234-123456789012');

      const metrics = getApiMetrics();
      expect(metrics.requestCount).toBe(1);
    });

    it('should track multiple requests', async () => {
      const { getApiMetrics, resetApiMetrics } = require('../lib/client');
      resetApiMetrics();

      mockGet.mockResolvedValue({
        data: {
          id: 'page-123',
          object: 'page',
          properties: {},
        },
      });

      const client = new NotionClient();
      await client.getPage('12345678-1234-1234-1234-123456789012');
      await client.getPage('12345678-1234-1234-1234-123456789012');
      await client.getPage('12345678-1234-1234-1234-123456789012');

      const metrics = getApiMetrics();
      expect(metrics.requestCount).toBe(3);
    });

    it('should track error count', async () => {
      const { getApiMetrics, resetApiMetrics } = require('../lib/client');
      const { ServerError } = require('../lib/errors');
      resetApiMetrics();

      const error = new ServerError('Error');
      (error as any).response = { data: { message: 'Error' } };
      mockGet.mockRejectedValue(error);

      const client = new NotionClient();
      try {
        await client.getPage('12345678-1234-1234-1234-123456789012');
      } catch {
        // Expected
      }

      const metrics = getApiMetrics();
      expect(metrics.errorCount).toBe(1);
    });

    it('should track retry count', async () => {
      const { getApiMetrics, resetApiMetrics } = require('../lib/client');
      const { ServerError } = require('../lib/errors');
      resetApiMetrics();

      const error = new ServerError('Error');
      (error as any).response = { data: { message: 'Error' } };

      mockGet
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: {
            id: 'page-123',
            object: 'page',
            properties: {},
          },
        });

      const client = new NotionClient();
      await client.getPage('12345678-1234-1234-1234-123456789012');

      const metrics = getApiMetrics();
      expect(metrics.retryCount).toBe(2);
    });
  });
});
