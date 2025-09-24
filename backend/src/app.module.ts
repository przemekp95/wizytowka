import { HelloResolver } from './graphql/hello.resolver';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { LinksController } from './links.controller';
import { ContactModule } from './contact/contact.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PortfolioApiController } from './portfolio/portfolio.controller';

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

// ✅ Prisma (global)
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'], // backend/.env
    }),

    ThrottlerModule.forRoot([{ ttl: 60, limit: 20 }]),

    // 🚀 GraphQL (code-first)
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      path: '/graphql',
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),

    // ✅ Globalny provider Prisma
    PrismaModule,

    ContactModule,
    // ProjectModule,
    PortfolioModule,
  ],
  controllers: [
    AppController,
    HealthController,
    LinksController,
    PortfolioApiController,
  ],
  providers: [
    AppService,
    HelloResolver,
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
  ],
})
export class AppModule {}
