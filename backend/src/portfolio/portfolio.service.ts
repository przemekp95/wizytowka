import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Collection, Db, MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';
import { AwsService } from '../aws/aws.service';

interface MulterFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

export type PortfolioItem = {
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
  order?: number;
  status?: 'draft' | 'published';
  createdAt?: Date;
  updatedAt?: Date;
  repoUrl?: string;
};

/**
 * Portfolio service managing MongoDB operations for portfolio items.
 * Handles CRUD operations with file upload support and AWS S3 integration.
 */
@Injectable()
export class PortfolioService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PortfolioService.name);
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connectingPromise: Promise<void> | null = null;
  private connected = false;
  private lastError: string | null = null;

  constructor(private readonly awsService: AwsService) {}

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

  async getDependencyStatus(): Promise<{
    name: 'mongo';
    ready: boolean;
    error?: string;
  }> {
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
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      this.connected = false;
      this.lastError = 'MONGODB_URI is not configured';
      throw new Error(this.lastError);
    }

    this.logger.log('Starting MongoDB connection...');
    this.logger.log(`MONGODB_URI: ${mongoUri ? 'SET' : 'NOT SET'}`);
    this.logger.log(`MONGODB_DB: ${process.env.MONGODB_DB || 'wizytowka'}`);

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

      const nextDb = nextClient.db(process.env.MONGODB_DB || 'wizytowka');
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
      this.logger.log('PortfolioService initialization completed successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.connected = false;
      this.lastError = errorMessage;
      this.client = null;
      this.db = null;
      this.logger.error(`MongoDB connection failed: ${errorMessage}`);
      this.logger.warn(
        'PortfolioService is unavailable until MongoDB connection succeeds',
      );
      await nextClient?.close().catch(() => undefined);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  private async deleteImageBestEffort(
    imageUrl: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.awsService.deleteImage(imageUrl);
    } catch (error) {
      this.logger.warn(
        `Image cleanup skipped for ${reason}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async listPublished(): Promise<PortfolioItem[]> {
    const collection = await this.getCollection();

    return collection
      .find({ status: 'published' })
      .sort({ order: 1, createdAt: -1 })
      .toArray();
  }

  async createPortfolioItem(
    itemData: Omit<PortfolioItem, '_id' | 'createdAt' | 'updatedAt'>,
    imageFile?: MulterFile,
  ): Promise<PortfolioItem> {
    const collection = await this.getCollection();
    let imageUrl = itemData.img;

    if (imageFile) {
      imageUrl = await this.awsService.uploadImage(imageFile, 'portfolio');
    }

    const newItem: PortfolioItem = {
      _id: this.generateId(),
      ...itemData,
      img: imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(newItem);
    return newItem;
  }

  async updatePortfolioItem(
    id: string,
    updateData: Partial<Omit<PortfolioItem, '_id' | 'createdAt'>>,
    imageFile?: MulterFile,
  ): Promise<PortfolioItem | null> {
    const collection = await this.getCollection();
    const existingItem = await collection.findOne({ _id: id });

    if (!existingItem) {
      return null;
    }

    let imageUrl = updateData.img;
    let uploadedImageUrl: string | undefined;

    if (imageFile) {
      uploadedImageUrl = await this.awsService.uploadImage(
        imageFile,
        'portfolio',
      );
      imageUrl = uploadedImageUrl;
    }

    const updatedData = {
      ...updateData,
      ...(imageUrl !== undefined ? { img: imageUrl } : {}),
      updatedAt: new Date(),
    };

    try {
      const updatedItem = await collection.findOneAndUpdate(
        { _id: id },
        { $set: updatedData },
        { returnDocument: 'after' },
      );

      if (!updatedItem && uploadedImageUrl) {
        await this.deleteImageBestEffort(
          uploadedImageUrl,
          `rolled back failed update for portfolio item ${id}`,
        );
      }

      if (
        updatedItem &&
        uploadedImageUrl &&
        existingItem.img &&
        existingItem.img !== uploadedImageUrl
      ) {
        await this.deleteImageBestEffort(
          existingItem.img,
          `removing replaced image for portfolio item ${id}`,
        );
      }

      return updatedItem;
    } catch (error) {
      if (uploadedImageUrl) {
        await this.deleteImageBestEffort(
          uploadedImageUrl,
          `rolled back failed DB update for portfolio item ${id}`,
        );
      }

      throw error;
    }
  }

  async deletePortfolioItem(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const item = await collection.findOne({ _id: id });

    if (!item) {
      return false;
    }

    const result = await collection.deleteOne({ _id: id });

    if (!result.deletedCount) {
      return false;
    }

    if (item.img) {
      await this.deleteImageBestEffort(
        item.img,
        `deleting image for removed portfolio item ${id}`,
      );
    }

    return true;
  }

  private generateId(): string {
    return randomUUID();
  }
}
