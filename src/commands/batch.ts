import { Command } from 'commander';
import * as fs from 'fs';
import { NotionClient } from '../lib/client';
import { formatOutput, printSuccess, printError, printInfo, getErrorMessage } from '../lib/output';

export function createBatchCommand(): Command {
  const batch = new Command('batch')
    .description('Execute batch operations')
    .addCommand(createBatchRunCommand());

  return batch;
}

function createBatchRunCommand(): Command {
  return new Command('run')
    .description('Run batch operations from a JSON file')
    .requiredOption('-f, --file <file>', 'JSON file with batch operations')
    .option('--dry-run', 'Show what would be executed without making changes')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action(
      async (options: { file: string; dryRun?: boolean; json?: boolean; quiet?: boolean }) => {
        try {
          // Read and parse the batch file
          let batchData: any;
          try {
            const content = fs.readFileSync(options.file, 'utf-8');
            batchData = JSON.parse(content);
          } catch (e: any) {
            printError('Error reading batch file', e.message);
            process.exit(1);
          }

          const operations = batchData.operations || [];
          if (operations.length === 0) {
            printError('Validation error', 'No operations found in batch file');
            process.exit(1);
          }

          if (!options.quiet) {
            console.log(`Found ${operations.length} operation(s) to execute\n`);
          }

          const client = new NotionClient();
          const results: any[] = [];

          for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            const opNum = i + 1;

            if (!options.quiet) {
              console.log(`[${opNum}/${operations.length}] Executing: ${op.action}`);
            }

            if (options.dryRun) {
              if (!options.quiet) {
                console.log(`  [DRY RUN] Would execute: ${JSON.stringify(op)}`);
              }
              results.push({ operation: op, status: 'dry_run' });
              continue;
            }

            try {
              const result = await executeOperation(client, op);
              results.push({ operation: op, status: 'success', result });

              if (!options.quiet) {
                printSuccess('Success');
              }
            } catch (error) {
              const errorMsg = getErrorMessage(error);
              results.push({ operation: op, status: 'error', error: errorMsg });

              printError('Operation failed', errorMsg);

              // Continue with next operation even if one fails
              if (batchData.stopOnError) {
                printInfo('Stopping due to error (stopOnError: true)');
                break;
              }
            }
          }

          if (options.json) {
            console.log(formatOutput({ results }, { json: true }));
          } else if (!options.quiet) {
            const successCount = results.filter((r) => r.status === 'success').length;
            const errorCount = results.filter((r) => r.status === 'error').length;
            console.log(`\nBatch complete: ${successCount} succeeded, ${errorCount} failed`);
          }
        } catch (error) {
          printError('Error executing batch', getErrorMessage(error));
          process.exit(1);
        }
      }
    );
}

async function executeOperation(client: NotionClient, op: any): Promise<any> {
  switch (op.action) {
    case 'create_page':
      return client.createPage(op.parent, op.properties, op.children);

    case 'update_page':
      return client.updatePageFull(op.pageId, op.updates);

    case 'delete_page':
      return client.deletePage(op.pageId);

    case 'get_page':
      return client.getPage(op.pageId);

    case 'append_block':
      return client.appendBlockChildren(op.blockId, op.blocks);

    case 'delete_block':
      return client.deleteBlock(op.blockId);

    case 'query_database':
      return client.queryDatabase(op.databaseId, op.query);

    case 'search':
      return client.search({ query: op.query, filter: op.filter });

    case 'create_comment':
      // parent is optional when using discussion_id
      return client.createComment(op.parent || undefined, op.rich_text, op.discussion_id);

    default: {
      const error = new Error(`Unknown operation: ${op.action}`);
      (error as any).cause = op;
      throw error;
    }
  }
}
