import { Command } from 'commander';
import { NotionClient } from '../lib/client';
import {
  formatOutput,
  printSuccess,
  printDatabaseSummary,
  printPageSummary,
  throwCommandError,
} from '../lib/output';
import { parseJson, validateId } from '../lib/validation';
import { validatePositiveInteger, validateStringLength } from '../lib/option-validation';
import type { DatabaseProperties, Page, Database } from '../lib/types';

export function createDatabasesCommand(): Command {
  const databases = new Command('databases')
    .description('Manage Notion databases')
    .addCommand(createDatabaseGetCommand())
    .addCommand(createDatabaseQueryCommand())
    .addCommand(createDatabaseListCommand())
    .addCommand(createDatabaseCreateCommand());

  return databases;
}

function createDatabaseGetCommand(): Command {
  return new Command('get')
    .argument('<databaseId>', 'Database ID')
    .description('Get a database by ID')
    .option('--json', 'Output as JSON')
    .action(async (databaseId: string, options?: { json?: boolean }) => {
      try {
        const client = new NotionClient();
        const database = await client.getDatabase(databaseId);

        if (options?.json) {
          console.log(formatOutput(database, { json: true }));
        } else {
          printDatabaseSummary(database);
        }
      } catch (error) {
        throwCommandError('Error getting database', error);
      }
    });
}

function createDatabaseQueryCommand(): Command {
  return new Command('query')
    .argument('<databaseId>', 'Database ID')
    .option(
      '-f, --filter <filter>',
      'Filter JSON (e.g., \'{"property":"Status","status":{"equals":"Done"}}\')'
    )
    .option(
      '-s, --sort <sort>',
      'Sort JSON (e.g., \'{"property":"Name","direction":"ascending"}\')'
    )
    .option('-n, --page-size <number>', 'Number of results per page', '10')
    .option('--start-cursor <cursor>', 'Pagination cursor for next page')
    .option('--json', 'Output as JSON')
    .description('Query a database')
    .action(
      async (
        databaseId: string,
        options: {
          filter?: string;
          sort?: string;
          pageSize: string;
          startCursor?: string;
          json?: boolean;
        }
      ) => {
        try {
          // Validate page size (1-100)
          const pageSize = validatePositiveInteger(options.pageSize, 'Page size', {
            min: 1,
            max: 100,
          });

          const client = new NotionClient();
          const query: Record<string, unknown> = {
            page_size: pageSize,
          };

          if (options.filter) {
            query.filter = parseJson(options.filter, 'filter');
          }

          if (options.sort) {
            const sortObj = parseJson(options.sort, 'sort');
            query.sorts = Array.isArray(sortObj) ? sortObj : [sortObj];
          }

          if (options.startCursor) {
            query.start_cursor = options.startCursor;
          }

          const result = await client.queryDatabase(databaseId, query);

          if (options?.json) {
            console.log(formatOutput(result, { json: true }));
            return;
          }

          if (result.results.length === 0) {
            console.log('No results found.');
            return;
          }

          console.log(`Found ${result.results.length} result(s):\n`);

          result.results.forEach((page: Page) => {
            printPageSummary(page);
          });

          if (result.has_more) {
            console.log(
              `ℹ More results available. Use --start-cursor "${result.next_cursor}" to fetch the next page.`
            );
          }
        } catch (error) {
          throwCommandError('Error querying database', error);
        }
      }
    );
}

function createDatabaseListCommand(): Command {
  return new Command('list')
    .description('List all databases (via search)')
    .option('--json', 'Output as JSON')
    .action(async (options?: { json?: boolean }) => {
      try {
        const client = new NotionClient();

        const result = await client.search({
          filter: { property: 'object', value: 'database' },
        });

        if (options?.json) {
          console.log(formatOutput(result, { json: true }));
          return;
        }

        if (result.results.length === 0) {
          console.log('No databases found.');
          return;
        }

        console.log(`Found ${result.results.length} database(s):\n`);

        result.results.forEach((item) => {
          if (item.object === 'database') {
            printDatabaseSummary(item as Database);
          }
        });
      } catch (error) {
        throwCommandError('Error listing databases', error);
      }
    });
}

function createDatabaseCreateCommand(): Command {
  return new Command('create')
    .description('Create a new database')
    .requiredOption('-p, --parent <parent>', 'Parent page ID')
    .requiredOption('--title <title>', 'Database title')
    .requiredOption(
      '--properties <properties>',
      'Database properties JSON (e.g., \'{"Name":{"title":{}},"Status":{"select":{"options":[{"name":"Done"}]}}}\')'
    )
    .option('--inline', 'Create as inline database')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action(
      async (options: {
        parent: string;
        title: string;
        properties: string;
        inline?: boolean;
        json?: boolean;
        quiet?: boolean;
      }) => {
        try {
          // Validate title length
          validateStringLength(options.title, 'Title', { min: 1, max: 2000 });

          // Validate properties JSON string length
          validateStringLength(options.properties, 'Properties', { max: 10000 });

          // Validate parent ID format
          validateId(options.parent, 'Parent page ID');

          const client = new NotionClient();

          const properties = parseJson(options.properties, 'properties') as DatabaseProperties;

          const parent = {
            type: 'page_id',
            page_id: options.parent,
          };

          const title = [{ text: { content: options.title } }];

          const database = await client.createDatabase(parent, properties, title, options.inline);

          printSuccess('Database created successfully!', options?.quiet);
          console.log(`URL: ${database.url}`);

          if (options?.json) {
            console.log(formatOutput(database, { json: true }));
          }
        } catch (error) {
          throwCommandError('Error creating database', error);
        }
      }
    );
}
