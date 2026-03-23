export function readEnvString(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function readFirstEnvString(
  ...values: Array<string | undefined>
): string | undefined {
  for (const value of values) {
    const normalized = readEnvString(value);

    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

export function readMongoDbNameFromUri(uri?: string): string | undefined {
  if (!uri?.startsWith('mongodb')) {
    return undefined;
  }

  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\/+/, '').trim();

    return pathname ? decodeURIComponent(pathname) : undefined;
  } catch {
    return undefined;
  }
}

export function readEnvBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return defaultValue;
  }

  if (['1', 'true', 'yes', 'on', 'ssl'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export function readEnvNumber(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function readEnvList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
