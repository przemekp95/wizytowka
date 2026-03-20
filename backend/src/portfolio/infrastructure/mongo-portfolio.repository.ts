import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Collection, Db, MongoClient } from 'mongodb';
import { mongoConfig } from '../../config';
import type {
  PortfolioDependencyStatus,
  PortfolioRepositoryPort,
} from '../application/ports/portfolio-repository.port';
import { PortfolioItem } from '../domain/portfolio-item';

@Injectable()
export class MongoPortfolioRepository
  implements PortfolioRepositoryPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MongoPortfolioRepository.name);
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connectingPromise: Promise<void> | null = null;
  private connected = false;
  private lastError: string | null = null;

  constructor(
    @Inject(mongoConfig.KEY)
    private readonly mongoConfiguration: ConfigType<typeof mongoConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.connectIfNeeded().catch(() => undefined);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }

    this.client = null;
    this.db = null;
    this.connected = false;
    this.lastError = null;
    this.logger.log('MongoDB connection closed');
  }

  async getDependencyStatus(): Promise<PortfolioDependencyStatus> {
    if (this.db) {
      try {
        await this.db.command({ ping: 1 });
        this.connected = true;
        this.lastError = null;
      } catch (error) {
        this.connected = false;
        this.lastError = error instanceof Error ? error.message : String(error);
        await this.client?.close().catch(() => undefined);
        this.client = null;
        this.db = null;
      }
    }

    await this.connectIfNeeded().catch(() => undefined);

    return {
      name: 'mongo',
      ready: this.connected,
      ...(this.lastError ? { error: this.lastError } : {}),
    };
  }

  async listPublished(): Promise<PortfolioItem[]> {
    const collection = await this.getCollection();

    return collection
      .find({ status: 'published' })
      .sort({ order: 1, createdAt: -1 })
      .toArray();
  }

  async findById(id: string): Promise<PortfolioItem | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: id });
  }

  async create(item: PortfolioItem): Promise<PortfolioItem> {
    const collection = await this.getCollection();
    await collection.insertOne(item);
    return item;
  }

  async update(item: PortfolioItem): Promise<PortfolioItem | null> {
    const collection = await this.getCollection();

    return collection.findOneAndReplace({ _id: item._id }, item, {
      returnDocument: 'after',
    });
  }

  async deleteById(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: id });
    return Boolean(result.deletedCount);
  }

  private async getCollection(): Promise<Collection<PortfolioItem>> {
    if (!this.db) {
      await this.connectIfNeeded().catch(() => undefined);
    }

    if (!this.db) {
      throw new Error('MongoDB not connected');
    }

    return this.db.collection<PortfolioItem>('portfolio_items');
  }

  private async connectIfNeeded(): Promise<void> {
    if (this.db) {
      this.connected = true;
      this.lastError = null;
      return;
    }

    if (this.connectingPromise) {
      await this.connectingPromise;
      return;
    }

    this.connectingPromise = this.connectInternal().finally(() => {
      this.connectingPromise = null;
    });

    await this.connectingPromise;
  }

  private async connectInternal(): Promise<void> {
    const mongoUri = this.mongoConfiguration.uri;
    if (!mongoUri) {
      this.connected = false;
      this.lastError = 'MONGODB_URI is not configured';
      throw new Error(this.lastError);
    }

    this.logger.log('Starting MongoDB connection...');
    this.logger.log(`MONGODB_URI: ${mongoUri ? 'SET' : 'NOT SET'}`);
    this.logger.log(`MONGODB_DB: ${this.mongoConfiguration.dbName}`);

    let nextClient: MongoClient | null = null;

    try {
      nextClient = new MongoClient(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });

      this.logger.log('Attempting MongoDB connection...');
      const connectPromise = nextClient.connect();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Connection timeout after 5s')),
          5000,
        ),
      );

      await Promise.race([connectPromise, timeoutPromise]);
      this.logger.log('MongoDB connection established');

      const nextDb = nextClient.db(this.mongoConfiguration.dbName);
      this.logger.log(`Database "${nextDb.databaseName}" selected`);

      try {
        const col = nextDb.collection<PortfolioItem>('portfolio_items');
        this.logger.log('Creating database indexes...');
        await col.createIndex({ slug: 1 }, { unique: true });
        this.logger.log('Slug index created');
        await col.createIndex({ status: 1, order: 1 });
        this.logger.log('Status/Order index created');
        this.logger.log('Database indexes created successfully');
      } catch (indexError) {
        this.logger.warn(
          `Could not create indexes: ${indexError instanceof Error ? indexError.message : String(indexError)}`,
        );
        this.logger.log(
          'Continuing without indexes (performance may be reduced)',
        );
      }

      this.client = nextClient;
      this.db = nextDb;
      this.connected = true;
      this.lastError = null;
      this.logger.log(
        'MongoPortfolioRepository initialization completed successfully',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.connected = false;
      this.lastError = errorMessage;
      this.client = null;
      this.db = null;
      this.logger.error(`MongoDB connection failed: ${errorMessage}`);
      this.logger.warn(
        'MongoPortfolioRepository is unavailable until MongoDB connection succeeds',
      );
      await nextClient?.close().catch(() => undefined);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }
}
