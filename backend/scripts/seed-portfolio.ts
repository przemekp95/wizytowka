import {
  getMongoConnectionConfig,
  loadBackendScriptEnv,
  openPortfolioCollection,
  readPortfolioFile,
  resolvePortfolioDataFilePath,
  toPortfolioMongoDocument,
} from './portfolio-file';

void (async () => {
  loadBackendScriptEnv();

  const filePath = resolvePortfolioDataFilePath();
  const sourceItems = await readPortfolioFile(filePath);
  const { uri, dbName } = getMongoConnectionConfig();
  const { client, collection } = await openPortfolioCollection(uri, dbName);

  try {
    const now = new Date();
    const documents = sourceItems.map((item, index) =>
      toPortfolioMongoDocument(item, index, undefined, now),
    );

    await collection.deleteMany({});

    if (documents.length > 0) {
      await collection.insertMany(documents);
    }

    console.log(`Seeded ${documents.length} portfolio items from ${filePath}`);
  } finally {
    await client.close();
  }
})().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`seed-portfolio failed: ${message}`);
  process.exitCode = 1;
});
