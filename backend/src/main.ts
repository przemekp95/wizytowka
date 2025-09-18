// main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet()); // bezpieczne nagłówki
  app.use(cookieParser()); // czytanie/zapisywanie cookies (JWT)
  app.use(new RequestIdMiddleware().use);

  app.enableCors({
    origin: ['http://localhost:3000', process.env.FRONTEND_URL ?? ''].filter(
      Boolean,
    ),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    exposedHeaders: ['Set-Cookie'], // przydatne gdy chcesz widzieć Set-Cookie po stronie frontu
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(Number(process.env.PORT) || 4000);
  console.log(
    `API running on http://localhost:${process.env.PORT || 4000}/api`,
  );
}
void bootstrap();
