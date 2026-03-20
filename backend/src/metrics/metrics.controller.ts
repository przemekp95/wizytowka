import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { OpsTokenGuard } from '../common/guards/ops-token.guard';

@ApiTags('metrics')
@ApiBearerAuth('admin-token')
@Controller('metrics')
@UseGuards(OpsTokenGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({
    summary: 'Get Prometheus metrics',
    description: 'Returns all collected metrics in Prometheus format',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics successfully retrieved',
    content: {
      'text/plain': {
        example:
          '# HELP wizytowka_http_requests_total Total number of HTTP requests\n# TYPE wizytowka_http_requests_total counter\nwizytowka_http_requests_total{method="GET",route="/health",status_code="200"} 1',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin bearer token',
  })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
