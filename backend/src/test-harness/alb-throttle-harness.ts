import 'reflect-metadata';
import {
  Controller,
  Get,
  Logger,
  Module,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  Args,
  GraphQLModule,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { ConfigModule, ConfigType } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { hostname } from 'node:os';
import { ContactMessageInput } from '../contact/dto/contact-message.input';
import { ContactResult } from '../contact/dto/contact-result.type';
import { GqlThrottleStorageService } from '../common/guards/gql-throttle-storage.service';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { appConfig, mongoConfig, throttleConfig } from '../config';

const logger = new Logger('AlbThrottleHarness');
const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  forbidUnknownValues: false,
});
type ExpressLikeApp = {
  set?: (name: string, value: unknown) => void;
};

@Controller('api/health')
class HarnessHealthController {
  @Get('live')
  live() {
    return {
      ok: true,
      live: true,
      instanceId: process.env.POD_NAME ?? hostname(),
      timestamp: new Date().toISOString(),
    };
  }
}

@Resolver()
@UseGuards(GqlThrottlerGuard)
class HarnessResolver {
  @Query(() => String)
  harnessReady(): string {
    return 'ok';
  }

  @Mutation(() => ContactResult)
  sendContact(@Args('input') input: ContactMessageInput): ContactResult {
    void input;

    return {
      ok: true,
      error: undefined,
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, mongoConfig, throttleConfig],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: '/tmp/alb-throttle-harness-schema.gql',
      sortSchema: true,
      path: '/graphql',
      csrfPrevention: true,
      playground: false,
      introspection: false,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),
  ],
  controllers: [HarnessHealthController],
  providers: [GqlThrottleStorageService, GqlThrottlerGuard, HarnessResolver],
})
class AlbThrottleHarnessModule {}

async function bootstrap() {
  const app = await NestFactory.create(AlbThrottleHarnessModule, {
    logger: ['error', 'warn', 'log'],
  });
  const appConfiguration = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const instanceId = process.env.POD_NAME ?? hostname();
  const port = appConfiguration.port;
  const httpAdapter = app.getHttpAdapter().getInstance() as ExpressLikeApp;

  if (typeof httpAdapter.set === 'function' && appConfiguration.trustProxy) {
    httpAdapter.set('trust proxy', 1);
  }

  app.use((_: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Harness-Instance', instanceId);
    next();
  });
  app.useGlobalPipes(validationPipe);
  await app.listen(port, '0.0.0.0');

  logger.log(`ALB throttle harness started on port ${port} as ${instanceId}`);
}

bootstrap().catch((error) => {
  logger.error(
    'Failed to start ALB throttle harness',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
