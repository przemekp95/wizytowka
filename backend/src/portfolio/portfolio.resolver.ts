import { Args, Query, Resolver } from '@nestjs/graphql';
import { PortfolioService, PortfolioDTO } from './portfolio.service';
import { PortfolioGQL } from './entities/portfolio.entity';

@Resolver(() => PortfolioGQL)
export class PortfolioResolver {
  constructor(private readonly service: PortfolioService) {}

  @Query(() => [PortfolioGQL], { name: 'portfolioItems' })
  portfolioItems(): Promise<PortfolioDTO[]> {
    return this.service.listPublished();
  }

  @Query(() => PortfolioGQL, { name: 'portfolioItem', nullable: true })
  portfolioItem(@Args('slug') slug: string): Promise<PortfolioDTO | null> {
    return this.service.findBySlug(slug);
  }
}
