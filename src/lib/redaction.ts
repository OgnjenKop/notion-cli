const SENSITIVE_KEY_PATTERN = /(token|authorization|api[_-]?key|secret|password|cookie|session)/i;

function redactTextValue(input: string): string {
  let output = input;

  output = output.replace(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi, 'Bearer [REDACTED]');
  output = output.replace(/\bsecret_[a-z0-9]+\b/gi, 'secret_[REDACTED]');
  output = output.replace(
    /\b(NOTION_TOKEN|API_KEY|AUTHORIZATION)\s*=\s*([^\s]+)/gi,
    '$1=[REDACTED]'
  );
  output = output.replace(
    /([?&](?:token|api_key|apikey|access_token)=)([^&#\s]+)/gi,
    '$1[REDACTED]'
  );
  output = output.replace(/\b(xox[baprs]-[A-Za-z0-9-]+)\b/gi, '[REDACTED]');

  return output;
}

function redactUnknownValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') {
    return redactTextValue(value);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactUnknownValue(item, seen));
  }

  const output: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      output[key] = '[REDACTED]';
      continue;
    }
    output[key] = redactUnknownValue(raw, seen);
  }
  return output;
}

export function redactSensitiveText(input: string): string {
  return redactTextValue(input);
}

export function redactSensitiveValue(value: unknown): unknown {
  return redactUnknownValue(value, new WeakSet<object>());
}

export function stringifyRedacted(value: unknown, spacing: number = 0): string {
  try {
    return JSON.stringify(redactSensitiveValue(value), null, spacing);
  } catch {
    const fallback = typeof value === 'string' ? value : String(value);
    return redactTextValue(fallback);
  }
}
