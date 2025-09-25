import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioApiController } from './portfolio.controller';

@Module({
  providers: [PortfolioService],
  controllers: [PortfolioApiController],
  exports: [PortfolioService],
})
export class PortfolioModule {}
