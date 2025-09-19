/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/unbound-method */

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  // Bezpieczne nagłówki (w dev wyłączamy CSP by ułatwić HMR i local assets)
  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Proxy (X-Forwarded-For) -> req.ip poprawnie wykryje klienta za reverse proxy
  app.set('trust proxy', 1);

  app.use(cookieParser());
  app.use(new RequestIdMiddleware().use);

  // CORS dla frontu lokalnie i ewentualnego URL z ENV
  app.enableCors({
    origin: ['http://localhost:3000', process.env.FRONTEND_URL ?? ''].filter(
      Boolean,
    ),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Prefiks tylko dla REST (GraphQL nadal pod /graphql)
  app.setGlobalPrefix('api');

  // Walidacja DTO (GraphQL + REST)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`REST   → http://localhost:${port}/api`);
  console.log(`GraphQL→ http://localhost:${port}/graphql`);
}
void bootstrap();
