/**
 * Tests for databases commands
 */

import { Command } from 'commander';

describe('Databases Command', () => {
  let databasesCommand: Command;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    jest.mock('../lib/client', () => ({
      NotionClient: jest.fn().mockImplementation(() => ({
        getDatabase: jest.fn().mockResolvedValue({ id: 'db-1', url: 'https://notion.so/db-1' }),
        queryDatabase: jest
          .fn()
          .mockResolvedValue({ results: [], has_more: false, next_cursor: null }),
        createDatabase: jest.fn().mockResolvedValue({ id: 'db-1', url: 'https://notion.so/db-1' }),
        search: jest.fn().mockResolvedValue({ results: [], has_more: false, next_cursor: null }),
      })),
    }));

    jest.mock('../lib/output', () => ({
      formatOutput: jest.fn((data) => JSON.stringify(data)),
      printSuccess: jest.fn(),
      printError: jest.fn(),
      printDatabaseSummary: jest.fn(),
      getErrorMessage: jest.fn((error) => (error instanceof Error ? error.message : String(error))),
      throwCommandError: jest.fn((title, error) => {
        throw new Error(`${title}: ${error instanceof Error ? error.message : String(error)}`);
      }),
    }));

    databasesCommand = require('../commands/databases').createDatabasesCommand();
  });

  describe('command structure', () => {
    it('should have correct name and description', () => {
      expect(databasesCommand.name()).toBe('databases');
      expect(databasesCommand.description()).toBe('Manage Notion databases');
    });

    it('should have get subcommand', () => {
      const get = databasesCommand.commands.find((c: Command) => c.name() === 'get');
      expect(get).toBeDefined();
    });

    it('should have query subcommand', () => {
      const query = databasesCommand.commands.find((c: Command) => c.name() === 'query');
      expect(query).toBeDefined();
    });

    it('should have create subcommand', () => {
      const create = databasesCommand.commands.find((c: Command) => c.name() === 'create');
      expect(create).toBeDefined();
    });

    it('should have list subcommand', () => {
      const list = databasesCommand.commands.find((c: Command) => c.name() === 'list');
      expect(list).toBeDefined();
    });
  });

  describe('databases get', () => {
    it('should execute with databaseId', async () => {
      const databases: Command = require('../commands/databases').createDatabasesCommand();
      const get = databases.commands.find((c: Command) => c.name() === 'get')!;

      await expect(
        get.parseAsync(['node', 'test', '12345678-1234-1234-1234-123456789012'])
      ).resolves.toBeDefined();
    });

    it('should accept json option', async () => {
      const databases: Command = require('../commands/databases').createDatabasesCommand();
      const get = databases.commands.find((c: Command) => c.name() === 'get')!;

      await expect(
        get.parseAsync([
          'node',
          'test',
          '--json',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });
  });

  describe('databases query', () => {
    it('should execute with databaseId', async () => {
      const databases: Command = require('../commands/databases').createDatabasesCommand();
      const query = databases.commands.find((c: Command) => c.name() === 'query')!;

      await expect(
        query.parseAsync([
          'node',
          'test',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept filter option', async () => {
      const databases: Command = require('../commands/databases').createDatabasesCommand();
      const query = databases.commands.find((c: Command) => c.name() === 'query')!;

      await expect(
        query.parseAsync([
          'node',
          'test',
          '-f',
          '{"property":"Status","select":{"equals":"Done"}}',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept sort option', async () => {
      const databases: Command = require('../commands/databases').createDatabasesCommand();
      const query = databases.commands.find((c: Command) => c.name() === 'query')!;

      await expect(
        query.parseAsync([
          'node',
          'test',
          '-s',
          '{"property":"Created","direction":"descending"}',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept page-size option', async () => {
      const databases: Command = require('../commands/databases').createDatabasesCommand();
      const query = databases.commands.find((c: Command) => c.name() === 'query')!;

      await expect(
        query.parseAsync([
          'node',
          'test',
          '-n',
          '20',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });
  });

  describe('databases create', () => {
    it('should accept all required options', async () => {
      const databases: Command = require('../commands/databases').createDatabasesCommand();
      const create = databases.commands.find((c: Command) => c.name() === 'create')!;

      await expect(
        create.parseAsync([
          'node',
          'test',
          '-p',
          '12345678-1234-1234-1234-123456789012',
          '--title',
          'Tasks',
          '--properties',
          '{"Name":{"title":{}}}',
        ])
      ).resolves.toBeDefined();
    });
  });

  describe('databases list', () => {
    it('should execute without arguments', async () => {
      const databases: Command = require('../commands/databases').createDatabasesCommand();
      const list = databases.commands.find((c: Command) => c.name() === 'list')!;

      await expect(list.parseAsync(['node', 'test'])).resolves.toBeDefined();
    });

    it('should accept json option', async () => {
      const databases: Command = require('../commands/databases').createDatabasesCommand();
      const list = databases.commands.find((c: Command) => c.name() === 'list')!;

      await expect(list.parseAsync(['node', 'test', '--json'])).resolves.toBeDefined();
    });
  });
});
