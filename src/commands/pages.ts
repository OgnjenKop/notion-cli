import { Command } from 'commander';
import { NotionClient } from '../lib/client';
import {
  formatOutput,
  printSuccess,
  printError,
  printPageSummary,
  getErrorMessage,
} from '../lib/output';
import { validateId } from '../lib/validation';
import {
  validatePositiveInteger,
  validateStringLength,
  validateUrlFormat,
  validateEnum,
} from '../lib/option-validation';

export function createPagesCommand(): Command {
  const pages = new Command('pages')
    .description('Manage Notion pages')
    .addCommand(createPageGetCommand())
    .addCommand(createPageCreateCommand())
    .addCommand(createPageUpdateCommand())
    .addCommand(createPageListCommand())
    .addCommand(createPageDeleteCommand())
    .addCommand(createPageDuplicateCommand());

  return pages;
}

function createPageGetCommand(): Command {
  return new Command('get')
    .argument('<pageId>', 'Page ID')
    .description('Get a page by ID')
    .option('--json', 'Output as JSON')
    .action(async (pageId: string, options?: { json?: boolean }) => {
      try {
        const client = new NotionClient();
        const page = await client.getPage(pageId);

        if (options?.json) {
          console.log(formatOutput(page, { json: true }));
        } else {
          printPageSummary(page);
        }
      } catch (error) {
        printError('Error getting page', getErrorMessage(error));
        process.exit(1);
      }
    });
}

function createPageCreateCommand(): Command {
  return new Command('create')
    .description('Create a new page')
    .requiredOption('-p, --parent <parent>', 'Parent page or database ID')
    .requiredOption('-t, --parent-type <type>', 'Parent type (page or database)', 'database')
    .option('--title <title>', 'Page title (for database pages)')
    .option('--content <content>', 'Initial page content (paragraph text)')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action(
      async (options: {
        parent: string;
        parentType: string;
        title?: string;
        content?: string;
        json?: boolean;
        quiet?: boolean;
      }) => {
        try {
          // Validate parent type
          validateEnum(options.parentType, ['page', 'database'], 'Parent type');

          // Validate parent ID format
          validateId(options.parent, 'Parent ID');

          // Validate title length if provided
          validateStringLength(options.title, 'Title', { max: 2000 });

          // Validate content length if provided
          validateStringLength(options.content, 'Content', { max: 2000 });

          const client = new NotionClient();

          const parent = {
            type: options.parentType,
            [`${options.parentType}_id`]: options.parent,
          };

          // Build properties based on parent type
          const properties: any = {};
          if (options.parentType === 'database') {
            // For database pages, title goes in the Name property
            if (options.title) {
              properties['Name'] = {
                title: [{ text: { content: options.title } }],
              };
            }
          } else {
            // For child pages, title is in the title property
            if (options.title) {
              properties['title'] = {
                title: [{ text: { content: options.title } }],
              };
            }
          }

          // Build content blocks
          const children: any[] = [];
          if (options.content) {
            children.push({
              object: 'block',
              paragraph: {
                rich_text: [{ text: { content: options.content } }],
              },
            });
          }

          const page = await client.createPage(
            parent,
            properties,
            children.length > 0 ? children : undefined
          );

          printSuccess('Page created successfully!', options?.quiet);
          console.log(`URL: ${page.url}`);

          if (options?.json) {
            console.log(formatOutput(page, { json: true }));
          }
        } catch (error) {
          printError('Error creating page', getErrorMessage(error));
          process.exit(1);
        }
      }
    );
}

function createPageUpdateCommand(): Command {
  return new Command('update')
    .argument('<pageId>', 'Page ID')
    .option('--title <title>', 'Update page title')
    .option('--archived', 'Archive the page')
    .option('--icon <emoji>', 'Set page icon (emoji)')
    .option('--cover <url>', 'Set page cover image URL')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .description('Update a page')
    .action(
      async (
        pageId: string,
        options: {
          title?: string;
          archived?: boolean;
          icon?: string;
          cover?: string;
          json?: boolean;
          quiet?: boolean;
        }
      ) => {
        try {
          // Validate title length if provided
          validateStringLength(options.title, 'Title', { max: 2000 });

          // Validate icon length if provided
          validateStringLength(options.icon, 'Icon', { max: 10 });

          // Validate cover URL if provided
          if (options.cover) {
            validateUrlFormat(options.cover, 'Cover URL');
          }

          const client = new NotionClient();

          const properties: any = {};
          if (options.title) {
            properties['Name'] = {
              title: [{ text: { content: options.title } }],
            };
          }

          const updates: any = { properties };
          if (options.archived !== undefined) {
            updates.archived = options.archived;
          }
          if (options.icon) {
            updates.icon = { type: 'emoji', emoji: options.icon };
          }
          if (options.cover) {
            updates.cover = { type: 'external', external: { url: options.cover } };
          }

          const page = await client.updatePageFull(pageId, updates);

          printSuccess('Page updated successfully!', options?.quiet);
          console.log(`URL: ${page.url}`);

          if (options?.json) {
            console.log(formatOutput(page, { json: true }));
          }
        } catch (error) {
          printError('Error updating page', getErrorMessage(error));
          process.exit(1);
        }
      }
    );
}

function createPageListCommand(): Command {
  return new Command('list')
    .argument('<databaseId>', 'Database ID')
    .option('-n, --page-size <number>', 'Number of results per page', '10')
    .option('--start-cursor <cursor>', 'Pagination cursor for next page')
    .option('--json', 'Output as JSON')
    .description('List pages from a database')
    .action(
      async (
        databaseId: string,
        options: { pageSize: string; startCursor?: string; json?: boolean }
      ) => {
        try {
          // Validate page size (1-100)
          const pageSize = validatePositiveInteger(options.pageSize, 'Page size', {
            min: 1,
            max: 100,
          });

          const client = new NotionClient();

          const result = await client.listPages(databaseId, pageSize, options?.startCursor);

          if (options?.json) {
            console.log(formatOutput(result, { json: true }));
            return;
          }

          if (result.results.length === 0) {
            console.log('No pages found in this database.');
            return;
          }

          console.log(`Found ${result.results.length} page(s):\n`);

          result.results.forEach((page: any) => {
            printPageSummary(page);
          });

          if (result.has_more) {
            console.log(
              `ℹ More results available. Use --start-cursor "${result.next_cursor}" to fetch the next page.`
            );
          }
        } catch (error) {
          printError('Error listing pages', getErrorMessage(error));
          process.exit(1);
        }
      }
    );
}

function createPageDeleteCommand(): Command {
  return new Command('delete')
    .argument('<pageId>', 'Page ID')
    .description('Archive (delete) a page')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action(async (pageId: string, options?: { quiet?: boolean }) => {
      try {
        const client = new NotionClient();
        const page = await client.deletePage(pageId);

        printSuccess('Page archived (deleted) successfully!', options?.quiet);
        console.log(`URL: ${page.url}`);
      } catch (error) {
        printError('Error archiving page', getErrorMessage(error));
        process.exit(1);
      }
    });
}

function createPageDuplicateCommand(): Command {
  return new Command('duplicate')
    .argument('<pageId>', 'Page ID to duplicate')
    .option('-p, --parent <parent>', 'New parent page ID (optional)')
    .option('--title <title>', 'New title for the duplicated page')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .description('Duplicate an existing page')
    .action(
      async (
        pageId: string,
        options: { parent?: string; title?: string; json?: boolean; quiet?: boolean }
      ) => {
        try {
          // Validate parent ID if provided
          if (options.parent) {
            validateId(options.parent, 'Parent ID');
          }

          const client = new NotionClient();

          let parent;
          if (options.parent) {
            parent = { type: 'page_id', page_id: options.parent };
          }

          const page = await client.duplicatePage(pageId, parent, options.title);

          printSuccess('Page duplicated successfully!', options?.quiet);
          console.log(`URL: ${page.url}`);

          if (options?.json) {
            console.log(formatOutput(page, { json: true }));
          }
        } catch (error) {
          printError('Error duplicating page', getErrorMessage(error));
          process.exit(1);
        }
      }
    );
}
