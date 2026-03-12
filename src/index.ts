#!/usr/bin/env node

import { Command } from 'commander';
import { CommanderError } from 'commander';
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
import { createDoctorCommand } from './commands/doctor';
import { CommandExecutionError } from './lib/errors';
import { getErrorMessage, printError } from './lib/output';
import { redactSensitiveText } from './lib/redaction';

const program = new Command();

program
  .name('notion')
  .description('A CLI tool for interacting with the Notion API')
  .version('1.0.0')
  .option('--json-errors', 'Output errors as JSON on stderr');
program.configureOutput({
  writeErr: () => {
    // Suppress commander's direct stderr writes so top-level rendering is consistent.
  },
});
program.exitOverride();

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
program.addCommand(createDoctorCommand());

function shouldOutputJsonErrors(): boolean {
  return process.argv.includes('--json-errors');
}

function normalizeDetail(title: string, detail?: string): string | undefined {
  if (!detail) {
    return detail;
  }
  const prefix = `${title}: `;
  return detail.startsWith(prefix) ? detail.slice(prefix.length) : detail;
}

function renderError(
  title: string,
  detail?: string,
  options?: { exitCode?: number; code?: string; status?: number }
): void {
  const safeTitle = redactSensitiveText(title);
  const safeDetail = detail ? redactSensitiveText(detail) : detail;

  if (shouldOutputJsonErrors()) {
    console.error(
      JSON.stringify(
        {
          error: {
            title: safeTitle,
            detail: normalizeDetail(safeTitle, safeDetail),
            code: options?.code,
            status: options?.status,
            exitCode: options?.exitCode ?? 1,
          },
        },
        null,
        2
      )
    );
    return;
  }
  printError(safeTitle, normalizeDetail(safeTitle, safeDetail));
}

function installGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason: unknown) => {
    renderError('Unhandled promise rejection', getErrorMessage(reason), { exitCode: 1 });
    process.exit(1);
  });

  process.on('uncaughtException', (error: Error) => {
    renderError('Uncaught exception', error.message, { exitCode: 1 });
    process.exit(1);
  });
}

function isBenignCommanderFlow(error: CommanderError): boolean {
  return error.code === 'commander.helpDisplayed' || error.code === 'commander.version';
}

async function main(): Promise<void> {
  installGlobalErrorHandlers();
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CommandExecutionError) {
      const errorOptions: { exitCode?: number; code?: string; status?: number } = {
        exitCode: error.exitCode,
      };
      if (error.code !== undefined) {
        errorOptions.code = error.code;
      }
      if (error.status !== undefined) {
        errorOptions.status = error.status;
      }
      renderError(error.title, error.detail, errorOptions);
      process.exitCode = error.exitCode;
      return;
    }

    if (error instanceof CommanderError) {
      if (isBenignCommanderFlow(error)) {
        process.exitCode = 0;
        return;
      }

      const exitCode = error.exitCode || 1;
      renderError('Command parsing error', error.message, {
        exitCode,
        code: error.code,
      });
      process.exitCode = exitCode;
      return;
    }

    renderError('Unexpected error', getErrorMessage(error), { exitCode: 1 });
    process.exitCode = 1;
  }
}

void main();
