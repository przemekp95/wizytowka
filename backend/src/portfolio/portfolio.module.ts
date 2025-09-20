import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioResolver } from './portfolio.resolver';

@Module({
  providers: [PortfolioService, PortfolioResolver],
  exports: [PortfolioService],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
