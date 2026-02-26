import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { NestExpressApplication } from '@nestjs/platform-express';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.set('trust proxy', 1);

  const envOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedOrigins = new Set<string>([
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ...envOrigins,
  ]);

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 600,
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Performance optimizations
  app.use(
    compression({
      level: 6, // Good balance between speed and compression
      threshold: 1024, // Only compress responses larger than 1KB
    }),
  );

  app.use(cookieParser());
  // Temporary disabled logging middleware for debugging
  // app.use((req: Request, res: Response, next: NextFunction) => {
  //   new RequestIdMiddleware().use(req, res, next);
  // });

  // Apply logging and metrics middleware
  // app.use(LoggingMetricsMiddleware);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Personal Portfolio API')
    .setDescription('REST and GraphQL API for personal portfolio website')
    .setVersion('1.0')
    .addTag('health', 'Health check endpoints')
    .addTag('portfolio', 'Portfolio item management')
    .addTag('contact', 'Contact form and messaging')
    .addTag('links', 'External links and redirects')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  logger.log(
    `Starting application on port ${port} (env: ${process.env.NODE_ENV ?? 'development'})`,
  );
  await app.listen(port);
  logger.log(`Application started successfully on port ${port}`);
}

bootstrap().catch((error) => {
  logger.error('Failed to start application', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
