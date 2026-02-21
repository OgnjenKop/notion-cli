/**
 * Tests for auth commands - structure and basic functionality
 */

import { Command } from 'commander';

describe('Auth Command', () => {
  let authCommand: Command;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock all dependencies
    jest.mock('../lib/config', () => ({
      getToken: jest.fn(),
      setToken: jest.fn(),
      loadConfig: jest.fn(),
      setVersion: jest.fn(),
      getVersion: jest.fn(),
      setVerbose: jest.fn(),
      isVerbose: jest.fn(),
    }));

    jest.mock('../lib/client', () => ({
      NotionClient: jest.fn().mockImplementation(() => ({
        getMe: jest.fn().mockResolvedValue({ name: 'Test Bot', type: 'bot' }),
      })),
    }));

    jest.mock('../lib/validation', () => ({
      isValidVersion: jest.fn().mockReturnValue(true),
    }));

    authCommand = require('../commands/auth').createAuthCommand();
  });

  describe('command structure', () => {
    it('should create auth command with subcommands', () => {
      expect(authCommand.name()).toBe('auth');
      expect(authCommand.description()).toBe('Manage authentication and configuration');
    });

    it('should have login subcommand', () => {
      const login = authCommand.commands.find((c: Command) => c.name() === 'login');
      expect(login).toBeDefined();
    });

    it('should have logout subcommand', () => {
      const logout = authCommand.commands.find((c: Command) => c.name() === 'logout');
      expect(logout).toBeDefined();
    });

    it('should have status subcommand', () => {
      const status = authCommand.commands.find((c: Command) => c.name() === 'status');
      expect(status).toBeDefined();
    });

    it('should have set-version subcommand', () => {
      const setVersion = authCommand.commands.find((c: Command) => c.name() === 'set-version');
      expect(setVersion).toBeDefined();
    });

    it('should have verbose subcommand', () => {
      const verbose = authCommand.commands.find((c: Command) => c.name() === 'verbose');
      expect(verbose).toBeDefined();
    });
  });
});

describe('Login Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  it('should show next steps information', async () => {
    const mockSetToken = jest.fn();
    jest.mock('../lib/config', () => ({
      setToken: mockSetToken,
    }));

    const auth: Command = require('../commands/auth').createAuthCommand();
    const login = auth.commands.find((c: Command) => c.name() === 'login')!;

    await login.parseAsync(['node', 'test', 'test-token']);

    // Help with next steps is shown
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Next steps'));
  });
});

describe('Logout Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('should call setToken with empty string', async () => {
    const mockSetToken = jest.fn();
    jest.mock('../lib/config', () => ({
      setToken: mockSetToken,
    }));

    const auth: Command = require('../commands/auth').createAuthCommand();
    const logout = auth.commands.find((c: Command) => c.name() === 'logout')!;

    await logout.parseAsync(['node', 'test', ]);

    expect(mockSetToken).toHaveBeenCalledWith('');
    expect(console.log).toHaveBeenCalledWith('✓ Token removed successfully!');
  });
});

describe('Verbose Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('should call setVerbose with false for "off"', async () => {
    const mockSetVerbose = jest.fn();
    jest.mock('../lib/config', () => ({
      setVerbose: mockSetVerbose,
    }));

    const auth: Command = require('../commands/auth').createAuthCommand();
    const verbose = auth.commands.find((c: Command) => c.name() === 'verbose')!;

    await verbose.parseAsync(['node', 'test', 'off']);

    expect(mockSetVerbose).toHaveBeenCalledWith(false);
  });
});

describe('Status Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  it('should exit with code 1 when connectivity check fails', async () => {
    jest.mock('../lib/config', () => ({
      getToken: jest.fn().mockReturnValue('test-token'),
      loadConfig: jest.fn().mockReturnValue({ version: '2025-09-03', verbose: false }),
      setToken: jest.fn(),
      setVersion: jest.fn(),
      setVerbose: jest.fn(),
    }));

    jest.mock('../lib/client', () => ({
      NotionClient: jest.fn().mockImplementation(() => ({
        getMe: jest.fn().mockRejectedValue(new Error('Invalid token')),
      })),
    }));

    jest.mock('../lib/validation', () => ({
      isValidVersion: jest.fn().mockReturnValue(true),
    }));

    const auth: Command = require('../commands/auth').createAuthCommand();
    const status = auth.commands.find((c: Command) => c.name() === 'status')!;

    await expect(status.parseAsync(['node', 'test', ])).rejects.toThrow(
      'Connection failed: Invalid token'
    );
  });
});
