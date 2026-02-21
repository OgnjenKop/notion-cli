import { redactSensitiveText, redactSensitiveValue, stringifyRedacted } from '../lib/redaction';

describe('redaction utilities', () => {
  it('redacts bearer tokens and environment assignments in text', () => {
    const input = 'Authorization: Bearer abc123 NOTION_TOKEN=secret_abc123';
    const output = redactSensitiveText(input);

    expect(output).toContain('Bearer [REDACTED]');
    expect(output).toContain('NOTION_TOKEN=[REDACTED]');
    expect(output).not.toContain('abc123');
  });

  it('redacts sensitive keys in nested objects', () => {
    const input = {
      token: 'secret_abc123',
      nested: {
        authorization: 'Bearer abc123',
        message: 'ok',
      },
    };

    const output = redactSensitiveValue(input) as Record<string, unknown>;
    expect(output.token).toBe('[REDACTED]');
    expect(output.nested).toEqual({
      authorization: '[REDACTED]',
      message: 'ok',
    });
  });

  it('redacts query-string tokens during stringify', () => {
    const output = stringifyRedacted({
      url: 'https://example.com/callback?access_token=abc123&ok=true',
    });

    expect(output).toContain('access_token=[REDACTED]');
    expect(output).not.toContain('abc123');
  });
});
