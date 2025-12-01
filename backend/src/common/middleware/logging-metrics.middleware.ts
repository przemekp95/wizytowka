import { Injectable, Inject, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingService } from '../../logging/logging.service';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class LoggingMetricsMiddleware implements NestMiddleware {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly metricsService: MetricsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl: url } = req;
    const requestId = (req as any).requestId;

    // Log request start
    this.loggingService.info(`Request started: ${method} ${url}`, {
      requestId,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    // Listen for response finish
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;

      // Log request completion
      this.loggingService.logRequest(
        method,
        url,
        statusCode,
        responseTime,
        requestId,
      );

      // Record metrics
      this.metricsService.recordHttpRequest(
        method,
        url,
        statusCode,
        responseTime,
      );
    });

    // Handle errors
    res.on('error', (error) => {
      this.loggingService.error(`Request error: ${method} ${url}`, error, {
        requestId,
        responseTime: Date.now() - startTime,
      });
      this.metricsService.recordError('http_request_error', url);
    });

    next();
  }
}
