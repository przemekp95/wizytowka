import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioResolver } from './portfolio.resolver';
import { PortfolioController } from './portfolio.controller';

@Module({
  providers: [PortfolioService, PortfolioResolver],
  controllers: [PortfolioController], // <— DODANE
  exports: [PortfolioService],
})
export class PortfolioModule {}
