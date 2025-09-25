import { Injectable, OnModuleInit } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
import { AwsService } from '../aws/aws.service';

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
    this.client = new MongoClient(process.env.MONGODB_URI!);
    await this.client.connect();
    this.db = this.client.db(process.env.MONGODB_DB || 'wizytowka');
    const col = this.db.collection<PortfolioItem>('portfolio_items');
    await col.createIndex({ slug: 1 }, { unique: true });
    await col.createIndex({ status: 1, order: 1 });
  }

  async listPublished(): Promise<PortfolioItem[]> {
    return this.db
      .collection<PortfolioItem>('portfolio_items')
      .find({ status: 'published' })
      .sort({ order: 1, createdAt: -1 })
      .toArray();
  }

  async createPortfolioItem(
    itemData: Omit<PortfolioItem, '_id' | 'createdAt' | 'updatedAt'>,
    imageFile?: any,
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

    await this.db
      .collection<PortfolioItem>('portfolio_items')
      .insertOne(newItem);
    return newItem;
  }

  async updatePortfolioItem(
    id: string,
    updateData: Partial<Omit<PortfolioItem, '_id' | 'createdAt'>>,
    imageFile?: any,
  ): Promise<PortfolioItem | null> {
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
