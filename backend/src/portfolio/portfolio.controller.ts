import { Controller, Get } from '@nestjs/common';
import { PortfolioService, PortfolioDTO } from './portfolio.service';

@Controller('portfolio') // jeśli masz globalPrefix('api'), zmień na tylko 'portfolio'
export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  @Get()
  async list(): Promise<{ ok: true; items: PortfolioDTO[] }> {
    const items = await this.service.listPublished();
    return { ok: true, items };
  }
}
