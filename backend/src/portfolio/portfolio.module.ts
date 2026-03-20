import { Module } from '@nestjs/common';
import { OpsTokenGuard } from '../common/guards/ops-token.guard';
import { PortfolioService } from './portfolio.service';
import { PortfolioApiController } from './portfolio.controller';
import { AwsModule } from '../aws/aws.module';
import { PORTFOLIO_IMAGE_STORAGE } from './application/ports/portfolio-image-storage.port';
import { PORTFOLIO_REPOSITORY } from './application/ports/portfolio-repository.port';
import { MongoPortfolioRepository } from './infrastructure/mongo-portfolio.repository';
import { S3PortfolioImageStorageAdapter } from './infrastructure/s3-portfolio-image-storage.adapter';

@Module({
  imports: [AwsModule],
  providers: [
    PortfolioService,
    MongoPortfolioRepository,
    S3PortfolioImageStorageAdapter,
    {
      provide: PORTFOLIO_REPOSITORY,
      useExisting: MongoPortfolioRepository,
    },
    {
      provide: PORTFOLIO_IMAGE_STORAGE,
      useExisting: S3PortfolioImageStorageAdapter,
    },
    OpsTokenGuard,
  ],
  controllers: [PortfolioApiController],
  exports: [PortfolioService],
})
export class PortfolioModule {}
