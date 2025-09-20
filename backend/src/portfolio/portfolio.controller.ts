import { Controller, Get } from '@nestjs/common';
import { PortfolioService, PortfolioItem } from './portfolio.service';

@Controller('api/portfolio')
export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  @Get()
  async list(): Promise<{ ok: true; items: PortfolioItem[] }> {
    const items = await this.service.listPublished();

    // ✅ po staremu, tylko teraz elementy mogą mieć repoUrl
    return { ok: true, items };
  }
}
