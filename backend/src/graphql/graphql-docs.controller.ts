import {
  Controller,
  Get,
  Header,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { ConfigType } from '@nestjs/config';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { printSchema } from 'graphql';
import { appConfig } from '../config';

@ApiTags('app')
@Controller('graphql')
export class GraphqlDocsController {
  constructor(
    private readonly schemaHost: GraphQLSchemaHost,
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
  ) {}

  @Get('schema')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @ApiOperation({
    summary: 'Return the current GraphQL SDL schema',
    description:
      'Production-safe GraphQL documentation endpoint. Use this SDL instead of OpenAPI for GraphQL operations.',
  })
  @ApiProduces('text/plain')
  @ApiOkResponse({
    schema: {
      type: 'string',
      example:
        'type Query {\n  hello: String!\n}\n\n type Mutation {\n  sendContact(input: ContactMessageInput!): ContactResult!\n}\n',
    },
  })
  getSchema(): string {
    if (!this.appConfiguration.graphqlSchemaDocsEnabled) {
      throw new NotFoundException();
    }

    return printSchema(this.schemaHost.schema);
  }
}
