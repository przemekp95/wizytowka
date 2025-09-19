import { Controller, Get } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('/api/portfolio')
export class PortfolioController {
  constructor(private readonly svc: PortfolioService) {}
  @Get()
  async list() {
    const items = await this.svc.listPublished();
    return { ok: true, items };
  }
}
