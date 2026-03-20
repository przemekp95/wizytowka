import { Module } from '@nestjs/common';
import { OpsTokenGuard } from '../common/guards/ops-token.guard';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, OpsTokenGuard],
  exports: [MetricsService],
})
export class MetricsModule {}
