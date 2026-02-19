#!/usr/bin/env node

import { Command } from 'commander';
import { createAuthCommand } from './commands/auth';
import { createSearchCommand } from './commands/search';
import { createPagesCommand } from './commands/pages';
import { createDatabasesCommand } from './commands/databases';
import { createBlocksCommand } from './commands/blocks';
import { createUsersCommand } from './commands/users';
import { createCommentsCommand } from './commands/comments';
import { createFilesCommand } from './commands/files';
import { createBatchCommand } from './commands/batch';
import { createMetricsCommand } from './commands/metrics';

const program = new Command();

program
  .name('notion')
  .description('A CLI tool for interacting with the Notion API')
  .version('1.0.0');

// Register commands
program.addCommand(createAuthCommand());
program.addCommand(createSearchCommand());
program.addCommand(createPagesCommand());
program.addCommand(createDatabasesCommand());
program.addCommand(createBlocksCommand());
program.addCommand(createUsersCommand());
program.addCommand(createCommentsCommand());
program.addCommand(createFilesCommand());
program.addCommand(createBatchCommand());
program.addCommand(createMetricsCommand());

program.parse();
