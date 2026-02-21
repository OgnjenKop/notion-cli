import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigurationError } from './errors';
import { redactSensitiveText } from './redaction';

const CONFIG_DIR = path.join(os.homedir(), '.notion-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface Config {
  token?: string;
  version?: string;
  verbose?: boolean;
}

export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function isJsonErrorMode(): boolean {
  return process.argv.includes('--json-errors');
}

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    const message = (error as Error).message || 'Unknown error';
    if (process.env.NOTION_STRICT_CONFIG === 'true') {
      throw new ConfigurationError(`Failed to read config file ${CONFIG_FILE}: ${message}`);
    }
    if (!isJsonErrorMode()) {
      console.error(redactSensitiveText(`Warning: Failed to read config file ${CONFIG_FILE}: ${message}`));
    }
  }
  return {};
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function getToken(): string | undefined {
  // Check environment variable first, then config file
  return process.env.NOTION_TOKEN || loadConfig().token;
}

export function setToken(token: string): void {
  const config = loadConfig();
  if (token) {
    config.token = token;
  } else {
    delete config.token;
  }
  saveConfig(config);
}

export function getVersion(): string {
  return loadConfig().version || '2025-09-03';
}

export function setVersion(version: string): void {
  const config = loadConfig();
  config.version = version;
  saveConfig(config);
}

export function isVerbose(): boolean {
  return process.env.NOTION_VERBOSE === 'true' || loadConfig().verbose || false;
}

export function setVerbose(verbose: boolean): void {
  const config = loadConfig();
  config.verbose = verbose;
  saveConfig(config);
}

export function logVerbose(message: string): void {
  if (isVerbose()) {
    console.error(`[DEBUG] ${message}`);
  }
}
