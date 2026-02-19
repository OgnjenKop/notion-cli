import { Command } from 'commander';
import { getToken, setToken, setVersion, loadConfig, setVerbose } from '../lib/config';
import { NotionClient } from '../lib/client';
import { isValidVersion } from '../lib/validation';
import { getErrorMessage } from '../lib/output';

export function createAuthCommand(): Command {
  const auth = new Command('auth');

  auth
    .description('Manage authentication and configuration')
    .addCommand(createLoginCommand())
    .addCommand(createLogoutCommand())
    .addCommand(createStatusCommand())
    .addCommand(createSetVersionCommand())
    .addCommand(createToggleVerboseCommand());

  return auth;
}

function createLoginCommand(): Command {
  return new Command('login')
    .argument('[token]', 'Notion integration token')
    .description('Configure Notion API token')
    .action((token?: string) => {
      if (!token) {
        // Try to read from stdin or prompt
        console.log('Please provide your Notion integration token.');
        console.log('Usage: notion auth login <token>');
        console.log('\nYou can create a token at: https://www.notion.so/my-integrations');
        process.exit(1);
      }

      setToken(token);
      console.log('✓ Token saved successfully!');
      console.log('\nNext steps:');
      console.log('1. Go to https://www.notion.so/my-integrations');
      console.log('2. Find your integration and click "Configure"');
      console.log('3. Share the pages/databases you want to access with your integration');
    });
}

function createLogoutCommand(): Command {
  return new Command('logout').description('Remove stored Notion token').action(() => {
    setToken('');
    console.log('✓ Token removed successfully!');
  });
}

function createStatusCommand(): Command {
  return new Command('status').description('Check authentication status').action(async () => {
    const token = getToken();
    const config = loadConfig();
    const version = config.version || '2025-09-03';
    const verbose = config.verbose || false;

    console.log('Notion CLI Configuration:');
    console.log('-------------------------');
    console.log(`Token: ${token ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`API Version: ${version}`);
    console.log(`Verbose Mode: ${verbose ? 'On' : 'Off'}`);

    if (token) {
      try {
        const client = new NotionClient();
        const user = await client.getMe();
        console.log(`\nConnected as: ${user.name} (${user.type})`);
        console.log(`Workspace: ${user.bot?.workspace_name || 'N/A'}`);
      } catch (error) {
        console.log(`\n✗ Connection failed: ${getErrorMessage(error)}`);
      }
    }
  });
}

function createSetVersionCommand(): Command {
  return new Command('set-version')
    .argument('<version>', 'API version (e.g., 2025-09-03, 2022-06-28)')
    .description('Set Notion API version')
    .action((version: string) => {
      if (!isValidVersion(version)) {
        console.error('Invalid version format. Please use YYYY-MM-DD format (e.g., 2025-09-03)');
        process.exit(1);
      }

      setVersion(version);
      console.log(`✓ API version set to ${version}`);
    });
}

function createToggleVerboseCommand(): Command {
  return new Command('verbose')
    .argument('<status>', 'Enable or disable verbose mode (on/off)')
    .description('Enable or disable verbose/debug output')
    .action((status: string) => {
      const enabled = status.toLowerCase() === 'on' || status === 'true';
      setVerbose(enabled);
      console.log(`✓ Verbose mode ${enabled ? 'enabled' : 'disabled'}`);
      if (enabled) {
        console.log('  Detailed API request/response information will be logged.');
      }
    });
}
