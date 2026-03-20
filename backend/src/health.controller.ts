import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthLiveResponseDto,
  HealthReadyResponseDto,
  HealthResponseDto,
} from './health.openapi.dto';
import { PortfolioService } from './portfolio/portfolio.service';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly portfolioService: PortfolioService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Get process health snapshot',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  health() {
    return {
      ok: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
    };
  }

  @Get('health/ready')
  @ApiOperation({
    summary: 'Get dependency readiness status',
  })
  @ApiOkResponse({ type: HealthReadyResponseDto })
  @ApiServiceUnavailableResponse({ type: HealthReadyResponseDto })
  async ready() {
    const dependencies = {
      prisma: await this.prismaService.getDependencyStatus(),
      mongo: await this.portfolioService.getDependencyStatus(),
    };

    const payload = {
      ok: dependencies.prisma.ready && dependencies.mongo.ready,
      ready: dependencies.prisma.ready && dependencies.mongo.ready,
      dependencies,
      timestamp: new Date().toISOString(),
    };

    if (!payload.ready) {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }

  @Get('health/live')
  @ApiOperation({
    summary: 'Get process liveness status',
  })
  @ApiOkResponse({ type: HealthLiveResponseDto })
  live() {
    return {
      ok: true,
      live: true,
      timestamp: new Date().toISOString(),
    };
  }
}
