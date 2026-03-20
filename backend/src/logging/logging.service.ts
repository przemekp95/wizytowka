import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as winston from 'winston';
import * as path from 'path';
import { loggingConfig } from '../config';

@Injectable()
export class LoggingService {
  private logger: winston.Logger;

  constructor(
    @Inject(loggingConfig.KEY)
    private readonly loggingConfiguration: ConfigType<typeof loggingConfig>,
  ) {
    this.logger = winston.createLogger({
      level: this.loggingConfiguration.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'wizytowka-backend' },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),

        // File transport for all logs
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'combined.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),

        // Separate file for errors
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'error.log'),
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(
    message: string,
    error?: unknown,
    meta?: Record<string, unknown>,
  ): void {
    const errorMeta = {
      ...meta,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    };
    this.logger.error(message, errorMeta);
  }

  // For request logging with additional context
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    requestId?: string,
  ): void {
    this.logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      requestId,
      level: statusCode >= 400 ? 'error' : 'info',
    });
  }

  // For database operations logging
  logDatabase(
    operation: string,
    collection: string,
    duration: number,
    success: boolean,
    requestId?: string,
  ): void {
    this.logger.info('Database Operation', {
      operation,
      collection,
      duration: `${duration}ms`,
      success,
      requestId,
    });
  }
}
