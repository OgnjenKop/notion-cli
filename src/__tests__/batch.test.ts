import { Command } from 'commander';

describe('Batch Command Error Handling', () => {
  const originalExitCode = process.exitCode;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.exitCode = undefined;
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
  });

  afterAll(() => {
    process.exitCode = originalExitCode;
  });

  it('should set non-zero exit code when an operation fails', async () => {
    jest.mock('fs', () => ({
      readFileSync: jest
        .fn()
        .mockReturnValue(
          JSON.stringify({ stopOnError: false, operations: [{ action: 'unknown_action' }] })
        ),
    }));

    jest.mock('../lib/client', () => ({
      NotionClient: jest.fn().mockImplementation(() => ({})),
    }));

    const batch: Command = require('../commands/batch').createBatchCommand();
    const run = batch.commands.find((c: Command) => c.name() === 'run')!;

    await run.parseAsync(['node', 'test', '-f', 'ops.json']);

    expect(process.exitCode).toBe(1);
    expect(process.exit).not.toHaveBeenCalled();
  });
});
