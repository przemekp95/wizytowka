import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingService } from '../../logging/logging.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly loggingService: LoggingService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, path: url } = req;
    const requestId = req.requestId || 'unknown';

    this.loggingService.info(`Request started: ${method} ${url}`, {
      requestId,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    res.on('finish', () => {
      this.loggingService.logRequest(
        method,
        url,
        res.statusCode,
        Date.now() - startTime,
        requestId,
      );
    });

    res.on('error', (error) => {
      this.loggingService.error(`Request error: ${method} ${url}`, error, {
        requestId,
        responseTime: Date.now() - startTime,
      });
    });

    next();
  }
}
