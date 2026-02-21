import { Command } from 'commander';
import { NotionClient } from '../lib/client';
import { formatOutput, printSuccess, throwCommandError } from '../lib/output';
import { validateStringLength, validateOnlyOne } from '../lib/option-validation';

export function createCommentsCommand(): Command {
  const comments = new Command('comments')
    .description('Manage Notion comments')
    .addCommand(createCommentCreateCommand())
    .addCommand(createCommentListCommand());

  return comments;
}

function createCommentCreateCommand(): Command {
  return new Command('create')
    .description('Create a comment on a page or discussion')
    .option('-p, --parent-page <pageId>', 'Parent page ID')
    .option('--discussion-id <id>', 'Discussion ID to reply to')
    .requiredOption('--text <text>', 'Comment text')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action(
      async (options: {
        parentPage?: string;
        discussionId?: string;
        text: string;
        json?: boolean;
        quiet?: boolean;
      }) => {
        try {
          // Validate that exactly one of parentPage or discussionId is provided
          validateOnlyOne(
            [
              { value: options.parentPage, name: '--parent-page' },
              { value: options.discussionId, name: '--discussion-id' },
            ],
            'Comment creation'
          );

          // Validate text length
          validateStringLength(options.text, 'Comment text', { min: 1, max: 2000 });

          const client = new NotionClient();

          const richText = [{ text: { content: options.text } }];

          let parent;
          if (options.parentPage) {
            parent = { type: 'page_id', page_id: options.parentPage };
          }

          const comment = await client.createComment(parent, richText, options.discussionId);

          printSuccess('Comment created successfully!', options?.quiet);

          if (options?.json) {
            console.log(formatOutput(comment, { json: true }));
          }
        } catch (error) {
          throwCommandError('Error creating comment', error);
        }
      }
    );
}

function createCommentListCommand(): Command {
  return new Command('list')
    .argument('<blockId>', 'Block ID (use page ID to list page comments)')
    .option('--json', 'Output as JSON')
    .description('List comments on a block or page')
    .action(async (blockId: string, options?: { json?: boolean }) => {
      try {
        const client = new NotionClient();

        const result = await client.getComments(blockId);

        if (options?.json) {
          console.log(formatOutput(result, { json: true }));
          return;
        }

        if (result.results.length === 0) {
          console.log('No comments found.');
          return;
        }

        console.log(`Found ${result.results.length} comment(s):\n`);

        result.results.forEach((comment: any) => {
          const text = comment.rich_text?.[0]?.plain_text || '[no text]';
          const id = comment.id;
          const createdBy = comment.created_by?.name || 'Unknown';
          const createdTime = comment.created_time
            ? new Date(comment.created_time).toLocaleDateString()
            : 'N/A';

          console.log(`[COMMENT] ${text}`);
          console.log(`  ID: ${id}`);
          console.log(`  By: ${createdBy}`);
          console.log(`  Date: ${createdTime}`);
          console.log('');
        });
      } catch (error) {
        throwCommandError('Error listing comments', error);
      }
    });
}
