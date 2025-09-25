import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioApiController } from './portfolio.controller';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [AwsModule],
  providers: [PortfolioService],
  controllers: [PortfolioApiController],
  exports: [PortfolioService],
})
export class PortfolioModule {}
