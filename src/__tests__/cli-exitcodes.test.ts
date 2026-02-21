import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

function runCli(args: string[], extraEnv?: Record<string, string>): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/index.ts', ...args], {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, ...extraEnv },
    encoding: 'utf-8',
  });
}

describe('CLI Exit Codes (integration)', () => {
  it('should exit with code 1 when batch has failed operations', () => {
    const tempFile = path.join(os.tmpdir(), `notion-cli-batch-${Date.now()}.json`);
    fs.writeFileSync(
      tempFile,
      JSON.stringify({ stopOnError: false, operations: [{ action: 'unknown_action' }] }),
      'utf-8'
    );

    const result = runCli(['batch', 'run', '-f', tempFile], { NOTION_TOKEN: 'dummy-token' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Operation failed');

    fs.unlinkSync(tempFile);
  });

  it('should exit with code 1 on invalid auth set-version input', () => {
    const result = runCli(['auth', 'set-version', 'invalid']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid version format');
  });
});
