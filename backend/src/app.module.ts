import { HelloResolver } from './graphql/hello.resolver';
import { ChatModule } from './chat/chat.module';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { LinksController } from './links.controller';
import { ContactModule } from './contact/contact.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
// TEMP: Disabled global throttling for testing
// import { APP_GUARD } from '@nestjs/core';
// import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PortfolioApiController } from './portfolio/portfolio.controller';
import { AwsModule } from './aws/aws.module';

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { LoggingModule } from './logging/logging.module';
import { MetricsModule } from './metrics/metrics.module';

function createImports() {
  const baseImports = [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'], // backend/.env
    }),

    ThrottlerModule.forRoot([{ ttl: 60, limit: 20 }]),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      path: '/graphql',
      csrfPrevention: false, // Disable CSRF protection for development
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),

    PrismaModule,

    ContactModule,
    PortfolioModule,
    AwsModule,
    LoggingModule,
    MetricsModule,
  ];

  // Add ChatModule only if OPENAI_API_KEY is available
  if (process.env.OPENAI_API_KEY) {
    baseImports.push(ChatModule);
    console.log('🔧 ChatModule enabled - OPENAI_API_KEY available');
  } else {
    console.log('⚠️  ChatModule disabled - OPENAI_API_KEY not available');
  }

  return baseImports;
}

@Module({
  imports: createImports(),
  controllers: [
    AppController,
    HealthController,
    LinksController,
    PortfolioApiController,
  ],
  providers: [
    AppService,
    HelloResolver,
    // TEMP: Disabled global throttling for testing
    // { provide: APP_GUARD, useClass: GqlThrottlerGuard },
  ],
})
export class AppModule {}
