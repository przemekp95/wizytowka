import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import dotenv from 'dotenv';
import { Collection, MongoClient } from 'mongodb';

export type PortfolioStatus = 'draft' | 'published';

export type PortfolioFileItem = {
  title: string;
  title_en?: string;
  slug: string;
  href: string;
  desc: string;
  desc_en?: string;
  tags: string[];
  img: string;
  isLogo?: boolean;
  newTech?: boolean;
  category?: string;
  repoUrl?: string;
  dateFrom?: string;
  dateTo?: string | null;
  order?: number;
  status?: PortfolioStatus;
};

export type PortfolioMongoDocument = {
  _id: string;
  title: string;
  title_en?: string;
  slug: string;
  href: string;
  desc: string;
  desc_en?: string;
  tags: string[];
  img: string;
  isLogo?: boolean;
  newTech?: boolean;
  category?: string;
  repoUrl?: string;
  dateFrom?: Date;
  dateTo?: Date | null;
  order: number;
  status: PortfolioStatus;
  createdAt: Date;
  updatedAt: Date;
};

const backendDir = process.cwd();
const scriptsDir = path.join(backendDir, 'scripts');
const defaultDataFilePath = path.join(scriptsDir, 'portfolio.data.json');
const backendEnvPath = path.join(backendDir, '.env');

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

function readEnvString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function readFirstEnvString(
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

function readMongoDbNameFromUri(uri?: string): string | undefined {
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

function normalizeRequiredString(
  value: unknown,
  fieldName: string,
  options?: { allowEmpty?: boolean },
): string {
  if (typeof value !== 'string') {
    throw new Error(`Field "${fieldName}" must be a string.`);
  }

  const normalized = value.trim();
  if (!options?.allowEmpty && normalized.length === 0) {
    throw new Error(`Field "${fieldName}" cannot be empty.`);
  }

  return normalized;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error('Optional string fields must be strings when provided.');
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeTags(value: unknown, slug: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Item "${slug}" must define "tags" as an array.`);
  }

  return value
    .map((entry) => {
      if (typeof entry !== 'string') {
        throw new Error(`Item "${slug}" contains a non-string tag.`);
      }
      return entry.trim();
    })
    .filter(Boolean);
}

function parseDateString(value: string, fieldName: string, slug: string): Date {
  const normalized = value.trim();
  const nextValue = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? `${normalized}T00:00:00.000Z`
    : normalized;
  const parsed = new Date(nextValue);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Item "${slug}" has invalid "${fieldName}" date.`);
  }

  return parsed;
}

function normalizeOptionalDate(
  value: unknown,
  fieldName: string,
  slug: string,
): Date | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(
      `Field "${fieldName}" in item "${slug}" must be a string or null.`,
    );
  }

  return parseDateString(value, fieldName, slug);
}

function normalizeBoolean(
  value: unknown,
  fieldName: string,
  slug: string,
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new Error(
      `Field "${fieldName}" in item "${slug}" must be a boolean.`,
    );
  }

  return value;
}

function normalizeStatus(value: unknown, slug: string): PortfolioStatus {
  if (value === undefined) {
    return 'published';
  }

  if (value === 'draft' || value === 'published') {
    return value;
  }

  throw new Error(`Item "${slug}" has invalid "status".`);
}

function normalizeOrder(
  value: unknown,
  slug: string,
  fallbackOrder: number,
): number {
  if (value === undefined) {
    return fallbackOrder;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Item "${slug}" has invalid "order".`);
  }

  return value;
}

function formatDate(value: Date | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return value.toISOString().slice(0, 10);
}

export function loadBackendScriptEnv(): void {
  dotenv.config({ path: backendEnvPath, override: false });
}

export function resolvePortfolioDataFilePath(customPath?: string): string {
  return customPath
    ? path.resolve(process.cwd(), customPath)
    : defaultDataFilePath;
}

export async function readPortfolioFile(
  filePath: string,
): Promise<PortfolioFileItem[]> {
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error(`Portfolio file "${filePath}" must contain a JSON array.`);
  }

  return parsed as PortfolioFileItem[];
}

export async function writePortfolioFile(
  items: PortfolioFileItem[],
  filePath: string,
): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
}

export function toPortfolioMongoDocument(
  item: PortfolioFileItem,
  index: number,
  existing?: PortfolioMongoDocument,
  now: Date = new Date(),
): PortfolioMongoDocument {
  const slug = normalizeRequiredString(item.slug, 'slug');
  const dateFrom = normalizeOptionalDate(item.dateFrom, 'dateFrom', slug);
  const dateTo = normalizeOptionalDate(item.dateTo, 'dateTo', slug);

  return compactObject({
    _id: existing?._id ?? slug,
    title: normalizeRequiredString(item.title, 'title'),
    title_en: normalizeOptionalString(item.title_en),
    slug,
    href: normalizeRequiredString(item.href, 'href', { allowEmpty: true }),
    desc: normalizeRequiredString(item.desc, 'desc'),
    desc_en: normalizeOptionalString(item.desc_en),
    tags: normalizeTags(item.tags, slug),
    img: normalizeRequiredString(item.img, 'img'),
    isLogo: normalizeBoolean(item.isLogo, 'isLogo', slug),
    newTech: normalizeBoolean(item.newTech, 'newTech', slug),
    category: normalizeOptionalString(item.category),
    repoUrl: normalizeOptionalString(item.repoUrl),
    dateFrom,
    dateTo: item.dateTo === null ? null : (dateTo ?? null),
    order: normalizeOrder(item.order, slug, index + 1),
    status: normalizeStatus(item.status, slug),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

export function toPortfolioFileItem(
  document: PortfolioMongoDocument,
): PortfolioFileItem {
  const dateFrom = document.dateFrom
    ? formatDate(document.dateFrom)
    : undefined;

  return compactObject({
    title: document.title,
    title_en: normalizeOptionalString(document.title_en),
    slug: document.slug,
    href: document.href,
    desc: document.desc,
    desc_en: normalizeOptionalString(document.desc_en),
    tags: [...document.tags],
    img: document.img,
    isLogo: document.isLogo,
    newTech: document.newTech,
    category: normalizeOptionalString(document.category),
    repoUrl: normalizeOptionalString(document.repoUrl),
    dateFrom: dateFrom ?? undefined,
    dateTo: formatDate(document.dateTo) ?? null,
    order: document.order,
    status: document.status,
  });
}

export function getMongoConnectionConfig(): { uri: string; dbName: string } {
  const uri = readFirstEnvString(
    process.env.MONGODB_URI,
    process.env.MONGODB_URL,
    process.env.MONGO_URL,
  );
  const dbName =
    readEnvString(process.env.MONGODB_DB) ??
    readMongoDbNameFromUri(uri) ??
    'wizytowka';

  if (!uri?.startsWith('mongodb')) {
    throw new Error(
      'Missing valid MongoDB connection string. Check backend/.env or shell env (prefer MONGODB_URI; MONGODB_URL and MONGO_URL are also supported).',
    );
  }

  return { uri, dbName };
}

export async function openPortfolioCollection(
  uri: string,
  dbName: string,
): Promise<{
  client: MongoClient;
  collection: Collection<PortfolioMongoDocument>;
}> {
  const client = new MongoClient(uri);
  await client.connect();

  return {
    client,
    collection: client
      .db(dbName)
      .collection<PortfolioMongoDocument>('portfolio_items'),
  };
}
