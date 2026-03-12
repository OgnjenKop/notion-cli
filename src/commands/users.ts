import { Command } from 'commander';
import { NotionClient } from '../lib/client';
import { formatOutput, printUserSummary, throwCommandError } from '../lib/output';
import { validatePositiveInteger } from '../lib/option-validation';
import type { User } from '../lib/types';

export function createUsersCommand(): Command {
  const users = new Command('users')
    .description('Manage Notion users')
    .addCommand(createUserListCommand())
    .addCommand(createUserGetCommand())
    .addCommand(createUserMeCommand());

  return users;
}

function createUserListCommand(): Command {
  return new Command('list')
    .option('-n, --page-size <number>', 'Number of results per page', '10')
    .option('--start-cursor <cursor>', 'Pagination cursor for next page')
    .option('--json', 'Output as JSON')
    .description('List all users in the workspace')
    .action(async (options: { pageSize: string; startCursor?: string; json?: boolean }) => {
      try {
        const client = new NotionClient();
        const pageSize = validatePositiveInteger(options.pageSize, 'Page size', {
          min: 1,
          max: 100,
        });

        const result = await client.listUsers(pageSize, options?.startCursor);

        if (options?.json) {
          console.log(formatOutput(result, { json: true }));
          return;
        }

        if (result.results.length === 0) {
          console.log('No users found.');
          return;
        }

        console.log(`Found ${result.results.length} user(s):\n`);

        result.results.forEach((user: User) => {
          printUserSummary(user);
        });

        if (result.has_more) {
          console.log(
            `ℹ More results available. Use --start-cursor "${result.next_cursor}" to fetch the next page.`
          );
        }
      } catch (error) {
        throwCommandError('Error listing users', error);
      }
    });
}

function createUserGetCommand(): Command {
  return new Command('get')
    .argument('<userId>', 'User ID')
    .description('Get a user by ID')
    .option('--json', 'Output as JSON')
    .action(async (userId: string, options?: { json?: boolean }) => {
      try {
        const client = new NotionClient();
        const user = await client.getUser(userId);

        if (options?.json) {
          console.log(formatOutput(user, { json: true }));
        } else {
          printUserSummary(user);
        }
      } catch (error) {
        throwCommandError('Error getting user', error);
      }
    });
}

function createUserMeCommand(): Command {
  return new Command('me')
    .description('Get information about the current integration bot')
    .option('--json', 'Output as JSON')
    .action(async (options?: { json?: boolean }) => {
      try {
        const client = new NotionClient();
        const user = await client.getMe();

        if (options?.json) {
          console.log(formatOutput(user, { json: true }));
        } else {
          console.log('Current Integration:');
          console.log(`  Name: ${user.name}`);
          console.log(`  ID: ${user.id}`);
          console.log(`  Type: ${user.type}`);
          console.log(`  Workspace Name: ${user.bot?.workspace_name ?? 'N/A'}`);
        }
      } catch (error) {
        throwCommandError('Error getting bot info', error);
      }
    });
}
