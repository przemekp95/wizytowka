import { Injectable, OnModuleInit } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

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
}
