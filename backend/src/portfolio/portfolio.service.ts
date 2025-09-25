import { Injectable, OnModuleInit } from '@nestjs/common';
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

@Injectable()
export class PortfolioService implements OnModuleInit {
  private client!: MongoClient;
  private db!: Db;

  constructor(private readonly awsService: AwsService) {}

  async onModuleInit() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI!);
      await this.client.connect();
      this.db = this.client.db(process.env.MONGODB_DB || 'wizytowka');
      const col = this.db.collection<PortfolioItem>('portfolio_items');
      await col.createIndex({ slug: 1 }, { unique: true });
      await col.createIndex({ status: 1, order: 1 });
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error(
        '❌ MongoDB connection failed:',
        error instanceof Error ? error.message : String(error),
      );
      console.log('⚠️  Running with mock data');
    }
  }

  async listPublished(): Promise<PortfolioItem[]> {
    if (!this.db) {
      throw new Error('MongoDB not connected');
    }

    const items = await this.db
      .collection<PortfolioItem>('portfolio_items')
      .find({ status: 'published' })
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    // Convert AWS Console URLs to proper S3 URLs
    return items.map((item) => ({
      ...item,
      img: this.convertAwsConsoleUrlToS3Url(item.img),
    }));
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
      // Delete old image if exists
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

  private convertAwsConsoleUrlToS3Url(awsConsoleUrl: string): string {
    // If it's already a proper S3 URL, return as is
    if (
      awsConsoleUrl.includes('.s3.') &&
      !awsConsoleUrl.includes('console.aws.amazon.com')
    ) {
      return awsConsoleUrl;
    }

    // Extract filename from AWS Console URL
    // Example: https://eu-north-1.console.aws.amazon.com/s3/object/wizytowka?region=eu-north-1&bucketType=general&prefix=logo.jpg
    const url = new URL(awsConsoleUrl);
    const prefixMatch = url.searchParams.get('prefix');

    if (prefixMatch) {
      // Return proper S3 URL
      return `https://wizytowka.s3.eu-north-1.amazonaws.com/portfolio/${prefixMatch}`;
    }

    // Fallback - return original URL if we can't parse it
    return awsConsoleUrl;
  }
}
