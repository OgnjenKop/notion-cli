import { Command } from 'commander';
import { NotionClient } from '../lib/client';
import { formatOutput, printSuccess, throwCommandError } from '../lib/output';
import { validateId } from '../lib/validation';
import { validateStringLength, validateUrlFormat } from '../lib/option-validation';

export function createFilesCommand(): Command {
  const files = new Command('files')
    .description('Manage Notion files and media')
    .addCommand(createFileUploadCommand());

  return files;
}

function createFileUploadCommand(): Command {
  return new Command('upload')
    .description('Upload a file to Notion (beta)')
    .requiredOption('-p, --parent <pageId>', 'Parent page ID')
    .requiredOption('--url <url>', 'File URL (external)')
    .option('--caption <caption>', 'File caption')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action(
      async (options: {
        parent: string;
        url: string;
        caption?: string;
        json?: boolean;
        quiet?: boolean;
      }) => {
        try {
          // Validate parent ID format
          validateId(options.parent, 'Parent page ID');

          // Validate URL format
          validateUrlFormat(options.url, 'File URL');

          // Validate caption length if provided
          validateStringLength(options.caption, 'Caption', { max: 2000 });

          const client = new NotionClient();

          const fileBlock: any = {
            object: 'block',
            type: 'file',
            file: {
              type: 'external',
              external: { url: options.url },
            },
          };

          if (options.caption) {
            fileBlock.file.caption = [{ text: { content: options.caption } }];
          }

          const result = await client.appendBlockChildren(options.parent, [fileBlock]);

          printSuccess('File block created successfully!', options?.quiet);

          if (options?.json) {
            console.log(formatOutput(result, { json: true }));
          }
        } catch (error) {
          throwCommandError('Error uploading file', error);
        }
      }
    );
}
