import { registerAs } from '@nestjs/config';
import { readEnvList } from './config.helpers';

export default registerAs('ops', () => {
  const adminTokens = readEnvList(process.env.ADMIN_TOKEN);

  return {
    adminToken: adminTokens[0],
    adminTokens,
  };
});
