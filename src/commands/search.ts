import { Command } from 'commander';
import { NotionClient, SearchOptions } from '../lib/client';
import { formatOutput, printSuccess, throwCommandError } from '../lib/output';
import { validatePositiveInteger, validateEnum } from '../lib/option-validation';
import type { Page, Database } from '../lib/types';

export function createSearchCommand(): Command {
  const search = new Command('search')
    .description('Search for pages and databases in Notion')
    .argument('[query]', 'Search query text')
    .option('-t, --type <type>', 'Filter by type (page or database)')
    .option('-n, --page-size <number>', 'Number of results per page', '10')
    .option('--start-cursor <cursor>', 'Pagination cursor for next page')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action(
      async (
        query?: string,
        options?: {
          type?: string;
          pageSize: string;
          startCursor?: string;
          json?: boolean;
          quiet?: boolean;
        }
      ) => {
        try {
          // Validate page size (1-100)
          const pageSize = validatePositiveInteger(options?.pageSize || '10', 'Page size', {
            min: 1,
            max: 100,
          });

          // Validate type if provided
          if (options?.type) {
            validateEnum(options.type, ['page', 'database'], 'Type');
          }

          const client = new NotionClient();
          const searchOptions: SearchOptions = {};
          if (query !== undefined) {
            searchOptions.query = query;
          }
          if (options?.type) {
            searchOptions.filter = { property: 'object', value: options.type };
          }
          if (options?.startCursor) {
            searchOptions.startCursor = options.startCursor;
          }
          searchOptions.pageSize = pageSize;

          const result = await client.search(searchOptions);

          if (options?.json) {
            console.log(formatOutput(result, { json: true }));
            return;
          }

          if (result.results.length === 0) {
            if (!options?.quiet) {
              console.log('No results found.');
            }
            return;
          }

          printSuccess(`Found ${result.results.length} result(s)`, options?.quiet);
          console.log('');

          result.results.forEach((item: Page | Database) => {
            const pageOrDb = item as Page | Database;
            const titleProp = pageOrDb.properties?.title?.title;
            const nameProp = pageOrDb.properties?.Name?.title;
            const title =
              (Array.isArray(titleProp) && titleProp[0]?.plain_text) ||
              (Array.isArray(nameProp) && nameProp[0]?.plain_text) ||
              'Untitled';
            const type = pageOrDb.object;
            const id = pageOrDb.id;
            const url = (pageOrDb as Page).url || 'N/A';

            console.log(`[${type.toUpperCase()}] ${title}`);
            console.log(`  ID: ${id}`);
            console.log(`  URL: ${url}`);
            console.log('');
          });

          if (result.has_more) {
            console.log(
              `ℹ More results available. Use --start-cursor "${result.next_cursor}" to fetch the next page.`
            );
          }
        } catch (error) {
          throwCommandError('Error searching', error);
        }
      }
    );

  return search;
}
