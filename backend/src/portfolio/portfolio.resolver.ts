import { Args, Query, Resolver } from '@nestjs/graphql';
import { PortfolioService } from './portfolio.service';
import { PortfolioGQL } from './entities/portfolio.entity';
import { ObjectId } from 'mongodb';

@Resolver(() => PortfolioGQL)
export class PortfolioResolver {
  constructor(private readonly service: PortfolioService) {}

  @Query(() => [PortfolioGQL], { name: 'portfolioItems' })
  async portfolioItems(): Promise<PortfolioGQL[]> {
    const items = await this.service.listPublished();
    return items.map((d) => ({
      id: (d as any)._id instanceof ObjectId ? (d as any)._id.toHexString() : String(d._id),
      title: d.title,
      slug: d.slug,
      href: d.href,
      desc: d.desc,
      tags: d.tags ?? [],
      img: d.img,
      isLogo: d.isLogo,
      newTech: d.newTech,
      order: d.order,
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      repoUrl: d.repoUrl ?? undefined, // <— repoUrl trafia do GraphQL
    }));
  }

  @Query(() => PortfolioGQL, { name: 'portfolioItem', nullable: true })
  async portfolioItem(@Args('slug') slug: string): Promise<PortfolioGQL | null> {
    const col = this.service['db'].collection('portfolio_items'); // szybki dostęp
    const d = await col.findOne({ slug, status: 'published' });
    if (!d) return null;
    return {
      id: (d as any)._id instanceof ObjectId ? (d as any)._id.toHexString() : String(d._id),
      title: d.title,
      slug: d.slug,
      href: d.href,
      desc: d.desc,
      tags: d.tags ?? [],
      img: d.img,
      isLogo: d.isLogo,
      newTech: d.newTech,
      order: d.order,
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      repoUrl: d.repoUrl ?? undefined,
    };
  }
}
