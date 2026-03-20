import { Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp, logBootstrapSuccess } from './app.bootstrap';
import { appConfig } from './config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const appConfiguration = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  configureApp(app);
  logBootstrapSuccess(logger, appConfiguration);
  await app.listen(appConfiguration.port);
  logger.log(
    `Application started successfully on port ${appConfiguration.port}`,
  );
}

bootstrap().catch((error) => {
  logger.error(
    'Failed to start application',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
