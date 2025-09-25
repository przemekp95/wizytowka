import { Controller, Get } from '@nestjs/common';
import { PortfolioService, PortfolioItem } from './portfolio.service';

@Controller('portfolio')
export class PortfolioApiController {
  constructor(private readonly service: PortfolioService) {}

  @Get()
  async list(): Promise<{ ok: boolean; items: PortfolioItem[] }> {
    const items = await this.service.listPublished();
    return { ok: true, items };
  }
}
