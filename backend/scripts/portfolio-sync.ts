import {
  getMongoConnectionConfig,
  loadBackendScriptEnv,
  openPortfolioCollection,
  readPortfolioFile,
  resolvePortfolioDataFilePath,
  toPortfolioFileItem,
  toPortfolioMongoDocument,
  type PortfolioMongoDocument,
  writePortfolioFile,
} from './portfolio-file';

type SyncCommand = 'pull' | 'push';

type SyncOptions = {
  command: SyncCommand;
  filePath?: string;
  prune: boolean;
  dryRun: boolean;
  allowEmpty: boolean;
};

function printUsage(): void {
  console.log(`Usage:
  pnpm -F backend exec tsx ./scripts/portfolio-sync.ts pull [--file path]
  pnpm -F backend exec tsx ./scripts/portfolio-sync.ts push [--file path] [--prune] [--dry-run] [--allow-empty]

Options:
  --file <path>  Use a custom JSON source file.
  --prune        Remove remote documents not present in the file during push.
  --dry-run      Show the planned push summary without writing to MongoDB.
  --allow-empty  Allow an empty file to clear the remote collection when combined with --prune.
`);
}

function parseArgs(argv: string[]): SyncOptions {
  const [command, ...rest] = argv;

  if (command !== 'pull' && command !== 'push') {
    throw new Error('Missing or invalid command. Use "pull" or "push".');
  }

  const options: SyncOptions = {
    command,
    prune: false,
    dryRun: false,
    allowEmpty: false,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--file') {
      const nextValue = rest[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for --file.');
      }

      options.filePath = nextValue;
      index += 1;
      continue;
    }

    if (arg === '--prune') {
      options.prune = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--allow-empty') {
      options.allowEmpty = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function summarizePush(
  fileDocuments: PortfolioMongoDocument[],
  existingDocuments: PortfolioMongoDocument[],
  prune: boolean,
): { inserts: number; updates: number; deletes: number } {
  const existingBySlug = new Map(
    existingDocuments.map((item) => [item.slug, item]),
  );
  const incomingSlugs = new Set(fileDocuments.map((item) => item.slug));

  let inserts = 0;
  let updates = 0;

  for (const document of fileDocuments) {
    if (existingBySlug.has(document.slug)) {
      updates += 1;
    } else {
      inserts += 1;
    }
  }

  const deletes = prune
    ? existingDocuments.filter((item) => !incomingSlugs.has(item.slug)).length
    : 0;

  return { inserts, updates, deletes };
}

async function pullPortfolio(filePath: string): Promise<void> {
  loadBackendScriptEnv();
  const { uri, dbName } = getMongoConnectionConfig();
  const { client, collection } = await openPortfolioCollection(uri, dbName);

  try {
    const documents = await collection
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    const fileItems = documents.map((item) => toPortfolioFileItem(item));
    await writePortfolioFile(fileItems, filePath);

    console.log(`Pulled ${fileItems.length} portfolio items into ${filePath}`);
  } finally {
    await client.close();
  }
}

async function pushPortfolio(
  filePath: string,
  options: Pick<SyncOptions, 'prune' | 'dryRun' | 'allowEmpty'>,
): Promise<void> {
  loadBackendScriptEnv();
  const { uri, dbName } = getMongoConnectionConfig();
  const fileItems = await readPortfolioFile(filePath);
  const { client, collection } = await openPortfolioCollection(uri, dbName);

  try {
    const existingDocuments = await collection.find({}).toArray();
    const existingBySlug = new Map(
      existingDocuments.map((item) => [item.slug, item]),
    );
    const now = new Date();
    const documents = fileItems.map((item, index) => {
      const lookupSlug = typeof item.slug === 'string' ? item.slug.trim() : '';
      return toPortfolioMongoDocument(
        item,
        index,
        existingBySlug.get(lookupSlug),
        now,
      );
    });

    if (options.prune && documents.length === 0 && !options.allowEmpty) {
      throw new Error(
        'Refusing to prune with an empty file. Pass --allow-empty if clearing the remote collection is intentional.',
      );
    }

    const summary = summarizePush(documents, existingDocuments, options.prune);
    console.log(
      `Push summary for ${filePath}: ${summary.inserts} inserts, ${summary.updates} updates, ${summary.deletes} deletes`,
    );

    if (options.dryRun) {
      console.log('Dry run only. Remote MongoDB was not modified.');
      return;
    }

    if (documents.length > 0) {
      await collection.bulkWrite(
        documents.map((document) => ({
          replaceOne: {
            filter: { slug: document.slug },
            replacement: document,
            upsert: true,
          },
        })),
        { ordered: true },
      );
    }

    if (options.prune) {
      const slugs = documents.map((item) => item.slug);
      await collection.deleteMany({
        slug: { $nin: slugs },
      });
    }

    console.log('Remote MongoDB portfolio sync completed.');
  } finally {
    await client.close();
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const filePath = resolvePortfolioDataFilePath(options.filePath);

  if (options.command === 'pull') {
    await pullPortfolio(filePath);
    return;
  }

  await pushPortfolio(filePath, {
    prune: options.prune,
    dryRun: options.dryRun,
    allowEmpty: options.allowEmpty,
  });
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`portfolio-sync failed: ${message}`);
  process.exitCode = 1;
});
