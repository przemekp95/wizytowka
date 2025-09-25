import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
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
  ready() {
    return {
      ok: true,
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/live')
  live() {
    return {
      ok: true,
      live: true,
      timestamp: new Date().toISOString(),
    };
  }
}
