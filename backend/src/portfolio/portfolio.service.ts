import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
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
  private client!: MongoClient;
  private db!: Db;

  constructor(private readonly awsService: AwsService) {}

  /**
   * Initialize MongoDB connection with indexes creation.
   * Uses graceful degradation - if connection/operations fail, service continues with mock data.
   */
  async onModuleInit() {
    try {
      this.logger.log('Starting MongoDB connection...');
      this.logger.log(
        `MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`,
      );
      this.logger.log(`MONGODB_DB: ${process.env.MONGODB_DB || 'wizytowka'}`);

      this.client = new MongoClient(process.env.MONGODB_URI!, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });

      this.logger.log('Attempting MongoDB connection...');
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Connection timeout after 5s')),
          5000,
        ),
      );

      await Promise.race([connectPromise, timeoutPromise]);
      this.logger.log('MongoDB connection established');

      this.db = this.client.db(process.env.MONGODB_DB || 'wizytowka');
      this.logger.log(`Database "${this.db.databaseName}" selected`);

      // Try to create indexes (graceful degradation if fails)
      try {
        const col = this.db.collection<PortfolioItem>('portfolio_items');
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

      this.logger.log('PortfolioService initialization completed successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`MongoDB connection failed: ${errorMessage}`);
      this.logger.warn(
        'PortfolioService will run with mock data - reduced functionality',
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }

  async listPublished(): Promise<PortfolioItem[]> {
    if (!this.db) {
      throw new Error('MongoDB not connected');
    }

    return this.db
      .collection<PortfolioItem>('portfolio_items')
      .find({ status: 'published' })
      .sort({ order: 1, createdAt: -1 })
      .toArray();
  }

  async createPortfolioItem(
    itemData: Omit<PortfolioItem, '_id' | 'createdAt' | 'updatedAt'>,
    imageFile?: MulterFile,
  ): Promise<PortfolioItem> {
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

    if (this.db) {
      await this.db
        .collection<PortfolioItem>('portfolio_items')
        .insertOne(newItem);
    }
    return newItem;
  }

  async updatePortfolioItem(
    id: string,
    updateData: Partial<Omit<PortfolioItem, '_id' | 'createdAt'>>,
    imageFile?: MulterFile,
  ): Promise<PortfolioItem | null> {
    if (!this.db) {
      throw new Error('MongoDB not connected');
    }

    let imageUrl = updateData.img;

    if (imageFile) {
      const existingItem = await this.db
        .collection<PortfolioItem>('portfolio_items')
        .findOne({ _id: id });

      if (existingItem?.img) {
        await this.awsService.deleteImage(existingItem.img);
      }

      imageUrl = await this.awsService.uploadImage(imageFile, 'portfolio');
    }

    const updatedData = {
      ...updateData,
      ...(imageUrl && { img: imageUrl }),
      updatedAt: new Date(),
    };

    const result = await this.db
      .collection<PortfolioItem>('portfolio_items')
      .findOneAndUpdate(
        { _id: id },
        { $set: updatedData },
        { returnDocument: 'after' },
      );

    return result
      ? (result as unknown as { value: PortfolioItem }).value
      : null;
  }

  async deletePortfolioItem(id: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('MongoDB not connected');
    }

    const item = await this.db
      .collection<PortfolioItem>('portfolio_items')
      .findOne({ _id: id });

    if (item?.img) {
      await this.awsService.deleteImage(item.img);
    }

    const result = await this.db
      .collection<PortfolioItem>('portfolio_items')
      .deleteOne({ _id: id });

    return result.deletedCount > 0;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
