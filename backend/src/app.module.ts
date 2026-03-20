import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AwsModule } from './aws/aws.module';
import { ChatModule } from './chat/chat.module';
import { ContactModule } from './contact/contact.module';
import {
  appConfig,
  awsConfig,
  chatConfig,
  contactConfig,
  loggingConfig,
  mongoConfig,
  opsConfig,
  throttleConfig,
} from './config';
import { GraphqlDocsController } from './graphql/graphql-docs.controller';
import { HelloResolver } from './graphql/hello.resolver';
import { HealthController } from './health.controller';
import { LinksController } from './links.controller';
import { LoggingModule } from './logging/logging.module';
import { MetricsModule } from './metrics/metrics.module';
import { PortfolioApiController } from './portfolio/portfolio.controller';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [
        appConfig,
        awsConfig,
        chatConfig,
        contactConfig,
        loggingConfig,
        mongoConfig,
        opsConfig,
        throttleConfig,
      ],
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [appConfig.KEY],
      useFactory: (
        appConfiguration: ConfigType<typeof appConfig>,
      ): ApolloDriverConfig => ({
        driver: ApolloDriver,
        autoSchemaFile: join(process.cwd(), 'schema.gql'),
        sortSchema: true,
        playground: false,
        introspection: appConfiguration.graphqlIntrospection,
        plugins: [
          appConfiguration.graphqlPlayground
            ? ApolloServerPluginLandingPageLocalDefault()
            : ApolloServerPluginLandingPageDisabled(),
        ],
        path: '/graphql',
        csrfPrevention: true,
        context: ({ req, res }: { req: Request; res: Response }) => ({
          req,
          res,
        }),
      }),
    }),
    PrismaModule,
    ContactModule,
    PortfolioModule,
    AwsModule,
    LoggingModule,
    MetricsModule,
    ChatModule,
  ],
  controllers: [
    AppController,
    GraphqlDocsController,
    HealthController,
    LinksController,
    PortfolioApiController,
  ],
  providers: [AppService, HelloResolver],
})
export class AppModule {}
