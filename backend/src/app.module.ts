import { HelloResolver } from './graphql/hello.resolver';
import { ChatModule } from './chat/chat.module';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { LinksController } from './links.controller';
import { ContactModule } from './contact/contact.module';
import { ConfigModule } from '@nestjs/config';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PortfolioApiController } from './portfolio/portfolio.controller';
import { AwsModule } from './aws/aws.module';

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import type { Request, Response } from 'express';

import { PrismaModule } from './prisma/prisma.module';
import { LoggingModule } from './logging/logging.module';
import { MetricsModule } from './metrics/metrics.module';

function createImports() {
  const baseImports = [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'], // backend/.env
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      path: '/graphql',
      csrfPrevention: true,
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
  providers: [AppService, HelloResolver],
})
export class AppModule {}
