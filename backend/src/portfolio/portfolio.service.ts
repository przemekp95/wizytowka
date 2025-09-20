import { Injectable, OnModuleInit } from '@nestjs/common';
import { Db, MongoClient, ObjectId } from 'mongodb';

export type PortfolioDoc = {
  _id: ObjectId;
  title: string;
  slug: string;
  href: string;
  desc: string;
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

export type PortfolioDTO = {
  id: string; // zmapowane z _id
  title: string;
  slug: string;
  href: string;
  desc: string;
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

  async onModuleInit(): Promise<void> {
    this.client = new MongoClient(process.env.MONGODB_URI!);
    await this.client.connect();
    this.db = this.client.db(process.env.MONGODB_DB || 'wizytowka');

    const col = this.db.collection<PortfolioDoc>('portfolio_items');
    await col.createIndex({ slug: 1 }, { unique: true });
    await col.createIndex({ status: 1, order: 1 });
  }

  private map(doc: PortfolioDoc): PortfolioDTO {
    return {
      id: doc._id.toHexString(),
      title: doc.title,
      slug: doc.slug,
      href: doc.href,
      desc: doc.desc,
      tags: doc.tags ?? [],
      img: doc.img,
      isLogo: doc.isLogo,
      newTech: doc.newTech,
      order: doc.order,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      repoUrl: doc.repoUrl,
    };
  }

  async listPublished(): Promise<PortfolioDTO[]> {
    const docs = await this.db
      .collection<PortfolioDoc>('portfolio_items')
      .find({ status: 'published' })
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    return docs.map((d) => this.map(d));
  }

  async findBySlug(slug: string): Promise<PortfolioDTO | null> {
    const doc = await this.db
      .collection<PortfolioDoc>('portfolio_items')
      .findOne({ slug, status: 'published' });
    return doc ? this.map(doc) : null;
  }
}
