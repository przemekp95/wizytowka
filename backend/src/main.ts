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
  await app.listen(port);
  console.log(`REST   → http://localhost:${port}/api`);
  console.log(`GraphQL→ http://localhost:${port}/graphql`);
}
void bootstrap();
