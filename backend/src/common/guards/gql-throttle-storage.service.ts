import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Collection, Db, MongoClient } from 'mongodb';
import { mongoConfig, throttleConfig } from '../../config';

type ThrottleStorageDriver = 'memory' | 'mongo';

type GqlThrottleDocument = {
  _id: string;
  hits: number[];
  blocked: boolean;
  expireAt: Date;
};

export type GqlThrottleIncrementResult = {
  activeHits: number[];
  blocked: boolean;
};

const THROTTLE_COLLECTION = 'gql_throttle_hits';

@Injectable()
export class GqlThrottleStorageService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(GqlThrottleStorageService.name);
  private readonly memoryHits = new Map<string, number[]>();
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<GqlThrottleDocument> | null = null;
  private connectingPromise: Promise<void> | null = null;

  constructor(
    @Inject(throttleConfig.KEY)
    private readonly throttleConfiguration: ConfigType<typeof throttleConfig>,
    @Inject(mongoConfig.KEY)
    private readonly mongoConfiguration: ConfigType<typeof mongoConfig>,
  ) {}

  onModuleInit(): Promise<void> {
    if (this.getDriver() !== 'mongo') {
      return Promise.resolve();
    }

    return this.ensureCollection().catch((error) => {
      this.logger.warn(
        `Shared throttle storage is unavailable during bootstrap: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.memoryHits.clear();

    if (this.client) {
      await this.client.close().catch(() => undefined);
    }

    this.client = null;
    this.db = null;
    this.collection = null;
    this.connectingPromise = null;
  }

  reset(): void {
    this.memoryHits.clear();
  }

  async clearAll(): Promise<void> {
    this.memoryHits.clear();

    if (this.getDriver() !== 'mongo') {
      return;
    }

    const collection = await this.getCollection();
    await collection.deleteMany({});
  }

  async increment(
    key: string,
    ttlMs: number,
    limit: number,
    now: number = Date.now(),
  ): Promise<GqlThrottleIncrementResult> {
    if (this.getDriver() === 'memory') {
      return this.incrementMemory(key, ttlMs, limit, now);
    }

    return this.incrementMongo(key, ttlMs, limit, now);
  }

  private getDriver(): ThrottleStorageDriver {
    return this.throttleConfiguration.driver;
  }

  private incrementMemory(
    key: string,
    ttlMs: number,
    limit: number,
    now: number,
  ): GqlThrottleIncrementResult {
    const activeHits = (this.memoryHits.get(key) ?? []).filter(
      (timestamp) => timestamp > now - ttlMs,
    );
    const blocked = activeHits.length >= limit;

    if (!blocked) {
      activeHits.push(now);
    }

    this.memoryHits.set(key, activeHits);

    return { activeHits, blocked };
  }

  private async incrementMongo(
    key: string,
    ttlMs: number,
    limit: number,
    now: number,
  ): Promise<GqlThrottleIncrementResult> {
    const collection = await this.getCollection();
    const cutoff = now - ttlMs;
    const updated = await collection.findOneAndUpdate(
      { _id: key },
      [
        {
          $set: {
            hits: {
              $let: {
                vars: {
                  activeHits: {
                    $filter: {
                      input: { $ifNull: ['$hits', []] },
                      as: 'hit',
                      cond: { $gt: ['$$hit', cutoff] },
                    },
                  },
                },
                in: {
                  $cond: [
                    { $gte: [{ $size: '$$activeHits' }, limit] },
                    '$$activeHits',
                    { $concatArrays: ['$$activeHits', [now]] },
                  ],
                },
              },
            },
            blocked: {
              $let: {
                vars: {
                  activeHits: {
                    $filter: {
                      input: { $ifNull: ['$hits', []] },
                      as: 'hit',
                      cond: { $gt: ['$$hit', cutoff] },
                    },
                  },
                },
                in: { $gte: [{ $size: '$$activeHits' }, limit] },
              },
            },
            expireAt: new Date(now + ttlMs),
          },
        },
      ],
      {
        upsert: true,
        returnDocument: 'after',
        includeResultMetadata: false,
      },
    );

    if (!updated) {
      throw new Error('Throttle storage update returned no document');
    }

    return {
      activeHits: updated.hits.filter((timestamp) => timestamp > cutoff),
      blocked: updated.blocked,
    };
  }

  private async getCollection(): Promise<Collection<GqlThrottleDocument>> {
    if (!this.collection) {
      await this.ensureCollection();
    }

    if (!this.collection) {
      throw new Error('Throttle storage collection is unavailable');
    }

    return this.collection;
  }

  private async ensureCollection(): Promise<void> {
    if (this.collection) {
      return;
    }

    if (this.connectingPromise) {
      await this.connectingPromise;
      return;
    }

    this.connectingPromise = this.connectMongo().finally(() => {
      this.connectingPromise = null;
    });

    await this.connectingPromise;
  }

  private async connectMongo(): Promise<void> {
    const mongoUri = this.mongoConfiguration.uri;

    if (!mongoUri) {
      throw new Error(
        'MongoDB connection string is required for shared GraphQL throttle storage (prefer MONGODB_URI; MONGODB_URL and MONGO_URL are also supported)',
      );
    }

    const client = new MongoClient(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });

    try {
      await client.connect();

      const db = client.db(this.mongoConfiguration.dbName);
      const collection =
        db.collection<GqlThrottleDocument>(THROTTLE_COLLECTION);
      await collection.createIndex(
        { expireAt: 1 },
        {
          expireAfterSeconds: 0,
          name: 'gql_throttle_expire_at_ttl',
        },
      );

      this.client = client;
      this.db = db;
      this.collection = collection;
    } catch (error) {
      await client.close().catch(() => undefined);
      this.client = null;
      this.db = null;
      this.collection = null;
      throw error;
    }
  }
}
