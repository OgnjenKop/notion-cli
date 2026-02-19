/**
 * Tests for CLI commands structure
 * Tests that commands exist and accept expected options
 */

import { Command } from 'commander';

describe('CLI Commands - Structure', () => {
  describe('auth command', () => {
    it('should have auth command with subcommands', () => {
      const auth = require('../commands/auth').createAuthCommand();
      expect(auth.name()).toBe('auth');
      expect(auth.commands.length).toBeGreaterThan(0);
      expect(auth.commands.some((c: Command) => c.name() === 'login')).toBe(true);
      expect(auth.commands.some((c: Command) => c.name() === 'logout')).toBe(true);
      expect(auth.commands.some((c: Command) => c.name() === 'status')).toBe(true);
    });
  });

  describe('search command', () => {
    it('should have search command with options', () => {
      const search = require('../commands/search').createSearchCommand();
      expect(search.name()).toBe('search');
      expect(search.options.some((o: any) => o.flags.includes('--type'))).toBe(true);
      expect(search.options.some((o: any) => o.flags.includes('--page-size'))).toBe(true);
      expect(search.options.some((o: any) => o.flags.includes('--json'))).toBe(true);
    });
  });

  describe('pages command', () => {
    it('should have pages command with subcommands', () => {
      const pages = require('../commands/pages').createPagesCommand();
      expect(pages.name()).toBe('pages');
      expect(pages.commands.some((c: Command) => c.name() === 'get')).toBe(true);
      expect(pages.commands.some((c: Command) => c.name() === 'create')).toBe(true);
      expect(pages.commands.some((c: Command) => c.name() === 'update')).toBe(true);
      expect(pages.commands.some((c: Command) => c.name() === 'delete')).toBe(true);
    });
  });

  describe('databases command', () => {
    it('should have databases command with subcommands', () => {
      const databases = require('../commands/databases').createDatabasesCommand();
      expect(databases.name()).toBe('databases');
      expect(databases.commands.some((c: Command) => c.name() === 'get')).toBe(true);
      expect(databases.commands.some((c: Command) => c.name() === 'query')).toBe(true);
      expect(databases.commands.some((c: Command) => c.name() === 'create')).toBe(true);
    });
  });

  describe('blocks command', () => {
    it('should have blocks command with subcommands', () => {
      const blocks = require('../commands/blocks').createBlocksCommand();
      expect(blocks.name()).toBe('blocks');
      expect(blocks.commands.some((c: Command) => c.name() === 'get')).toBe(true);
      expect(blocks.commands.some((c: Command) => c.name() === 'list')).toBe(true);
      expect(blocks.commands.some((c: Command) => c.name() === 'append')).toBe(true);
    });
  });

  describe('users command', () => {
    it('should have users command with subcommands', () => {
      const users = require('../commands/users').createUsersCommand();
      expect(users.name()).toBe('users');
      expect(users.commands.some((c: Command) => c.name() === 'list')).toBe(true);
      expect(users.commands.some((c: Command) => c.name() === 'get')).toBe(true);
      expect(users.commands.some((c: Command) => c.name() === 'me')).toBe(true);
    });
  });

  describe('comments command', () => {
    it('should have comments command with subcommands', () => {
      const comments = require('../commands/comments').createCommentsCommand();
      expect(comments.name()).toBe('comments');
      expect(comments.commands.some((c: Command) => c.name() === 'create')).toBe(true);
      expect(comments.commands.some((c: Command) => c.name() === 'list')).toBe(true);
    });
  });

  describe('files command', () => {
    it('should have files command with subcommands', () => {
      const files = require('../commands/files').createFilesCommand();
      expect(files.name()).toBe('files');
      expect(files.commands.some((c: Command) => c.name() === 'upload')).toBe(true);
    });
  });

  describe('batch command', () => {
    it('should have batch command with run subcommand', () => {
      const batch = require('../commands/batch').createBatchCommand();
      expect(batch.name()).toBe('batch');
      expect(batch.commands.some((c: Command) => c.name() === 'run')).toBe(true);
    });
  });

  describe('metrics command', () => {
    it('should have metrics command with subcommands', () => {
      const metrics = require('../commands/metrics').createMetricsCommand();
      expect(metrics.name()).toBe('metrics');
      expect(metrics.commands.some((c: Command) => c.name() === 'show')).toBe(true);
      expect(metrics.commands.some((c: Command) => c.name() === 'reset')).toBe(true);
    });
  });
});
