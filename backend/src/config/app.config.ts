import { registerAs } from '@nestjs/config';
import {
  readEnvBoolean,
  readEnvList,
  readEnvNumber,
  readEnvString,
} from './config.helpers';

export default registerAs('app', () => {
  const nodeEnv = readEnvString(process.env.NODE_ENV) ?? 'development';

  return {
    nodeEnv,
    port: readEnvNumber(process.env.PORT, 3000),
    frontendUrl: readEnvString(process.env.FRONTEND_URL),
    corsOrigins: readEnvList(process.env.CORS_ORIGINS),
    trustProxy: readEnvBoolean(process.env.TRUST_PROXY, false),
    skipPrisma: readEnvBoolean(process.env.SKIP_PRISMA, nodeEnv === 'test'),
    graphqlPlayground: nodeEnv !== 'production',
    graphqlIntrospection: nodeEnv !== 'production',
    apiDocsEnabled:
      nodeEnv !== 'production' ||
      readEnvBoolean(process.env.ENABLE_API_DOCS, false),
    graphqlSchemaDocsEnabled:
      nodeEnv !== 'production' ||
      readEnvBoolean(process.env.ENABLE_GRAPHQL_SCHEMA_DOCS, false),
    internalProxySharedSecret: readEnvString(
      process.env.INTERNAL_PROXY_SHARED_SECRET,
    ),
  };
});
