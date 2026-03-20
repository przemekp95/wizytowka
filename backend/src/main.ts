import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp, logBootstrapSuccess } from './app.bootstrap';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const port = Number(process.env.PORT) || 3000;
  configureApp(app);
  logBootstrapSuccess(logger, port);
  await app.listen(port);
  logger.log(`Application started successfully on port ${port}`);
}

bootstrap().catch((error) => {
  logger.error(
    'Failed to start application',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
