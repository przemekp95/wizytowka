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
  };
});
