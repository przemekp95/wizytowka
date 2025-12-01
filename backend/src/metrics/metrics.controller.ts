import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
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
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
