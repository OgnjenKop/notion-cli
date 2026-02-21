/**
 * Tests for pages commands
 */

import { Command } from 'commander';

describe('Pages Command', () => {
  let pagesCommand: Command;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    jest.mock('../lib/client', () => ({
      NotionClient: jest.fn().mockImplementation(() => ({
        getPage: jest.fn().mockResolvedValue({ id: 'page-1', url: 'https://notion.so/page-1' }),
        createPage: jest.fn().mockResolvedValue({ id: 'page-1', url: 'https://notion.so/page-1' }),
        updatePage: jest.fn().mockResolvedValue({ id: 'page-1', url: 'https://notion.so/page-1' }),
        updatePageFull: jest
          .fn()
          .mockResolvedValue({ id: 'page-1', url: 'https://notion.so/page-1' }),
        listPages: jest
          .fn()
          .mockResolvedValue({ results: [], has_more: false, next_cursor: null }),
        deletePage: jest.fn().mockResolvedValue({ id: 'page-1', url: 'https://notion.so/page-1' }),
        duplicatePage: jest
          .fn()
          .mockResolvedValue({ id: 'page-2', url: 'https://notion.so/page-2' }),
      })),
    }));

    jest.mock('../lib/output', () => ({
      formatOutput: jest.fn((data) => JSON.stringify(data)),
      printSuccess: jest.fn(),
      printError: jest.fn(),
      printPageSummary: jest.fn(),
      getErrorMessage: jest.fn((error) => (error instanceof Error ? error.message : String(error))),
      throwCommandError: jest.fn((title, error) => {
        throw new Error(`${title}: ${error instanceof Error ? error.message : String(error)}`);
      }),
    }));

    pagesCommand = require('../commands/pages').createPagesCommand();
  });

  describe('command structure', () => {
    it('should have correct name and description', () => {
      expect(pagesCommand.name()).toBe('pages');
      expect(pagesCommand.description()).toBe('Manage Notion pages');
    });

    it('should have get subcommand', () => {
      const get = pagesCommand.commands.find((c: Command) => c.name() === 'get');
      expect(get).toBeDefined();
    });

    it('should have create subcommand', () => {
      const create = pagesCommand.commands.find((c: Command) => c.name() === 'create');
      expect(create).toBeDefined();
    });

    it('should have update subcommand', () => {
      const update = pagesCommand.commands.find((c: Command) => c.name() === 'update');
      expect(update).toBeDefined();
    });

    it('should have list subcommand', () => {
      const list = pagesCommand.commands.find((c: Command) => c.name() === 'list');
      expect(list).toBeDefined();
    });

    it('should have delete subcommand', () => {
      const del = pagesCommand.commands.find((c: Command) => c.name() === 'delete');
      expect(del).toBeDefined();
    });

    it('should have duplicate subcommand', () => {
      const dup = pagesCommand.commands.find((c: Command) => c.name() === 'duplicate');
      expect(dup).toBeDefined();
    });
  });

  describe('pages get', () => {
    it('should execute with pageId', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const get = pages.commands.find((c: Command) => c.name() === 'get')!;

      await expect(
        get.parseAsync(['node', 'test', '12345678-1234-1234-1234-123456789012'])
      ).resolves.toBeDefined();
    });

    it('should accept json option', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const get = pages.commands.find((c: Command) => c.name() === 'get')!;

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

  describe('pages create', () => {
    it('should accept parent and parent-type options', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const create = pages.commands.find((c: Command) => c.name() === 'create')!;

      await expect(
        create.parseAsync([
          'node',
          'test',
          '-p',
          '12345678-1234-1234-1234-123456789012',
          '-t',
          'database',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept title option', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const create = pages.commands.find((c: Command) => c.name() === 'create')!;

      await expect(
        create.parseAsync([
          'node',
          'test',
          '-p',
          '12345678-1234-1234-1234-123456789012',
          '-t',
          'database',
          '--title',
          'New Page',
        ])
      ).resolves.toBeDefined();
    });
  });

  describe('pages update', () => {
    it('should execute with pageId', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const update = pages.commands.find((c: Command) => c.name() === 'update')!;

      await expect(
        update.parseAsync([
          'node',
          'test',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept title option', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const update = pages.commands.find((c: Command) => c.name() === 'update')!;

      await expect(
        update.parseAsync([
          'node',
          'test',
          '--title',
          'Updated Title',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept archived option', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const update = pages.commands.find((c: Command) => c.name() === 'update')!;

      await expect(
        update.parseAsync([
          'node',
          'test',
          '--archived',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });
  });

  describe('pages list', () => {
    it('should execute with databaseId', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const list = pages.commands.find((c: Command) => c.name() === 'list')!;

      await expect(
        list.parseAsync(['node', 'test', '12345678-1234-1234-1234-123456789012'])
      ).resolves.toBeDefined();
    });

    it('should accept page-size option', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const list = pages.commands.find((c: Command) => c.name() === 'list')!;

      await expect(
        list.parseAsync([
          'node',
          'test',
          '12345678-1234-1234-1234-123456789012',
          '-n',
          '20',
        ])
      ).resolves.toBeDefined();
    });
  });

  describe('pages delete', () => {
    it('should execute with pageId', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const del = pages.commands.find((c: Command) => c.name() === 'delete')!;

      await expect(
        del.parseAsync(['node', 'test', '12345678-1234-1234-1234-123456789012'])
      ).resolves.toBeDefined();
    });
  });

  describe('pages duplicate', () => {
    it('should execute with pageId', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const dup = pages.commands.find((c: Command) => c.name() === 'duplicate')!;

      await expect(
        dup.parseAsync([
          'node',
          'test',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept parent option', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const dup = pages.commands.find((c: Command) => c.name() === 'duplicate')!;

      await expect(
        dup.parseAsync([
          'node',
          'test',
          '-p',
          '12345678-1234-1234-1234-123456789abc',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept title option', async () => {
      const pages: Command = require('../commands/pages').createPagesCommand();
      const dup = pages.commands.find((c: Command) => c.name() === 'duplicate')!;

      await expect(
        dup.parseAsync([
          'node',
          'test',
          '--title',
          'Duplicated Page',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });
  });
});
