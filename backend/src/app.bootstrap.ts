import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { ConfigType } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { appConfig } from './config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingMetricsMiddleware } from './common/middleware/logging-metrics.middleware';
import { LoggingService } from './logging/logging.service';
import { MetricsService } from './metrics/metrics.service';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    forbidUnknownValues: false,
  });
}

export type AppConfigurationOptions = {
  enableSwagger?: boolean;
};

type AppRuntimeConfig = ConfigType<typeof appConfig>;

function getAllowedOrigins(appConfiguration: AppRuntimeConfig): Set<string> {
  return new Set<string>([
    'http://localhost:3000',
    'http://localhost:3001',
    ...(appConfiguration.frontendUrl ? [appConfiguration.frontendUrl] : []),
    ...appConfiguration.corsOrigins,
  ]);
}

function createCorsOptions(appConfiguration: AppRuntimeConfig): CorsOptions {
  const allowedOrigins = getAllowedOrigins(appConfiguration);

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
  const appConfiguration = app.get<AppRuntimeConfig>(appConfig.KEY);
  const requestIdMiddleware = new RequestIdMiddleware();
  const loggingMetricsMiddleware = new LoggingMetricsMiddleware(
    app.get(LoggingService),
    app.get(MetricsService),
  );

  if (typeof expressApp.set === 'function' && appConfiguration.trustProxy) {
    expressApp.set('trust proxy', 1);
  }

  app.enableCors(createCorsOptions(appConfiguration));
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
  app.useGlobalPipes(createValidationPipe());

  if (!enableSwagger) {
    return;
  }

  const documentConfig = new DocumentBuilder()
    .setTitle('Personal Portfolio API')
    .setDescription(
      'REST API for the personal portfolio website. GraphQL is documented through the SDL exposed at /api/graphql/schema and Apollo Sandbox on /graphql outside production.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'opaque',
        description: 'Admin bearer token based on ADMIN_TOKEN',
      },
      'admin-token',
    )
    .addTag('app', 'Basic application endpoints')
    .addTag('health', 'Health check endpoints')
    .addTag('portfolio', 'Portfolio item management')
    .addTag('contact', 'Contact form and messaging')
    .addTag('chat', 'AI chat endpoints')
    .addTag('metrics', 'Operational metrics')
    .addTag('links', 'External links and redirects')
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('api/docs', app, document);
}

export function logBootstrapSuccess(
  logger: Logger,
  appConfiguration: AppRuntimeConfig,
): void {
  logger.log(
    `Starting application on port ${appConfiguration.port} (env: ${appConfiguration.nodeEnv})`,
  );
}
