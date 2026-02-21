/**
 * Tests for config module
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock fs and os
jest.mock('fs');
jest.mock('os');
jest.mock('path');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedOs = os as jest.Mocked<typeof os>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('Config Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockedOs.homedir.mockReturnValue('/home/user');
    mockedPath.join.mockImplementation((...args) => args.join('/'));
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.mkdirSync.mockImplementation(() => undefined);
  });

  describe('ensureConfigDir', () => {
    it('should create config directory if it does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const { ensureConfigDir } = require('../lib/config');
      ensureConfigDir();

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/home/user/.notion-cli', {
        recursive: true,
      });
    });

    it('should not create directory if it already exists', () => {
      mockedFs.existsSync.mockReturnValue(true);

      const { ensureConfigDir } = require('../lib/config');
      ensureConfigDir();

      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('loadConfig', () => {
    it('should return empty config if file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const { loadConfig } = require('../lib/config');
      const config = loadConfig();

      expect(config).toEqual({});
    });

    it('should load config from file', () => {
      const configData = {
        token: 'test-token',
        version: '2025-09-03',
        verbose: true,
      };
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(configData));

      const { loadConfig } = require('../lib/config');
      const config = loadConfig();

      expect(config).toEqual(configData);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        '/home/user/.notion-cli/config.json',
        'utf-8'
      );
    });

    it('should return empty config if file is corrupted', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('invalid json');

      const { loadConfig } = require('../lib/config');
      const config = loadConfig();

      expect(config).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Failed to read config file')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', () => {
      const configData = {
        token: 'test-token',
        version: '2025-09-03',
      };

      const { saveConfig } = require('../lib/config');
      saveConfig(configData);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        '/home/user/.notion-cli/config.json',
        JSON.stringify(configData, null, 2),
        'utf-8'
      );
    });

    it('should create config directory before saving', () => {
      const { saveConfig } = require('../lib/config');
      saveConfig({ token: 'test' });

      expect(mockedFs.mkdirSync).toHaveBeenCalled();
    });
  });

  describe('getToken', () => {
    beforeEach(() => {
      delete process.env.NOTION_TOKEN;
    });

    it('should return token from environment variable', () => {
      process.env.NOTION_TOKEN = 'env-token';

      const { getToken } = require('../lib/config');
      const token = getToken();

      expect(token).toBe('env-token');
    });

    it('should return token from config if env var not set', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify({ token: 'config-token' }));

      const { getToken } = require('../lib/config');
      const token = getToken();

      expect(token).toBe('config-token');
    });

    it('should return undefined if no token configured', () => {
      const { getToken } = require('../lib/config');
      const token = getToken();

      expect(token).toBeUndefined();
    });
  });

  describe('setToken', () => {
    it('should set token in config', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const { setToken } = require('../lib/config');
      setToken('new-token');

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        '/home/user/.notion-cli/config.json',
        expect.stringContaining('"token": "new-token"'),
        'utf-8'
      );
    });

    it('should delete token when set to empty', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({ token: 'old-token', version: '2025-09-03' })
      );

      const { setToken } = require('../lib/config');
      setToken('');

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        '/home/user/.notion-cli/config.json',
        expect.not.stringContaining('"token"'),
        'utf-8'
      );
    });
  });

  describe('getVersion', () => {
    it('should return version from config', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify({ version: '2022-06-28' }));

      const { getVersion } = require('../lib/config');
      const version = getVersion();

      expect(version).toBe('2022-06-28');
    });

    it('should return default version if not configured', () => {
      const { getVersion } = require('../lib/config');
      const version = getVersion();

      expect(version).toBe('2025-09-03');
    });
  });

  describe('setVersion', () => {
    it('should set version in config', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const { setVersion } = require('../lib/config');
      setVersion('2022-06-28');

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        '/home/user/.notion-cli/config.json',
        expect.stringContaining('"version": "2022-06-28"'),
        'utf-8'
      );
    });
  });

  describe('isVerbose', () => {
    beforeEach(() => {
      delete process.env.NOTION_VERBOSE;
    });

    it('should return true if env var is set to true', () => {
      process.env.NOTION_VERBOSE = 'true';

      const { isVerbose } = require('../lib/config');
      const verbose = isVerbose();

      expect(verbose).toBe(true);
    });

    it('should return false if env var is not set', () => {
      const { isVerbose } = require('../lib/config');
      const verbose = isVerbose();

      expect(verbose).toBe(false);
    });

    it('should return verbose from config', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify({ verbose: true }));

      const { isVerbose } = require('../lib/config');
      const verbose = isVerbose();

      expect(verbose).toBe(true);
    });
  });

  describe('setVerbose', () => {
    it('should set verbose in config', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const { setVerbose } = require('../lib/config');
      setVerbose(true);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        '/home/user/.notion-cli/config.json',
        expect.stringContaining('"verbose": true'),
        'utf-8'
      );
    });
  });

  describe('logVerbose', () => {
    it('should log message when verbose is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      process.env.NOTION_VERBOSE = 'true';

      // Need to re-import after setting env var
      jest.resetModules();
      const { logVerbose } = require('../lib/config');
      logVerbose('Test message');

      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Test message');
      consoleSpy.mockRestore();
      delete process.env.NOTION_VERBOSE;
    });

    it('should not log message when verbose is disabled', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      delete process.env.NOTION_VERBOSE;

      jest.resetModules();
      const { logVerbose } = require('../lib/config');
      logVerbose('Test message');

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
