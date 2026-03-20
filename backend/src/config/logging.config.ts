import { registerAs } from '@nestjs/config';
import { readEnvString } from './config.helpers';

export default registerAs('logging', () => ({
  level: readEnvString(process.env.LOG_LEVEL) ?? 'info',
}));
