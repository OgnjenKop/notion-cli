/**
 * Tests for blocks commands
 */

import { Command } from 'commander';

describe('Blocks Command', () => {
  let blocksCommand: Command;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    jest.mock('../lib/client', () => ({
      NotionClient: jest.fn().mockImplementation(() => ({
        getBlock: jest.fn(),
        getBlockChildren: jest.fn(),
        appendBlockChildren: jest.fn(),
        updateBlock: jest.fn(),
        deleteBlock: jest.fn(),
      })),
    }));

    jest.mock('../lib/output', () => ({
      formatOutput: jest.fn((data) => JSON.stringify(data)),
      printSuccess: jest.fn(),
      printError: jest.fn(),
      printBlockSummary: jest.fn(),
      getErrorMessage: jest.fn((error) => (error instanceof Error ? error.message : String(error))),
    }));

    blocksCommand = require('../commands/blocks').createBlocksCommand();
  });

  describe('command structure', () => {
    it('should have correct name and description', () => {
      expect(blocksCommand.name()).toBe('blocks');
      expect(blocksCommand.description()).toBe('Manage Notion blocks');
    });

    it('should have get subcommand', () => {
      const get = blocksCommand.commands.find((c: Command) => c.name() === 'get');
      expect(get).toBeDefined();
    });

    it('should have list subcommand', () => {
      const list = blocksCommand.commands.find((c: Command) => c.name() === 'list');
      expect(list).toBeDefined();
    });

    it('should have append subcommand', () => {
      const append = blocksCommand.commands.find((c: Command) => c.name() === 'append');
      expect(append).toBeDefined();
    });

    it('should have update subcommand', () => {
      const update = blocksCommand.commands.find((c: Command) => c.name() === 'update');
      expect(update).toBeDefined();
    });

    it('should have delete subcommand', () => {
      const del = blocksCommand.commands.find((c: Command) => c.name() === 'delete');
      expect(del).toBeDefined();
    });
  });

  describe('blocks get', () => {
    it('should execute with blockId', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const get = blocks.commands.find((c: Command) => c.name() === 'get')!;

      await expect(
        get.parseAsync(['node', 'test', 'blocks', 'get', '12345678-1234-1234-1234-123456789012'])
      ).resolves.toBeDefined();
    });

    it('should accept json option', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const get = blocks.commands.find((c: Command) => c.name() === 'get')!;

      await expect(
        get.parseAsync([
          'node',
          'test',
          'blocks',
          'get',
          '--json',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });
  });

  describe('blocks list', () => {
    it('should execute with blockId', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const list = blocks.commands.find((c: Command) => c.name() === 'list')!;

      await expect(
        list.parseAsync(['node', 'test', 'blocks', 'list', '12345678-1234-1234-1234-123456789012'])
      ).resolves.toBeDefined();
    });

    it('should accept page-size option', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const list = blocks.commands.find((c: Command) => c.name() === 'list')!;

      await expect(
        list.parseAsync([
          'node',
          'test',
          'blocks',
          'list',
          '-n',
          '50',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept json option', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const list = blocks.commands.find((c: Command) => c.name() === 'list')!;

      await expect(
        list.parseAsync([
          'node',
          'test',
          'blocks',
          'list',
          '--json',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });
  });

  describe('blocks append', () => {
    it('should accept paragraph type with content', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const append = blocks.commands.find((c: Command) => c.name() === 'append')!;

      await expect(
        append.parseAsync([
          'node',
          'test',
          'blocks',
          'append',
          '-t',
          'paragraph',
          '--content',
          'Hello World',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept heading_1 type', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const append = blocks.commands.find((c: Command) => c.name() === 'append')!;

      await expect(
        append.parseAsync([
          'node',
          'test',
          'blocks',
          'append',
          '-t',
          'heading_1',
          '--content',
          'Section Title',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept to_do type with checked option', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const append = blocks.commands.find((c: Command) => c.name() === 'append')!;

      await expect(
        append.parseAsync([
          'node',
          'test',
          'blocks',
          'append',
          '-t',
          'to_do',
          '--content',
          'Task item',
          '--checked',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept code type with language option', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const append = blocks.commands.find((c: Command) => c.name() === 'append')!;

      await expect(
        append.parseAsync([
          'node',
          'test',
          'blocks',
          'append',
          '-t',
          'code',
          '--content',
          'console.log("hi")',
          '--language',
          'javascript',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept divider type', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const append = blocks.commands.find((c: Command) => c.name() === 'append')!;

      await expect(
        append.parseAsync([
          'node',
          'test',
          'blocks',
          'append',
          '-t',
          'divider',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept color option', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const append = blocks.commands.find((c: Command) => c.name() === 'append')!;

      await expect(
        append.parseAsync([
          'node',
          'test',
          'blocks',
          'append',
          '-t',
          'paragraph',
          '--content',
          'Colored text',
          '--color',
          'red',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });
  });

  describe('blocks update', () => {
    it('should execute with blockId', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const update = blocks.commands.find((c: Command) => c.name() === 'update')!;

      await expect(
        update.parseAsync([
          'node',
          'test',
          'blocks',
          'update',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept content option', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const update = blocks.commands.find((c: Command) => c.name() === 'update')!;

      await expect(
        update.parseAsync([
          'node',
          'test',
          'blocks',
          'update',
          '--content',
          'Updated content',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept checked option', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const update = blocks.commands.find((c: Command) => c.name() === 'update')!;

      await expect(
        update.parseAsync([
          'node',
          'test',
          'blocks',
          'update',
          '--checked',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });

    it('should accept unchecked option', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const update = blocks.commands.find((c: Command) => c.name() === 'update')!;

      await expect(
        update.parseAsync([
          'node',
          'test',
          'blocks',
          'update',
          '--unchecked',
          '12345678-1234-1234-1234-123456789012',
        ])
      ).resolves.toBeDefined();
    });
  });

  describe('blocks delete', () => {
    it('should execute with blockId', async () => {
      const blocks: Command = require('../commands/blocks').createBlocksCommand();
      const del = blocks.commands.find((c: Command) => c.name() === 'delete')!;

      await expect(
        del.parseAsync(['node', 'test', 'blocks', 'delete', '12345678-1234-1234-1234-123456789012'])
      ).resolves.toBeDefined();
    });
  });
});
