import { Command } from 'commander';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as dns from 'dns/promises';
import * as https from 'https';
import { loadConfig } from '../lib/config';
import { NotionClient } from '../lib/client';
import { formatOutput } from '../lib/output';

type CheckStatus = 'pass' | 'warn' | 'fail';

interface DoctorCheck {
  name: string;
  status: CheckStatus;
  detail: string;
}

interface DoctorResult {
  ok: boolean;
  checks: DoctorCheck[];
}

function renderCheck(check: DoctorCheck): void {
  const prefix = check.status === 'pass' ? '✓' : check.status === 'warn' ? '⚠' : '✗';
  console.log(`${prefix} ${check.name}: ${check.detail}`);
}

function configFilePath(): string {
  return path.join(os.homedir(), '.notion-cli', 'config.json');
}

async function checkNetworkReachability(): Promise<DoctorCheck> {
  const host = 'api.notion.com';
  try {
    await dns.lookup(host);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DNS lookup failed';
    return {
      name: 'Network DNS',
      status: 'fail',
      detail: `Cannot resolve ${host} (${message})`,
    };
  }

  const requestResult = await new Promise<DoctorCheck>((resolve) => {
    const req = https.request(
      {
        method: 'HEAD',
        host,
        path: '/v1/users/me',
        timeout: 5000,
      },
      (res) => {
        resolve({
          name: 'Network HTTPS',
          status: 'pass',
          detail: `Connected to ${host} (HTTP ${res.statusCode ?? 'unknown'})`,
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('request timed out'));
    });

    req.on('error', (error: Error) => {
      resolve({
        name: 'Network HTTPS',
        status: 'fail',
        detail: `Cannot reach ${host} over HTTPS (${error.message})`,
      });
    });

    req.end();
  });

  return requestResult;
}

async function runDoctor(): Promise<DoctorResult> {
  const checks: DoctorCheck[] = [];
  const cfgPath = configFilePath();
  const fileExists = fs.existsSync(cfgPath);

  checks.push({
    name: 'Config file',
    status: fileExists ? 'pass' : 'warn',
    detail: fileExists ? `${cfgPath} is present` : `${cfgPath} not found (env token may still work)`,
  });

  let config: { token?: string; version?: string } = {};
  try {
    config = loadConfig();
    checks.push({
      name: 'Config parse',
      status: 'pass',
      detail: 'Configuration loaded successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Configuration load failed';
    checks.push({
      name: 'Config parse',
      status: 'fail',
      detail: message,
    });
  }

  const token = process.env.NOTION_TOKEN || config.token;
  const hasEnvToken = Boolean(process.env.NOTION_TOKEN);
  const hasConfigToken = Boolean(config.token);

  if (!token) {
    checks.push({
      name: 'API token',
      status: 'fail',
      detail: 'No token configured (use `notion auth login <token>` or NOTION_TOKEN)',
    });
  } else {
    checks.push({
      name: 'API token',
      status: 'pass',
      detail: `Token detected via ${hasEnvToken ? 'NOTION_TOKEN env var' : hasConfigToken ? 'config file' : 'runtime source'}`,
    });
  }

  const version = config.version || '2025-09-03';
  checks.push({
    name: 'API version',
    status: 'pass',
    detail: version,
  });

  const networkCheck = await checkNetworkReachability();
  checks.push(networkCheck);

  if (token && networkCheck.status === 'pass') {
    try {
      const client = new NotionClient();
      await client.getMe();
      checks.push({
        name: 'Authenticated API probe',
        status: 'pass',
        detail: 'Successfully called /users/me with current token',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown API error';
      checks.push({
        name: 'Authenticated API probe',
        status: 'fail',
        detail: message,
      });
    }
  } else if (token) {
    checks.push({
      name: 'Authenticated API probe',
      status: 'warn',
      detail: 'Skipped because network check failed',
    });
  }

  const hasFailures = checks.some((check) => check.status === 'fail');
  return {
    ok: !hasFailures,
    checks,
  };
}

export function createDoctorCommand(): Command {
  return new Command('doctor')
    .description('Run diagnostics for config, authentication, and API connectivity')
    .option('--json', 'Output diagnostics as JSON')
    .action(async (options?: { json?: boolean }) => {
      const result = await runDoctor();

      if (options?.json) {
        console.log(formatOutput(result, { json: true }));
      } else {
        console.log('Notion CLI Doctor');
        console.log('-----------------');
        result.checks.forEach(renderCheck);
        console.log('');
        console.log(result.ok ? 'Doctor status: healthy' : 'Doctor status: issues detected');
      }

      if (!result.ok) {
        process.exitCode = 1;
      }
    });
}
