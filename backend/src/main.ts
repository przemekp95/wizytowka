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
  console.log('🚀 Starting NestJS application...');
  console.log(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`🔧 PORT: ${process.env.PORT || 3000}`);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const isProd = process.env.NODE_ENV === 'production';

  console.log('✅ NestJS app created successfully');

  // Proxy (X-Forwarded-For) -> req.ip poprawnie wykryje klienta za reverse proxy
  app.set('trust proxy', 1);

  // --- CORS (ustaw przed Helmet) ---
  // CORS_ORIGINS: lista po przecinku, np.
  // CORS_ORIGINS=https://twoja-domena.pl,https://twoj-frontend.vercel.app
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
      // Brak origin (curl/Postman) -> pozwól
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 600, // cache preflight
  });

  // --- Bezpieczne nagłówki (w dev wyłączamy CSP by ułatwić HMR i local assets) ---
  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(cookieParser());
  app.use(new RequestIdMiddleware().use);

  // Prefiks tylko dla REST (GraphQL nadal pod /graphql)
  app.setGlobalPrefix('api');

  // Walidacja
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  console.log(`🔧 Starting server on port ${port}...`);

  await app.listen(port);
  console.log(`✅ Server listening on port ${port}`);
  console.log(`🌐 REST   → http://localhost:${port}/api`);
  console.log(`🔗 GraphQL→ http://localhost:${port}/graphql`);
  console.log(`💚 Health  → http://localhost:${port}/health`);
  console.log(`📊 Ready   → http://localhost:${port}/health/ready`);
  console.log(`🔄 Live    → http://localhost:${port}/health/live`);
}
void bootstrap();
