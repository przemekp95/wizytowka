import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingMetricsMiddleware } from './common/middleware/logging-metrics.middleware';
import { LoggingService } from './logging/logging.service';
import { MetricsService } from './metrics/metrics.service';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  forbidUnknownValues: false,
});

export type AppConfigurationOptions = {
  enableSwagger?: boolean;
};

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    return s === 'true' || s === '1' || s === 'yes' || s === 'on';
  }
  return false;
}

function getAllowedOrigins(): Set<string> {
  const envOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set<string>([
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ...envOrigins,
  ]);
}

function createCorsOptions(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin: (origin, cb) => {
      if (!origin) {
        return cb(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return cb(null, true);
      }

      return cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600,
  };
}

export function configureApp(
  app: INestApplication,
  { enableSwagger = true }: AppConfigurationOptions = {},
): void {
  const expressApp = app as INestApplication & Partial<NestExpressApplication>;
  const requestIdMiddleware = new RequestIdMiddleware();
  const loggingMetricsMiddleware = new LoggingMetricsMiddleware(
    app.get(LoggingService),
    app.get(MetricsService),
  );

  if (typeof expressApp.set === 'function' && toBool(process.env.TRUST_PROXY)) {
    expressApp.set('trust proxy', 1);
  }

  app.enableCors(createCorsOptions());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    compression({
      level: 6,
      threshold: 1024,
    }),
  );
  app.use((req: Request, res: Response, next: NextFunction) =>
    requestIdMiddleware.use(req, res, next),
  );
  app.use((req: Request, res: Response, next: NextFunction) =>
    loggingMetricsMiddleware.use(req, res, next),
  );
  app.setGlobalPrefix('api');
  app.useGlobalPipes(validationPipe);

  if (!enableSwagger) {
    return;
  }

  const documentConfig = new DocumentBuilder()
    .setTitle('Personal Portfolio API')
    .setDescription('REST and GraphQL API for personal portfolio website')
    .setVersion('1.0')
    .addTag('health', 'Health check endpoints')
    .addTag('portfolio', 'Portfolio item management')
    .addTag('contact', 'Contact form and messaging')
    .addTag('links', 'External links and redirects')
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('api/docs', app, document);
}

export function logBootstrapSuccess(logger: Logger, port: number): void {
  logger.log(
    `Starting application on port ${port} (env: ${process.env.NODE_ENV ?? 'development'})`,
  );
}
