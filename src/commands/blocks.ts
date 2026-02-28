import { Command } from 'commander';
import { NotionClient } from '../lib/client';
import { formatOutput, printSuccess, printBlockSummary, throwCommandError } from '../lib/output';
import { VALID_COLORS, VALID_BLOCK_TYPES } from '../lib/validation';
import {
  validatePositiveInteger,
  validateStringLength,
  validateEnum,
  validateAtLeastOne,
  validateOnlyOne,
  validateRequired,
  validateUrlFormat,
} from '../lib/option-validation';
import { blocksToMarkdown } from '../lib/markdown';
import { Block } from '../lib/types';
import { fetchBlockTree } from '../lib/blocks-tree';

export function createBlocksCommand(): Command {
  const blocks = new Command('blocks')
    .description('Manage Notion blocks')
    .addCommand(createBlockGetCommand())
    .addCommand(createBlockListCommand())
    .addCommand(createBlockAppendCommand())
    .addCommand(createBlockDeleteCommand())
    .addCommand(createBlockUpdateCommand());

  return blocks;
}

function createBlockGetCommand(): Command {
  return new Command('get')
    .argument('<blockId>', 'Block ID')
    .description('Get a block by ID')
    .option('--json', 'Output as JSON')
    .action(async (blockId: string, options?: { json?: boolean }) => {
      try {
        const client = new NotionClient();
        const block = await client.getBlock(blockId);

        if (options?.json) {
          console.log(formatOutput(block, { json: true }));
        } else {
          printBlockSummary(block);
        }
      } catch (error) {
        throwCommandError('Error getting block', error);
      }
    });
}

function createBlockListCommand(): Command {
  return new Command('list')
    .argument('<blockId>', 'Block ID (use page ID for page content)')
    .option('-n, --page-size <number>', 'Number of results per page', '10')
    .option('--start-cursor <cursor>', 'Pagination cursor for next page')
    .option('--all', 'Fetch all blocks (automatically paginate through all results)')
    .option('--format <format>', 'Output format (json, markdown, text)', 'text')
    .option('-o, --output <file>', 'Write output to file (only with --format markdown)')
    .description('List children blocks of a block')
    .action(
      async (
        blockId: string,
        options: {
          pageSize: string;
          startCursor?: string;
          all?: boolean;
          format?: string;
          output?: string;
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

          // Fetch all blocks if --all flag is set
          let allBlocks: Block[] = [];
          let hasMore = false;
          let nextCursor: string | undefined = options.startCursor;

          if (options.all) {
            // Fetch all blocks with automatic pagination
            do {
              const result = await client.getBlockChildren(blockId, pageSize, nextCursor);
              allBlocks = allBlocks.concat(result.results);
              hasMore = result.has_more;
              nextCursor = result.next_cursor || undefined;
            } while (hasMore && nextCursor);
          } else {
            // Fetch single page
            const result = await client.getBlockChildren(blockId, pageSize, options.startCursor);
            allBlocks = result.results;
            hasMore = result.has_more;
            nextCursor = result.next_cursor || undefined;
          }

          // Handle --format json (legacy --json option)
          if (options.format === 'json') {
            console.log(JSON.stringify({ results: allBlocks, has_more: hasMore }, null, 2));
            return;
          }

          // Handle --format markdown
          if (options.format === 'markdown') {
            const tree = await fetchBlockTree(client, blockId, pageSize);
            const markdownContent = blocksToMarkdown(tree.blocks, tree.childrenById);

            if (options.output) {
              // Write to file
              const fs = await import('fs');
              const path = await import('path');
              const dir = path.dirname(options.output);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              fs.writeFileSync(options.output, markdownContent, 'utf-8');
              console.log(`Markdown written to: ${options.output}`);
            } else {
              console.log(markdownContent);
            }
            return;
          }

          // Default text format (human-readable)
          if (allBlocks.length === 0) {
            console.log('No blocks found.');
            return;
          }

          console.log(`Found ${allBlocks.length} block(s):\n`);

          allBlocks.forEach((block: Block) => {
            printBlockSummary(block);
          });

          if (hasMore && !options.all) {
            console.log(
              `ℹ More results available. Use --start-cursor "${nextCursor}" to fetch the next page.`
            );
          }
        } catch (error) {
          throwCommandError('Error listing blocks', error);
        }
      }
    );
}

function createBlockAppendCommand(): Command {
  return new Command('append')
    .argument('<blockId>', 'Parent block ID (use page ID to append to a page)')
    .requiredOption('-t, --type <type>', 'Block type')
    .option('--content <content>', 'Block content text')
    .option(
      '--color <color>',
      'Block color (default, gray, brown, orange, yellow, green, blue, purple, pink, red)'
    )
    .option('--checked', 'Mark as checked (for to_do blocks)')
    .option('--language <language>', 'Code language (for code blocks)', 'plain text')
    .option('--table-width <width>', 'Number of columns (for table blocks)')
    .option('--header', 'Show column headers (for table blocks)')
    .option('--cells <cells>', 'Table row cells as JSON array (for table_row blocks)')
    .option('--children <children>', 'Child blocks as JSON array (for synced_block blocks)')
    .option('--synced-from <blockId>', 'Synced from block ID (for synced_block, omit for original)')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .description('Append blocks to a parent block')
    .action(
      async (
        blockId: string,
        options: {
          type: string;
          content?: string;
          color?: string;
          checked?: boolean;
          language?: string;
          tableWidth?: string;
          header?: boolean;
          cells?: string;
          children?: string;
          syncedFrom?: string;
          json?: boolean;
          quiet?: boolean;
        }
      ) => {
        try {
          // Validate block type
          validateEnum(options.type, VALID_BLOCK_TYPES as unknown as string[], 'Block type');

          // Validate color if provided
          if (options.color) {
            validateEnum(options.color, VALID_COLORS as unknown as string[], 'Color');
          }

          // Validate content length if provided
          validateStringLength(options.content, 'Content', { max: 2000 });

          // Validate language if provided
          validateStringLength(options.language, 'Language', { max: 50 });

          const urlBlockTypes = new Set([
            'image',
            'video',
            'file',
            'audio',
            'embed',
            'bookmark',
            'pdf',
          ]);
          if (urlBlockTypes.has(options.type)) {
            validateRequired(options.content, 'Content URL');
            validateUrlFormat(options.content, 'Content URL');
          }

          // Validate table width if provided
          let tableWidth: number | undefined;
          if (options.tableWidth) {
            tableWidth = validatePositiveInteger(options.tableWidth, 'Table width', {
              min: 1,
              max: 100,
            });
          }

          // Validate cells JSON if provided
          let cells: string[] | undefined;
          if (options.cells) {
            try {
              cells = JSON.parse(options.cells);
              if (!Array.isArray(cells)) {
                throw new Error('Cells must be a JSON array of strings');
              }
            } catch (error) {
              throwCommandError('Invalid cells JSON', error);
            }
          }

          // Validate children JSON if provided
          let children: any[] | undefined;
          if (options.children) {
            try {
              children = JSON.parse(options.children);
              if (!Array.isArray(children)) {
                throw new Error('Children must be a JSON array of blocks');
              }
            } catch (error) {
              throwCommandError('Invalid children JSON', error);
            }
          }

          const client = new NotionClient();

          const blockData = {
            type: options.type,
            content: options.content,
            color: options.color,
            checked: options.checked,
            language: options.language,
            header: options.header,
            syncedFrom: options.syncedFrom,
            json: options.json,
            quiet: options.quiet,
            tableWidth,
            cells,
            children,
          };
          const childrenBlocks = [createBlock(blockData)];

          const result = await client.appendBlockChildren(blockId, childrenBlocks);

          printSuccess('Block appended successfully!', options?.quiet);
          console.log(`  ID: ${result.results?.[0]?.id || 'N/A'}`);

          if (options?.json) {
            console.log(formatOutput(result, { json: true }));
          }
        } catch (error) {
          throwCommandError('Error appending block', error);
        }
      }
    );
}

function createBlockDeleteCommand(): Command {
  return new Command('delete')
    .argument('<blockId>', 'Block ID to delete')
    .option('-q, --quiet', 'Suppress non-essential output')
    .description('Delete a block')
    .action(async (blockId: string, options?: { quiet?: boolean }) => {
      try {
        const client = new NotionClient();

        await client.deleteBlock(blockId);

        printSuccess('Block deleted successfully!', options?.quiet);
      } catch (error) {
        throwCommandError('Error deleting block', error);
      }
    });
}

function createBlockUpdateCommand(): Command {
  return new Command('update')
    .argument('<blockId>', 'Block ID to update')
    .option('--content <content>', 'Update block content text')
    .option('--checked', 'Mark as checked (for to_do blocks)')
    .option('--unchecked', 'Mark as unchecked (for to_do blocks)')
    .option('--color <color>', 'Block color')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .description('Update a block')
    .action(
      async (
        blockId: string,
        options: {
          content?: string;
          checked?: boolean;
          unchecked?: boolean;
          color?: string;
          json?: boolean;
          quiet?: boolean;
        }
      ) => {
        try {
          validateAtLeastOne(
            [
              { value: options.content, name: '--content' },
              { value: options.checked, name: '--checked' },
              { value: options.unchecked, name: '--unchecked' },
              { value: options.color, name: '--color' },
            ],
            'Block update'
          );

          if (options.checked !== undefined || options.unchecked !== undefined) {
            validateOnlyOne(
              [
                { value: options.checked, name: '--checked' },
                { value: options.unchecked, name: '--unchecked' },
              ],
              'Checked state'
            );
          }

          if (options.color) {
            validateEnum(options.color, VALID_COLORS as unknown as string[], 'Color');
          }

          const client = new NotionClient();

          const block = await client.getBlock(blockId);
          const blockType = block.type;

          const richTextTypes = new Set([
            'paragraph',
            'heading_1',
            'heading_2',
            'heading_3',
            'bulleted_list_item',
            'numbered_list_item',
            'to_do',
            'toggle',
            'quote',
            'callout',
            'code',
          ]);

          const colorTypes = new Set([
            'paragraph',
            'heading_1',
            'heading_2',
            'heading_3',
            'bulleted_list_item',
            'numbered_list_item',
            'to_do',
            'toggle',
            'quote',
            'callout',
          ]);

          if (options.content !== undefined && !richTextTypes.has(blockType)) {
            throw new Error(`Block type ${blockType} does not support text content updates.`);
          }

          if (options.color && !colorTypes.has(blockType)) {
            throw new Error(`Block type ${blockType} does not support color updates.`);
          }

          if (
            (options.checked !== undefined || options.unchecked !== undefined) &&
            blockType !== 'to_do'
          ) {
            throw new Error(`Block type ${blockType} does not support checked state updates.`);
          }

          const typePayload: any = {};

          // Handle content and color
          if (options.content !== undefined) {
            typePayload.rich_text = [{ text: { content: options.content } }];
          }
          if (options.color) {
            typePayload.color = options.color;
          }

          // Handle checked state - --checked takes precedence over --unchecked
          if (options.checked !== undefined) {
            typePayload.checked = options.checked;
          } else if (options.unchecked !== undefined) {
            typePayload.checked = !options.unchecked;
          }

          const result = await client.updateBlock(blockId, { [blockType]: typePayload });

          printSuccess('Block updated successfully!', options?.quiet);

          if (options?.json) {
            console.log(formatOutput(result, { json: true }));
          }
        } catch (error) {
          throwCommandError('Error updating block', error);
        }
      }
    );
}

// Helper function to create a block object
function createBlock(options: {
  type: string;
  content?: string | undefined;
  color?: string | undefined;
  checked?: boolean | undefined;
  language?: string | undefined;
  tableWidth?: number | undefined;
  header?: boolean | undefined;
  cells?: string[] | undefined;
  children?: any[] | undefined;
  syncedFrom?: string | undefined;
}): any {
  const richText = {
    rich_text: options.content ? [{ text: { content: options.content } }] : [],
  };

  const blockTypes: { [key: string]: any } = {
    paragraph: { paragraph: { ...richText, color: options.color || 'default' } },
    heading_1: {
      heading_1: { ...richText, color: options.color || 'default', is_toggleable: false },
    },
    heading_2: {
      heading_2: { ...richText, color: options.color || 'default', is_toggleable: false },
    },
    heading_3: {
      heading_3: { ...richText, color: options.color || 'default', is_toggleable: false },
    },
    bulleted_list_item: { bulleted_list_item: { ...richText, color: options.color || 'default' } },
    numbered_list_item: { numbered_list_item: { ...richText, color: options.color || 'default' } },
    to_do: {
      to_do: { ...richText, color: options.color || 'default', checked: options.checked || false },
    },
    quote: { quote: { ...richText, color: options.color || 'default' } },
    callout: { callout: { ...richText, color: options.color || 'default' } },
    code: { code: { ...richText, language: options.language || 'plain text' } },
    divider: { divider: {} },
    toggle: { toggle: richText },
    image: { image: { type: 'external', external: { url: options.content } } },
    embed: { embed: { url: options.content } },
    bookmark: { bookmark: { url: options.content } },
    video: { video: { type: 'external', external: { url: options.content } } },
    pdf: { pdf: { type: 'external', external: { url: options.content } } },
    file: { file: { type: 'external', external: { url: options.content } } },
    audio: { audio: { type: 'external', external: { url: options.content } } },
    // Table block - creates a table with specified width
    // Note: Table rows must be appended as children after table creation
    table: {
      table: {
        table_width: options.tableWidth || 2,
        has_column_header: options.header || false,
        has_row_header: false,
      },
    },
    // Table row block - must be a child of a table
    table_row: {
      table_row: {
        cells: (options.cells || []).map((cell) => (cell ? [{ text: { content: cell } }] : [])),
      },
    },
    // Column block - must be a child of column_list
    // Note: Content blocks must be appended as children after column creation
    column: {
      column: {},
    },
    // Column list block - contains multiple columns
    // Note: Column blocks must be appended as children after column_list creation
    column_list: {
      column_list: {},
    },
    // Synced block - can be synced across pages
    // Note: If synced_from is null, creates an original synced block
    synced_block: {
      synced_block: {
        synced_from: options.syncedFrom ? { type: 'block_id', block_id: options.syncedFrom } : null,
      },
    },
  };

  if (!blockTypes[options.type]) {
    throw new Error(
      `Unsupported block type: ${options.type}. Supported types: ${Object.keys(blockTypes).join(', ')}`
    );
  }

  const block: any = {
    object: 'block',
    type: options.type,
    ...blockTypes[options.type],
  };

  if (options.children && options.children.length > 0) {
    block.children = options.children;
  }

  return block;
}
