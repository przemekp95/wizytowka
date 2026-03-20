import { registerAs } from '@nestjs/config';
import { readEnvString } from './config.helpers';

export default registerAs('ops', () => ({
  adminToken: readEnvString(process.env.ADMIN_TOKEN),
}));
